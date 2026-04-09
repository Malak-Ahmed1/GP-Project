import numpy as np
from sentence_transformers import SentenceTransformer, util
from sentence_transformers import CrossEncoder

sim_model = SentenceTransformer("BAAI/bge-large-en-v1.5")
ce_model = CrossEncoder("cross-encoder/nli-deberta-v3-large")

def semantic_similarity(text_a, text_b):
    prefix = "Represent this sentence for searching relevant passages: "
    a = sim_model.encode(prefix + text_a, convert_to_tensor=True, normalize_embeddings=True)
    b = sim_model.encode(prefix + text_b, convert_to_tensor=True, normalize_embeddings=True)
    return max(0.0, min(1.0, util.pytorch_cos_sim(a, b).item()))

def get_nli(text_a, text_b):
    logits = ce_model.predict([(text_a, text_b)])[0]
    probs = np.exp(logits) / np.sum(np.exp(logits))
    return float(probs[0]), float(probs[2])  # contradiction, entailment

import requests, re

def score(candidate, ideal):
    prompt = f"""You are a strict answer grader.

Ideal answer: {ideal}
Candidate answer: {candidate}

Score the candidate from 0 to 100 based on correctness of meaning.
- 80-100: correct meaning, even if different words
- 40-65: partially correct, missing key concepts  
- 0-20: wrong or unrelated

Reply with ONLY a single integer number, nothing else."""

    try:
        r = requests.post("http://localhost:11434/api/generate",
            json={"model": "llama3", "prompt": prompt, "stream": False},
            timeout=120)
        text = r.json()["response"].strip()
        nums = re.findall(r'\d+', text)
        val = int(nums[0]) if nums else 50
        val = min(100, max(0, val))
        print(f"  LLM response: '{text}' → FINAL={val}%")
    except Exception as e:
        print(f"  ERROR: {e}")

tests = [
    ("A variable stores a value in memory that can be used later in the program.",
     "A variable is a named storage location in memory that holds a value.",
     "Q1  ✅ CORRECT  - expect 75-95%"),

    ("An API lets different software applications talk to each other and share data.",
     "An API is a set of rules that allows programs to communicate with each other.",
     "Q2  ✅ CORRECT  - expect 75-95%"),

    ("A loop repeats a block of code multiple times until a condition is met.",
     "A loop is a control structure that executes a block of code repeatedly based on a condition.",
     "Q3  ✅ CORRECT  - expect 75-95%"),

    ("Git is a tool that tracks changes in code and helps teams collaborate.",
     "Git is a distributed version control system used to track changes in source code.",
     "Q4  ✅ CORRECT  - expect 75-95%"),

    ("Encapsulation hides data inside a class.",
     "Encapsulation is the principle of bundling data and methods together and restricting direct access to some components.",
     "Q5  ⚠️ PARTIAL  - expect 40-65%"),

    ("An exception is an error that happens while the program runs.",
     "An exception is an event that disrupts the normal flow of a program and must be handled to prevent crashes.",
     "Q6  ⚠️ PARTIAL  - expect 40-65%"),

    ("A variable is a type of loop used in Python.",
     "A variable is a named storage location in memory that holds a value.",
     "Q7  ❌ WRONG    - expect 0-20%"),

    ("An API is a database that stores user information.",
     "An API is a set of rules that allows programs to communicate with each other.",
     "Q8  ❌ WRONG    - expect 0-20%"),

    ("Git is a programming language used to build websites.",
     "Git is a distributed version control system used to track changes in source code.",
     "Q9  ❌ WRONG    - expect 0-20%"),

    ("Encapsulation is when a function calls itself recursively.",
     "Encapsulation is the principle of bundling data and methods together and restricting direct access to some components.",
     "Q10 ❌ WRONG    - expect 0-20%"),
]

print("\n========== RESULTS ==========")
for candidate, ideal, label in tests:
    print(f"\n{label}")
    score(candidate, ideal)