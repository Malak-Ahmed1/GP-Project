"""
============================================================
  Mohler Dataset Pipeline
  - Stage 1: Load & inspect dataset
  - Stage 2: Extract features (BGE + DeBERTa)
  - Stage 3: Train learned regressor (replaces hand-tuned rules)
  - Stage 4: Fine-tune BGE embedding model
  - Stage 5: Evaluate with Pearson, Spearman, MAE, RMSE
============================================================

Expected Mohler folder structure (raw distribution):
  mohler/
    1/                        ← question folder
      question.txt
      answer.txt              ← reference/ideal answer
      1.txt, 2.txt ...        ← student answers
      scores/
        1.txt, 2.txt ...      ← one score file per student: "X Y" (two grader scores)
    2/
      ...

If you have the Metzler-edited single CSV version instead, set
DATASET_FORMAT = "csv" and point CSV_PATH to your file.
The CSV version has columns: question, answer, reference_answer, score
(score is already the average of the two graders, 0–5).
"""

import os
import csv
import json
import random
import numpy as np
import torch
from pathlib import Path
from scipy.stats import pearsonr, spearmanr
from sklearn.metrics import mean_absolute_error, mean_squared_error
from sklearn.linear_model import Ridge
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sentence_transformers import SentenceTransformer, util, InputExample, losses
from sentence_transformers import CrossEncoder
from torch.utils.data import DataLoader


# ─────────────────────────────────────────────
# CONFIG  — edit these to match your setup
# ─────────────────────────────────────────────
ANSWERS_CSV_PATH   = r"D:\Hr_User\GP-Project\backend\data\mohler.csv"
QUESTIONS_CSV_PATH = r"D:\Hr_User\GP-Project\backend\data\mohler_questions.csv"

FINETUNE_BGE   = True              # set False to skip fine-tuning (faster)
FINETUNE_SPLIT = 0.5               # fraction of data used for fine-tuning
                                   # the other 0.5 is used for testing
BATCH_SIZE     = 8                 # safe for RTX 3050 4.3GB
FINETUNE_EPOCHS = 3
RANDOM_SEED    = 42

random.seed(RANDOM_SEED)
np.random.seed(RANDOM_SEED)
torch.manual_seed(RANDOM_SEED)

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Using device: {DEVICE}")


# ─────────────────────────────────────────────
# STAGE 1 — Load Mohler dataset
# ─────────────────────────────────────────────

def load_mohler_csv(answers_path: str, questions_path: str):
    """
    Joins your two CSV files on 'id'.

    mohler.csv         columns : id | answer (student) | score | correct
    mohler_questions.csv cols  : id | question         | answer (reference/ideal)
    """
    import pandas as pd

    answers_df   = pd.read_csv(answers_path)
    questions_df = pd.read_csv(questions_path)

    # rename so 'answer' in questions file becomes 'reference'
    questions_df = questions_df.rename(columns={"answer": "reference"})

    merged = answers_df.merge(questions_df, on="id", how="inner")

    records = []
    for _, row in merged.iterrows():
        candidate = str(row["answer"]).strip()
        reference = str(row["reference"]).strip()
        score     = float(row["score"])
        question  = str(row.get("question", "")).strip()
        if not candidate or not reference:
            continue
        records.append({
            "question":  question,
            "reference": reference,
            "candidate": candidate,
            "score":     score        # already averaged, 0–5
        })
    return records


print("\n[1/5] Loading Mohler dataset...")
data = load_mohler_csv(ANSWERS_CSV_PATH, QUESTIONS_CSV_PATH)

print(f"  Loaded {len(data)} records")
print(f"  Score range: {min(r['score'] for r in data):.1f} – "
      f"{max(r['score'] for r in data):.1f}")
print(f"  Mean score: {np.mean([r['score'] for r in data]):.2f}")


# ─────────────────────────────────────────────
# STAGE 2 — Split: 50% fine-tune, 50% test
# ─────────────────────────────────────────────

