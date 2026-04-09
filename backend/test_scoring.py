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
    ("Object-Oriented Programming is a programming style that uses objects and classes to organize code.",
     "OOP stands for Object-Oriented Programming, a paradigm based on objects and classes.",
     "Q1  ✅ CORRECT  - expect 75-95%"),

    ("Inheritance lets a child class get the attributes and behaviors of a parent class.",
     "Inheritance allows a class to reuse properties and methods from another class.",
     "Q2  ✅ CORRECT  - expect 75-95%"),

    ("Python lists store multiple items in order and you can modify them.",
     "A list in Python is an ordered collection of items that can be changed.",
     "Q3  ✅ CORRECT  - expect 75-95%"),

    ("Polymorphism means objects can take many forms.",
     "Polymorphism allows different classes to be treated as the same type through a common interface.",
     "Q4  ⚠️ PARTIAL  - expect 40-65%"),

    ("An index makes searching in a database faster.",
     "A database index improves query speed by creating a fast lookup structure on a column.",
     "Q5  ⚠️ PARTIAL  - expect 40-65%"),

    ("OOP is a type of database used to store objects.",
     "OOP stands for Object-Oriented Programming, a paradigm based on objects and classes.",
     "Q6  ❌ WRONG    - expect 0-20%"),

    ("Inheritance is when you copy and paste code between files.",
     "Inheritance allows a class to reuse properties and methods from another class.",
     "Q7  ❌ WRONG    - expect 0-20%"),

    ("Recursion is a loop that never ends.",
     "Recursion is when a function calls itself directly or indirectly to solve a problem.",
     "Q8  ❌ WRONG    - expect 0-20%"),

    ("A list is a type of function in Python.",
     "A list in Python is an ordered collection of items that can be changed.",
     "Q9  ❌ WRONG    - expect 0-20%"),

    ("An index is the primary key of a table.",
     "A database index improves query speed by creating a fast lookup structure on a column.",
     "Q10 ❌ WRONG    - expect 0-20%"),
]

print("\n========== RESULTS ==========")
for candidate, ideal, label in tests:
    print(f"\n{label}")
    score(candidate, ideal)