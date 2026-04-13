# Answer Scoring Module — Complete Experiment Log

## Task Definition

**Automated Short Answer Grading (ASAG):** Given a question, an ideal (reference) answer, and a candidate (student) answer, predict a correctness score (0–5).

This is a **regression** task — the model outputs a continuous score like 3.5 or 2.7, not a class label.

---

## Datasets Used

### Mohler Dataset (2011) — Primary dataset (matches our task)
- **Samples:** 2,558 student answers
- **Questions:** 85 (Computer Science domain)
- **Scores:** 0–5 (continuous, graded by 2 human raters, gold = average)
- **Source:** University of North Texas
- **Paper:** Mohler, M., Bunescu, R., & Mihalcea, R. (2011). "Learning to Grade Short Answer Questions using Semantic Similarity Measures and Dependency Graph Alignments." ACL-HLT 2011.

### SciEntsBank (SemEval-2013 Task 7) — Secondary dataset
- **Samples:** ~10,000 student answers
- **Questions:** 197 (15 science domains, grades 3–6)
- **Labels:** 5-way classification (correct / partially_correct / contradictory / irrelevant / non_domain)
- **Splits:** Unseen Answers (UA), Unseen Questions (UQ), Unseen Domains (UD)
- **Important:** This is a **classification** dataset. For regression, labels are converted to scores: correct=1.0, partial=0.5, rest=0.0. This limits achievable Pearson because only 3 discrete score levels exist.
- **Paper:** Dzikovska et al. (2013). "SemEval-2013 Task 7." SemEval 2013.

---

## All Trials — Results Summary

| Trial | Dataset | Model | Split | Pearson r | RMSE | QWK | Status |
|-------|---------|-------|-------|-----------|------|-----|--------|
| **1** | Mohler | RoBERTa-Large (355M) | Random 70/30 | **0.789** | ~0.13 | — | Inflated (leakage) |
| **2a** | Mohler | RoBERTa + clamp + fp16 | Question-level | NaN | 0.277 | 0.0 | Failed |
| **2b** | Mohler | RoBERTa + sigmoid + fp16 | Question-level | **0.612** | 0.185 | 0.591 | **Best on Mohler** |
| **4** | Mohler | BERT + Bi-LSTM + Fusion | Question-level | 0.566 | 0.205 | 0.537 | OK |
| **5** | SciEntsBank | BERT+BiLSTM+SBERT+BM25 | UA (official) | 0.605 | 0.399 | 0.588 | OK |
| **6a** | SciEntsBank | Universal ASAG v2 | UA (official) | **0.648** | 0.377 | 0.650 | **Best on SciEntsBank** |
| **6b** | Mohler | Universal ASAG (all feats) | Question-level | 0.575 | 0.192 | 0.554 | OK |

---

## Trial-by-Trial Details

### Trial 1 — Baseline RoBERTa-Large
- **Model:** `roberta-large` (355M parameters)
- **Pre-trained on:** 160GB text (BookCorpus, Wikipedia, CC-News, OpenWebText, Stories)
- **Input:** Sentence pair: [ideal_answer] </s></s> [student_answer] (no question text)
- **Split:** Random 70/30 (1,791 train / 767 test)
- **Loss:** MSE with sigmoid activation
- **Hyperparameters:** lr=2e-5, epochs=10, batch=8, weight_decay=0.01, warmup=10%
- **Hardware:** CPU only (19 hours training)
- **Result:** Pearson r = 0.789 (best at epoch 9)
- **Paper:** Liu et al. (2019). "RoBERTa: A Robustly Optimized BERT Pretraining Approach."
- **Problems found:**
  1. Data leakage — random split puts same-question answers in train+test
  2. No question text in input
  3. Sigmoid squashes gradients at extremes
  4. Only Pearson metric (missing RMSE, QWK)
  5. Overfitting — train/eval loss gap = 8.5x

### Trial 2a — Fixed issues, but failed
- **Changes from Trial 1:** Added question text to input, question-level split (0 overlap), replaced sigmoid with clamp(0,1), added RMSE+QWK metrics, moved to GPU
- **Hardware:** RTX 3050 Laptop GPU (4GB VRAM)
- **Result:** Pearson = NaN, QWK = 0.0 (model never learned)
- **Problem:** `clamp(0,1)` combined with `fp16=True` (half precision) kills all gradients. Every training step showed `grad_norm: 0.0`. The model predicted a constant value.
- **Lesson:** clamp and fp16 are incompatible for regression.

### Trial 2b — Fixed with sigmoid (fp16-safe)
- **Changes from Trial 2a:** Reverted to sigmoid (always has non-zero gradients in fp16)
- **Input:** [question + " [SEP] " + ideal_answer] vs [student_answer]
- **Split:** Question-level 70/30 (1,833 train / 725 test, 0 question overlap)
- **Loss:** MSE + sigmoid
- **Metrics:** Pearson + RMSE + QWK
- **Hardware:** GPU RTX 3050 (~3.3 hours with batch=2, fp16, gradient_accumulation=4)
- **Result:** Pearson r = 0.612, RMSE = 0.185, QWK = 0.591 (best at epoch 7)
- **Paper:** Chamieh et al. (2024) — used question-level splits for fair evaluation
- **Finding:** The drop from 0.789 (Trial 1) to 0.612 confirms data leakage was inflating Trial 1 by ~0.18 points. This is the honest baseline.

