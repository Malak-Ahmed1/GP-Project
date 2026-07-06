import os
import sys
import json
import subprocess
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer, pipeline
import torch
from sentence_transformers import SentenceTransformer, util
import google.generativeai as genai
import openai
from faster_whisper import WhisperModel
from sentence_transformers import CrossEncoder
from dotenv import load_dotenv
import re
import numpy as np





# ---- LOAD ENV VARIABLES ----
load_dotenv()

# Load your OpenAI API key from .env
openai.api_key = os.getenv("OPENAI_API_KEY")





genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))



# ---- CHECK COMMAND-LINE ARGUMENTS ----
if len(sys.argv) < 4:
    print(json.dumps({"error": "Usage: python script.py <video_path> <ideal_answer> <question>"}))
    sys.exit(1)

video_path = sys.argv[1]
ideal_answer = sys.argv[2]
question = sys.argv[3]


# ---- CONFIG ----
os.environ["TRANSFORMERS_CACHE"] = r"C:\Users\yasmi\.cache\huggingface"

os.environ["IMAGEIO_FFMPEG_EXE"] = r"C:\Users\yasmi\Downloads\ffmpeg-8.0\ffmpeg-8.0-essentials_build\bin\ffmpeg.exe"




from transformers import AutoModelForSequenceClassification
MODEL_PATH = r"E:\Hr_User\GP-Project\backend\mohler_roberta_trial2"
tokenizer_trial2b = AutoTokenizer.from_pretrained(MODEL_PATH)
trial2b_model = AutoModelForSequenceClassification.from_pretrained(MODEL_PATH, num_labels=1)
trial2b_model.eval()
# if torch.cuda.is_available():
#     trial2b_model = trial2b_model.cuda()