random.shuffle(data)
split_idx    = int(len(data) * FINETUNE_SPLIT)
finetune_data = data[:split_idx]
test_data     = data[split_idx:]
print(f"\n  Fine-tune split : {len(finetune_data)} samples")
print(f"  Test split      : {len(test_data)} samples")


# ─────────────────────────────────────────────
# STAGE 3 — Load models (GPU-safe sizes)
# ─────────────────────────────────────────────

print("\n[2/5] Loading models...")
# BGE-large: ~1.3GB VRAM  ← fits RTX 3050 comfortably
sim_model = SentenceTransformer("BAAI/bge-large-en-v1.5", device=DEVICE)
# DeBERTa NLI: ~400MB VRAM
ce_model  = CrossEncoder("cross-encoder/nli-deberta-v3-large", device=DEVICE)
print("  Models loaded.")


# ─────────────────────────────────────────────
# STAGE 4 — Fine-tune BGE on 50% of Mohler data
# ─────────────────────────────────────────────
#
# We use CosineSimilarityLoss: the model learns to produce cosine similarity
# that matches the normalized human score (score / 5 → 0–1 range).
# This directly optimises the embedding space for your grading task.

if FINETUNE_BGE:
    print("\n[3/5] Fine-tuning BGE on Mohler training split...")

    train_examples = [
        InputExample(
            texts=[rec["candidate"], rec["reference"]],
            label=rec["score"] / 5.0          # normalise to 0–1
        )
        for rec in finetune_data
    ]

    train_loader = DataLoader(
        train_examples,
        shuffle=True,
        batch_size=BATCH_SIZE
    )
    train_loss = losses.CosineSimilarityLoss(sim_model)

    warmup_steps = int(len(train_loader) * FINETUNE_EPOCHS * 0.1)

    sim_model.fit(
        train_objectives=[(train_loader, train_loss)],
        epochs=FINETUNE_EPOCHS,
        warmup_steps=warmup_steps,
        output_path="./bge-mohler-finetuned",
        show_progress_bar=True,
        use_amp=True            # fp16 — saves VRAM on RTX 3050
    )
    print("  Fine-tuning done. Model saved to ./bge-mohler-finetuned")
else:
    print("\n[3/5] Skipping fine-tuning (FINETUNE_BGE=False).")


# ─────────────────────────────────────────────
# STAGE 5 — Feature extraction helper
# ─────────────────────────────────────────────

def extract_features(candidate: str, reference: str) -> list:
    """
    Returns a 6-dimensional feature vector:
      [cosine_sim, contradiction, entailment, neutral, word_count, length_ratio]
    """
    # BGE embedding similarity
    emb_c = sim_model.encode(candidate, convert_to_tensor=True, normalize_embeddings=True)
    emb_r = sim_model.encode(reference,  convert_to_tensor=True, normalize_embeddings=True)
    cosine = float(util.pytorch_cos_sim(emb_c, emb_r).item())
    cosine = max(0.0, min(1.0, cosine))

    # DeBERTa NLI: label order is [contradiction, neutral, entailment]
    logits = ce_model.predict([(reference, candidate)])[0]
    probs  = np.exp(logits) / np.sum(np.exp(logits))
    contra, neutral, entail = float(probs[0]), float(probs[1]), float(probs[2])

    # Length features
    wc = len(candidate.split())
    lr = wc / max(1, len(reference.split()))

    return [cosine, contra, entail, neutral, wc, lr]


# ─────────────────────────────────────────────
# STAGE 6 — Build feature matrix for test split
# ─────────────────────────────────────────────

print("\n[4/5] Extracting features from test split...")
print("  (This takes a few minutes on GPU — ~2273 samples total)")

X_test, y_test = [], []
for i, rec in enumerate(test_data):
    feats = extract_features(rec["candidate"], rec["reference"])
    X_test.append(feats)
    y_test.append(rec["score"])
    if (i + 1) % 100 == 0:
        print(f"  Processed {i+1}/{len(test_data)}")

X_test = np.array(X_test)
y_test = np.array(y_test)