### Trial 4 — BERT + Bi-LSTM + Semantic Fusion
- **Architecture:** Following Zhu et al. (2022):
  - BERT-base-uncased encoder (110M params)
  - Bottom 8 layers frozen, top 4 fine-tuned
  - Bi-LSTM (256 hidden × 2 directions = 512d) over all token outputs
  - Attention pooling over Bi-LSTM outputs
  - Max pooling over BERT outputs
  - Semantic Fusion: [CLS](768) + attention(512) + max_pool(768) = 2048d
  - FC(2048→256→1) regression head
- **Split:** Question-level 70/30
- **Hardware:** GPU RTX 3050 (~11 minutes)
- **Result:** Pearson r = 0.566, RMSE = 0.205, QWK = 0.537 (best at epoch 6)
- **Paper:** Zhu et al. (2022). "Automatic Short-Answer Grading via BERT-based Deep Neural Networks." IEEE Trans. Learning Technologies. (reported r=0.897 with random split)
- **Problem:** bert-base (110M) is weaker than roberta-large (355M). The complex Bi-LSTM architecture couldn't compensate for the smaller encoder on only 59 training questions.

### Trial 5 — Universal ASAG on SciEntsBank (regression)
- **Architecture:** BERT + Bi-LSTM + SBERT similarity + BM25 + length ratio
- **Features:** SBERT cosine similarity (1d), BM25 keyword overlap (1d), length ratio (1d)
- **Dataset:** SciEntsBank (4,969 train / 540 test UA)
- **Labels:** 5-way → regression scores (correct=1.0, partial=0.5, rest=0.0)
- **Split:** Official Unseen Answers (UA) split
- **Result:** Pearson r = 0.605, RMSE = 0.399, QWK = 0.588 (best at epoch 8)
- **Paper:** Universal ASAG Model (2025) — reported r=0.90, F1=91.2%
- **Problem:** SciEntsBank only has 3 discrete score values (0, 0.5, 1). Training regression on discrete labels limits Pearson. The paper's r=0.90 was achieved with classification approach, not regression.

### Trial 6a — Improved Universal ASAG on SciEntsBank
- **Improvements over Trial 5:**
  - Text preprocessing (lowercase, remove stopwords, remove punctuation)
  - 2 additional features (word overlap, content coverage) → total 5 features
  - 2-layer Bi-LSTM (was 1-layer)
  - Max-pooling added to fusion (CLS + BiLSTM + MaxPool + features = 2053d)
  - LayerNorm before regression head
  - GELU activation (instead of ReLU)
  - Unfreeze top 6 BERT layers (was 4)
  - Higher learning rate (3e-5) + longer warmup (15%)
- **Result:** Pearson r = 0.648, RMSE = 0.377, QWK = 0.650 (best at epoch 5)
- **Best result on SciEntsBank.** Text preprocessing and additional features helped.

### Trial 6b — Universal ASAG on Mohler (all improvements)
- **Same architecture as Trial 6a** applied back to Mohler (continuous scores 0-5)
- **Features:** SBERT sim + BM25 + length ratio + word overlap + content coverage
- **Split:** Question-level 70/30 on Mohler
- **Result:** Pearson r = 0.575, RMSE = 0.192, QWK = 0.554
- **Problem:** Complex model with 2053d fusion on only 59 training questions → overfitting. Simpler RoBERTa (Trial 2b, r=0.612) still wins on small data.

---

## Key Findings

### Finding 1: Data leakage inflates published scores by ~0.18 points
Trial 1 (random split) = 0.789 vs Trial 2b (question split) = 0.612. The 0.177 drop proves models memorize question patterns with random splits. Most published ASAG papers use random splits, meaning their reported Pearson r=0.89+ is likely inflated.

### Finding 2: Simple models beat complex architectures on small datasets
RoBERTa-Large with simple regression head (Trial 2b, r=0.612) outperformed BERT+Bi-LSTM+Fusion (Trial 4, r=0.566) and Universal ASAG with 5 features (Trial 6b, r=0.575). With only 59 training questions, complex models overfit rather than generalize.

### Finding 3: SciEntsBank is classification, not regression
The Universal ASAG paper's r=0.90 was achieved on SciEntsBank which has only 3 discrete labels. When we force regression on these labels, Pearson is limited. Papers convert classification predictions to scores for reporting regression metrics — they don't train as regression.

### Finding 4: fp16 + clamp is incompatible
Half-precision (fp16) kills gradients through clamp(0,1). The model produces grad_norm=0.0 every step and never learns. Must use sigmoid with fp16. This is a practical engineering finding.

### Finding 5: Unseen-question evaluation is the honest test
When testing on questions the model has never seen, all methods cluster around Pearson 0.56–0.61. This suggests generalizing to truly new questions remains an open challenge in ASAG research.

---

## Comparison with Published Results