def clean_asr(text: str) -> str:
    text = text.strip()
    text = re.sub(r"\s+", " ", text)
    # remove repeated filler/noise tokens
    text = re.sub(r"\b(um+|uh+|er+|ah+)\b", "", text, flags=re.IGNORECASE)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def normalize_text(text):
    text = text.lower()
    text = re.sub(r"[^\w\s]", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text

def semantic_similarity(text_a, text_b, model):
    instruction = "Retrieve semantically similar answers to grade correctness"
    a = model.encode([[instruction, text_a]], normalize_embeddings=True)
    b = model.encode([[instruction, text_b]], normalize_embeddings=True)
    score = float(util.pytorch_cos_sim(a, b).item())
    score = max(0.0, min(1.0, score))
    print(f"Semantic : {round(score, 2)}")
    return score



# ---- MAIN PROCESS ----
try:
    # Step 1: Prepare the Hugging Face Whisper pipeline (open-source)
    print("Loading open-source Whisper model from Hugging Face (this may download once)...")
    # choose device: 0 for GPU, -1 for CPU
    device = 0 if torch.cuda.is_available() else -1

#     whisper_model = WhisperModel(
#     "large-v3",
#     device="cuda" if torch.cuda.is_available() else "cpu",
#     compute_type="float16" if torch.cuda.is_available() else "int8"
# )
    whisper_model = WhisperModel(
        "large-v3",
        device="cuda" if torch.cuda.is_available() else "cpu",
        compute_type="int8_float16" if torch.cuda.is_available() else "int8"
    )

    print("Whisper model (Hugging Face) loaded.")

    # Step 2: Convert video to mono 16kHz WAV
    audio_file = "temp_audio.wav"
    print("Extracting audio from video...")
    subprocess.run([
    os.environ["IMAGEIO_FFMPEG_EXE"],
    "-i", video_path,
    "-af", "highpass=f=100,lowpass=f=4000,afftdn=nf=-25,volume=2.0",
    "-ac", "1",
    "-ar", "16000",
    audio_file,
    "-y"
], check=True)


    print("Audio extracted.")

    # Step 3: Transcribe audio using HF pipeline
    print("Transcribing audio...")
    # The pipeline accepts a path to the file
    segments, info = whisper_model.transcribe(
    audio_file,
    language="en",
    beam_size=5,           # higher = more accurate
    best_of=5,             # tries 5 candidates, picks best
    temperature=0.0,       # deterministic = more consistent
    vad_filter=True,       # removes silence automatically
    vad_parameters=dict(min_silence_duration_ms=500),
    initial_prompt=ideal_answer  # THIS WORKS in faster-whisper!
)
    raw_transcript = " ".join([seg.text for seg in segments])
    print("Transcription complete.")
    # Optionally delete temp audio when done:
    # os.remove(audio_file)

    polished_transcript = clean_asr(raw_transcript)
    # polished_transcript = raw_transcript  # no polishing, whisper is good enough

    # Step 5: Compute semantic similarity
    print("Computing similarity...")
    # Fast semantic (bi-encoder)
    def predict_score(question, ideal, student):
        context = question + " [SEP] " + ideal
        encoding = tokenizer_trial2b(
            context,
            student,
            truncation=True,
            max_length=256,
            padding="max_length",
            return_tensors="pt"
        )
        # if torch.cuda.is_available():
        #     encoding = {k: v.cuda() for k, v in encoding.items()}
        with torch.no_grad():
            output = trial2b_model(**encoding)
            score = torch.sigmoid(output.logits).item()
        return round(max(0.0, min(1.0, score)), 2)

    similarity = predict_score(question, ideal_answer, polished_transcript)

    word_count = len(polished_transcript.split())
    if word_count < 3:
        similarity *= 0.4
    elif word_count < 8:
        similarity *= 0.75

    similarity = round(max(0.0, min(1.0, similarity)), 2)
    print(f"FINAL : {similarity}")

    # Step 6: Return JSON
    percent = round(max(0.0, similarity) * 100, 1)

    print(json.dumps({
    "raw_transcript": raw_transcript,
    "polished_transcript": polished_transcript,
    "similarity": round(similarity, 2),
    "percentage": f"{percent}%"
}))

except Exception as e:
    print(json.dumps({"error": str(e)}))
    sys.exit(1)





# import os
# import sys
# import json
# import subprocess
# from transformers import AutoModelForSeq2SeqLM, AutoTokenizer, pipeline
# import torch
# from sentence_transformers import SentenceTransformer, util
# import google.generativeai as genai
# import openai
# from faster_whisper import WhisperModel
# from sentence_transformers import CrossEncoder
# from dotenv import load_dotenv
# import re
# import numpy as np





# # ---- LOAD ENV VARIABLES ----
# load_dotenv()

# # Load your OpenAI API key from .env
# openai.api_key = os.getenv("OPENAI_API_KEY")





# genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))



# # ---- CHECK COMMAND-LINE ARGUMENTS ----
# if len(sys.argv) < 3:
#     print(json.dumps({"error": "Usage: python script.py <video_path> <ideal_answer>"}))
#     sys.exit(1)

# video_path = sys.argv[1]    # Video file path
# ideal_answer = sys.argv[2]  # Ideal answer for similarity comparison


# # ---- CONFIG ----
# os.environ["TRANSFORMERS_CACHE"] = r"C:\Users\yasmi\.cache\huggingface"

# os.environ["IMAGEIO_FFMPEG_EXE"] = r"C:\Users\yasmi\Downloads\ffmpeg-8.0\ffmpeg-8.0-essentials_build\bin\ffmpeg.exe"


# # device = 0 if torch.cuda.is_available() else -1
# # model_name = "google/flan-t5-base"
# # tokenizer = AutoTokenizer.from_pretrained(model_name)
# # model = AutoModelForSeq2SeqLM.from_pretrained(model_name)
# # generator = pipeline(
# #     "text2text-generation",
# #     model=model,
# #     tokenizer=tokenizer,
# #     device=device
# # )


# # # ---- CONFIGURE GEMINI USING NEW PACKAGE ----
# # from google.genai import Client

# # # Initialize the client with your API key
# # client = Client(api_key="AIzaSyDoHA1_FEcR2ssQMdGLUuMWqegtofqXa_0")



# # ---- FREE LOCAL POLISHING ----




# # MODEL_NAME = "google/flan-t5-large"

# # tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
# # model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_NAME)

# # polish_pipeline = pipeline(
# #     task="text2text-generation",
# #     model=model,
# #     tokenizer=tokenizer,
# #     do_sample=False
# # )

# # def polish_transcript(raw_text, question_text, ideal_answer):
# #     """
# #     Polishes transcript using OpenAI GPT with ideal answer as a hint.
# #     """
# #     prompt = f"""
# # You are a speech-to-text correction assistant.

# # The interview question asked was: "{question_text}"

# # The expected answer contains these key concepts and terms: "{ideal_answer}"

# # Whisper transcribed the interviewee's spoken answer as: "{raw_text}"

# # Your job is ONLY to fix these problems:
# # 1. Words that Whisper got wrong because of the speaker's accent
# #    (Example: speaker said "tuple" but Whisper wrote "table" — fix it to "tuple")
# #    (Use the key concepts from the expected answer as hints for what word was likely said)
# # 2. Remove filler words like "um", "uh", "like", "you know"
# # 3. Fix grammar mistakes
# # 4. Fix obvious spelling errors

# # STRICT RULES — you MUST follow these:
# # - Do NOT add any new information or concepts
# # - Do NOT add examples that the speaker did not mention
# # - Do NOT make the answer longer
# # - Do NOT make it sound smarter or more complete
# # - Only fix errors — keep the speaker's original meaning and structure

# # Return ONLY the corrected transcript. Nothing else.
# # """
# #     try:
# #         response = openai.chat.completions.create(
# #             model="gpt-4o-mini",  # Better than gpt-3.5-turbo, still cheap
# #             messages=[
# #                 {
# #                     "role": "system",
# #                     "content": "You are a transcript correction tool. You ONLY fix speech-to-text errors. You NEVER add new information."
# #                 },
# #                 {"role": "user", "content": prompt}
# #             ],
# #             temperature=0,
# #             max_tokens=512
# #         )
# #         polished_text = response.choices[0].message.content.strip()

# #         # Debug: print both so you can see if it changed
# #         print("RAW TEXT:      ", raw_text)
# #         print("POLISHED TEXT: ", polished_text)

# #         return polished_text
# #     except Exception as e:
# #         print("Polishing failed, returning raw text.")
# #         print("Error:", e)
# #         return raw_text


# # def polish_transcript(raw_text, question_text):
# #     """
# #     Polishes a transcript using a local Flan-T5 model (free, no API key needed).
# #     The function mimics the same instructions you gave to Gemini.
# #     """
# #     prompt = f"""
# # You are helping to clean and understand an interview answer.
# # The interviewee was asked this question: "{question_text}"

# # Their answer was transcribed as: "{raw_text}"

# # Your task:
# # - Correct grammar and spelling mistakes
# # - Organize sentences clearly
# # - Keep the meaning exactly as intended
# # - If a word seems misheard or unclear, guess what the interviewee meant using context from the question
# # - Do NOT add unrelated information

# # Provide only the polished answer.
# # """
# #     try:
# #         # generate polished text
# #         result = generator(prompt, max_new_tokens=512, do_sample=False, truncation=True)
# #         polished_text = result[0]['generated_text'].strip()

# #         print("Polished transcript:", polished_text)
# #         return polished_text
# #     except Exception as e:
# #         print("Polishing failed, returning raw text.")
# #         print("Error:", e)
# #         return raw_text


# sim_model = SentenceTransformer("sentence-transformers/all-MiniLM-L12-v2")
# ce_model = CrossEncoder("cross-encoder/stsb-roberta-large")


# def clean_asr(text: str) -> str:
#     text = text.strip()
#     text = re.sub(r"\s+", " ", text)
#     # remove repeated filler/noise tokens
#     text = re.sub(r"\b(um+|uh+|er+|ah+)\b", "", text, flags=re.IGNORECASE)
#     text = re.sub(r"\s+", " ", text).strip()
#     return text


# def normalize_text(text):
#     text = text.lower()
#     text = re.sub(r"[^\w\s]", "", text)
#     text = re.sub(r"\s+", " ", text).strip()
#     return text

# def semantic_similarity(text_a, text_b, model):
#     a = model.encode(text_a, convert_to_tensor=True, normalize_embeddings=True)
#     b = model.encode(text_b, convert_to_tensor=True, normalize_embeddings=True)

#     cos = util.pytorch_cos_sim(a, b).item()   # cosine in [-1, 1]
#     score = max(0.0, min(1.0, cos))           # clamp to [0, 1], don't remap!
#     print(f"Semantic : {round(score, 2)}")
#     return score



# # ---- MAIN PROCESS ----
# try:
#     # Step 1: Prepare the Hugging Face Whisper pipeline (open-source)
#     print("Loading open-source Whisper model from Hugging Face (this may download once)...")
#     # choose device: 0 for GPU, -1 for CPU
#     device = 0 if torch.cuda.is_available() else -1

#     whisper_model = WhisperModel(
#     "large-v3",
#     device="cuda" if torch.cuda.is_available() else "cpu",
#     compute_type="float16" if torch.cuda.is_available() else "int8"
# )

#     print("Whisper model (Hugging Face) loaded.")

#     # Step 2: Convert video to mono 16kHz WAV
#     audio_file = "temp_audio.wav"
#     print("Extracting audio from video...")
#     subprocess.run([
#     os.environ["IMAGEIO_FFMPEG_EXE"],
#     "-i", video_path,
#     "-af", "highpass=f=100,lowpass=f=4000,afftdn=nf=-25,volume=2.0",
#     "-ac", "1",
#     "-ar", "16000",
#     audio_file,
#     "-y"
# ], check=True)


#     print("Audio extracted.")

#     # Step 3: Transcribe audio using HF pipeline
#     print("Transcribing audio...")
#     # The pipeline accepts a path to the file
#     segments, info = whisper_model.transcribe(
#     audio_file,
#     language="en",
#     beam_size=5,           # higher = more accurate
#     best_of=5,             # tries 5 candidates, picks best
#     temperature=0.0,       # deterministic = more consistent
#     vad_filter=True,       # removes silence automatically
#     vad_parameters=dict(min_silence_duration_ms=500),
#     initial_prompt=ideal_answer  # THIS WORKS in faster-whisper!
# )
#     raw_transcript = " ".join([seg.text for seg in segments])
#     print("Transcription complete.")
#     # Optionally delete temp audio when done:
#     # os.remove(audio_file)

#     polished_transcript = clean_asr(raw_transcript)
#     # polished_transcript = raw_transcript  # no polishing, whisper is good enough

#     # Step 5: Compute semantic similarity
#     print("Computing similarity...")
#     # Fast semantic (bi-encoder)
#     bi_score = semantic_similarity(polished_transcript, ideal_answer, sim_model)


#     # scores = ce_model.predict([( polished_transcript,ideal_answer)])

#     # def softmax(x):
#     #     x = np.array(x, dtype=np.float32)
#     #     x = x - np.max(x)
#     #     e = np.exp(x)
#     #     return e / np.sum(e)

#     # def get_nli_probs(premise, hypothesis):
#     #     logits = ce_model.predict([(premise, hypothesis)])[0]  # 3 logits
#     #     probs = softmax(logits)

#     #     id2label = ce_model.config.id2label  # e.g. {0:'CONTRADICTION',1:'NEUTRAL',2:'ENTAILMENT'}
#     #     label2prob = {str(id2label[i]).lower(): float(probs[i]) for i in range(len(probs))}

#     #     entail = label2prob.get("entailment", 0.0)
#     #     contra = label2prob.get("contradiction", 0.0)
#     #     neutral = label2prob.get("neutral", 0.0)
#     #     return entail, contra, neutral

#     # def get_nli_score(premise, hypothesis):
#     #     entail, contra, _ = get_nli_probs(premise, hypothesis)
#     #     return max(0.0, entail - contra)  # 0..1-ish

#     # # Direction 1: does transcript cover the ideal?
#     # nli_forward = get_nli_score(polished_transcript, ideal_answer)
#     # # Direction 2: does ideal cover the transcript? (catches wrong answers)
#     # nli_backward = get_nli_score(ideal_answer, polished_transcript)

#     # # Average both directions
#     # # ce_score = (nli_forward + nli_backward) / 2
#     # # ce_score = (0.6 * nli_forward) + (0.4 * nli_backward)
#     # ce_score = min(nli_forward, nli_backward)
#     # print(f"NLI forward  : {round(nli_forward, 2)}")
#     # print(f"NLI backward : {round(nli_backward, 2)}")
#     # print(f"CrossEncoder : {round(ce_score, 2)}")

#     # Combine: 50% NLI + 50% semantic (bi-encoder is good at paraphrases)
#     # similarity = round(max(0.0, (0.7 * ce_score) + (0.3 * bi_score)), 2)
# # If NLI is low, trust NLI more (prevents false high scores from topic overlap)
# # Cross-encoder similarity (direct STS score)
#     ce_score = float(ce_model.predict([(ideal_answer, polished_transcript)])[0])
#     # stsb-roberta-large is usually ~0..1, but clamp safely
#     ce_score = max(0.0, min(1.0, ce_score))
#     print(f"CrossEncoder : {round(ce_score, 2)}")
        
#     base = (0.90 * ce_score) + (0.10 * bi_score)

#     # Stronger completeness penalty (still general)
#     len_ratio = len(polished_transcript.split()) / max(1, len(ideal_answer.split()))
#     len_ratio = max(0.0, min(1.0, len_ratio))

#     # Penalize short answers more
#     penalty = 0.35 + 0.65 * len_ratio   # 0.35..1.0
#     similarity = base * penalty

#     similarity = round(max(0.0, min(1.0, similarity)), 2)
#     print(f"FINAL : {similarity}")
#     print(f"FINAL : {similarity}")

#     # Step 6: Return JSON
#     percent = round(max(0.0, similarity) * 100, 1)

#     print(json.dumps({
#     "raw_transcript": raw_transcript,
#     "polished_transcript": polished_transcript,
#     "similarity": round(similarity, 2),
#     "percentage": f"{percent}%"
# }))

# except Exception as e:
#     print(json.dumps({"error": str(e)}))
#     sys.exit(1)