# ─────────────────────────────────────────────
# STAGE 7 — Train learned regressor on fine-tune split features
#
# We also extract features for the fine-tune split so we can train
# the regressor. This is separate from the embedding fine-tuning above.
# ─────────────────────────────────────────────

print("\n  Extracting features from fine-tune split for regressor training...")
X_train, y_train = [], []
for i, rec in enumerate(finetune_data):
    feats = extract_features(rec["candidate"], rec["reference"])
    X_train.append(feats)
    y_train.append(rec["score"])
    if (i + 1) % 100 == 0:
        print(f"  Processed {i+1}/{len(finetune_data)}")

X_train = np.array(X_train)
y_train = np.array(y_train)

# Scale features
scaler  = StandardScaler()
X_train_s = scaler.fit_transform(X_train)
X_test_s  = scaler.transform(X_test)

# Train two regressors and compare
ridge = Ridge(alpha=1.0)
ridge.fit(X_train_s, y_train)

gbm = GradientBoostingRegressor(
    n_estimators=200,
    max_depth=3,
    learning_rate=0.05,
    random_state=RANDOM_SEED
)
gbm.fit(X_train_s, y_train)
print("  Regressors trained.")


# ─────────────────────────────────────────────
# STAGE 8 — Evaluate
# ─────────────────────────────────────────────

def evaluate(y_true, y_pred, label=""):
    y_pred_clipped = np.clip(y_pred, 0, 5)
    pearson  = pearsonr(y_true, y_pred_clipped)[0]
    spearman = spearmanr(y_true, y_pred_clipped)[0]
    mae      = mean_absolute_error(y_true, y_pred_clipped)
    rmse     = np.sqrt(mean_squared_error(y_true, y_pred_clipped))
    print(f"\n  ── {label} ──")
    print(f"  Pearson  r : {pearson:.4f}   (target > 0.85)")
    print(f"  Spearman ρ : {spearman:.4f}  (target > 0.80)")
    print(f"  MAE        : {mae:.4f}       (target < 0.40 on 0–5 scale)")
    print(f"  RMSE       : {rmse:.4f}      (target < 0.60 on 0–5 scale)")
    return {"pearson": pearson, "spearman": spearman, "mae": mae, "rmse": rmse}


print("\n[5/5] EVALUATION RESULTS")

# Baseline: cosine similarity alone × 5 (no regressor)
cosine_baseline = X_test[:, 0] * 5.0
evaluate(y_test, cosine_baseline, "Baseline: cosine×5 only")

# Ridge regressor
ridge_preds = ridge.predict(X_test_s)
evaluate(y_test, ridge_preds, "Ridge Regressor (learned)")

# Gradient Boosting
gbm_preds = gbm.predict(X_test_s)
evaluate(y_test, gbm_preds, "GradientBoosting Regressor (learned)")


# ─────────────────────────────────────────────
# INFERENCE FUNCTION — use this in your app
# ─────────────────────────────────────────────

def score_answer(candidate: str, reference: str, regressor=gbm) -> float:
    """
    Predict a score (0–5) for a candidate answer given a reference answer.
    Uses the trained GBM regressor + fine-tuned BGE embeddings.
    Returns a float like 4.5, 3.2, etc.
    """
    feats = extract_features(candidate, reference)
    feats_scaled = scaler.transform([feats])
    predicted = float(regressor.predict(feats_scaled)[0])
    predicted = round(max(0.0, min(5.0, predicted)), 1)
    return predicted


# Quick demo
print("\n── Demo predictions ──")
demo_pairs = [
    ("A variable is a named location in memory that stores a value.",
     "A variable is a location in memory that can store a value."),
    ("I don't know.",
     "A variable is a location in memory that can store a value."),
    ("A prototype simulates behavior of parts of the software product.",
     "A prototype program is used to simulate the behavior of portions of the desired software product."),
]
for cand, ref in demo_pairs:
    s = score_answer(cand, ref)
    print(f"  Score: {s}/5  |  '{cand[:60]}...'")


print("\nDone.")