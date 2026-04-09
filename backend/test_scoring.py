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

def get_contradiction(transcript, ideal):
    logits = ce_model.predict([(ideal, transcript)])[0]
    probs = np.exp(logits) / np.sum(np.exp(logits))
    return float(probs[0]), float(probs[2])

def score(candidate, ideal):
    bi = semantic_similarity(candidate, ideal)
    contra, entail = get_contradiction(candidate, ideal)

    if contra > 0.7:
        similarity = bi * 0.1        # clearly wrong
    elif contra > 0.4:
        similarity = bi * 0.3        # probably wrong
    elif contra > 0.2:
        similarity = bi * 0.6        # uncertain
    else:
        similarity = bi              # correct — trust BGE fully

    word_count = len(candidate.split())
    if word_count < 3:
        similarity *= 0.4
    elif word_count < 8:
        similarity *= 0.75

    similarity = round(max(0.0, min(1.0, similarity)), 2)
    print(f"  BGE={round(bi,2)} | Contra={round(contra,2)} | Entail={round(entail,2)} | FINAL={round(similarity*100)}%")

tests = [
    # ✅ CORRECT
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

    # ⚠️ PARTIAL
    ("Encapsulation hides data inside a class.",
     "Encapsulation is the principle of bundling data and methods together and restricting direct access to some components.",
     "Q5  ⚠️ PARTIAL  - expect 40-65%"),

    ("An exception is an error that happens while the program runs.",
     "An exception is an event that disrupts the normal flow of a program and must be handled to prevent crashes.",
     "Q6  ⚠️ PARTIAL  - expect 40-65%"),

    # ❌ WRONG
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