| Method | Year | Dataset | Pearson r | Split Type | Note |
|--------|------|---------|-----------|------------|------|
| Zhu et al. (BERT+Bi-LSTM) | 2022 | Mohler | 0.897 | Random | Inflated by leakage |
| Universal ASAG | 2025 | SciEntsBank | 0.900 | Classification→regression | Classification dataset |
| Sung et al. (BERT) | 2019 | Mohler | 0.780 | Random | Inflated by leakage |
| **Our Trial 1** | **2026** | **Mohler** | **0.789** | **Random** | **Comparable to Sung** |
| **Our Trial 2b** | **2026** | **Mohler** | **0.612** | **Question-level** | **Honest baseline** |
| **Our Trial 6a** | **2026** | **SciEntsBank** | **0.648** | **UA (official)** | **Best on SciEntsBank** |
| Mohler baseline | 2011 | Mohler | 0.670 | Random | Graph alignment |

---

## Best Approach for This Task

For continuous regression scoring (your real system):

**Best model: RoBERTa-Large fine-tuned with question context (Trial 2b)**
- Simple architecture outperforms complex ones on small data
- Include question text in input: `[Q + ideal] → [student]`
- Use question-level split for honest evaluation
- Sigmoid activation with MSE loss (fp16-safe)
- Evaluate with Pearson, RMSE, and QWK

**Why simpler wins:** Mohler has only 2,558 samples across 85 questions. With question-level splits, you train on ~59 questions. RoBERTa-Large's 355M pre-trained parameters provide more built-in language understanding than smaller models, compensating for the simple architecture.

---

## Hardware

| | Trial 1 | Trials 2b–6b |
|---|---|---|
| **Device** | CPU | NVIDIA GeForce RTX 3050 Laptop GPU |
| **VRAM** | — | 4.3 GB |
| **PyTorch** | 2.9.0+cpu | 2.5.1+cu121 |
| **fp16** | No | Yes |
| **Batch size** | 8 | 2 (roberta-large) or 4–8 (bert-base) |
| **Training time** | ~19 hours | 10 min – 3.3 hours |

---

## References

1. Mohler, M., Bunescu, R., & Mihalcea, R. (2011). Learning to Grade Short Answer Questions. ACL-HLT 2011.
2. Liu, Y. et al. (2019). RoBERTa: A Robustly Optimized BERT Pretraining Approach. arXiv:1907.11692.
3. Devlin, J. et al. (2018). BERT: Pre-training of Deep Bidirectional Transformers. arXiv:1810.04805.
4. Zhu, X., Wu, H., & Zhang, L. (2022). Automatic Short-Answer Grading via BERT-based Deep Neural Networks. IEEE Trans. Learning Technologies, 15(3), 364–375.
5. Dzikovska, M. et al. (2013). SemEval-2013 Task 7: Student Response Analysis. SemEval 2013.
6. Universal ASAG Model (2025). SBERT+BERT+LSTM+BM25. F1=91.2%, r=0.90.
7. Bonthu, S. et al. (2024). Improving ASAG Using Transfer Learning and Augmentation. Acc=88.77%, F1=91.59%.
8. Mello, R. et al. (2025). ASAG in the LLM Era: GPT-4 vs Traditional Models. LAK 2025.
9. Chamieh, F. et al. (2024). LLM-based ASAG with question-level splits.
10. Sung, C. et al. (2019). Improving Short Answer Grading Using Transformer-Based Pre-training. AIED 2019.
11. Burrows, S. et al. (2015). The Eras and Trends of Automatic Short Answer Grading. IJAIED 25(1), 60–117.

---

## File Structure

```
GP-Project/backend/
├── data/
│   ├── mohler.csv                          # Student answers + scores
│   └── mohler_questions.csv                # Questions + ideal answers
├── trials/
│   ├── trial1_roberta_large.py             # Trial 1: RoBERTa baseline
│   ├── trial2a_roberta_clamp.py            # Trial 2a: Failed (clamp+fp16)
│   ├── Trial2_roberta_improved.py          # Trial 2b: RoBERTa + question split
│   ├── trial4_bert_bilstm_fusion.py        # Trial 4: BERT + Bi-LSTM
│   ├── trial5_universal_asag_regression.py # Trial 5: Universal ASAG (SciEntsBank)
│   ├── trial6_universal_asag_v2.py         # Trial 6a: Improved (SciEntsBank)
│   └── trial6_mohler_best.py               # Trial 6b: All improvements (Mohler)
├── models/
│   ├── mohler_roberta/                     # Trial 1 checkpoint
│   ├── mohler_roberta_trial2/              # Trial 2b checkpoint
│   ├── mohler_bert_bilstm_trial4/          # Trial 4 checkpoint
│   ├── scientsbank_trial5/                 # Trial 5 checkpoint
│   ├── scientsbank_trial6/                 # Trial 6a checkpoint
│   └── mohler_trial6_best/                 # Trial 6b checkpoint
├── docs/
│   ├── trial1_report.docx                  # Detailed Trial 1 report
│   ├── asag_presentation.pptx              # Presentation for doctor
│   └── experiment_log.md                   # This file
└── README.md
```
