from modules.reporter import report_cheating
import cv2
import sys
import os
import time
from threading import Thread

# Import our custom AI modules
from modules.detection import ObjectDetector

from modules.identity import FaceVerifier

# --- CONFIG ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
REFERENCE_IMG = os.path.join(BASE_DIR, "database", "candidate.jpg")
YOLO_MODEL_PATH = os.path.join(BASE_DIR, "weights", "best.pt")

PHASE_CANDIDATE_ID = 1


# --- GLOBAL SHARED STATE ---
ai_memory = {
    "frame_to_analyze": None,
    "objects": [],
    "identity_status": "ANALYZING...",
    "face_color": (0, 165, 255),
    "is_cheating": False,
    "phone_timer": 0,
    "screenshot_device": False,
     "absence_start": None,        # when face first disappeared
    "absence_alerted": False,
    "face_too_close": False,
    # ← ADD THIS
}


# ==========================================
# BACKGROUND AI THREAD
# ==========================================
def ai_worker():
    print("[INFO] AI Brain Thread Started...")
    detector = ObjectDetector(YOLO_MODEL_PATH)
    verifier = FaceVerifier(REFERENCE_IMG)

    phone_start_time = None

    frame_count = 0
    last_screenshot_time = 0
    ABSENCE_LIMIT = 3  # seconds before "left exam" screenshot triggers
    while True:
        frame = ai_memory["frame_to_analyze"]
        if frame is None:
            time.sleep(0.01)
            continue

        # Shrink frame for faster processing
        small_frame = cv2.resize(frame, (0, 0), fx=0.5, fy=0.5)

        # 1. RUN YOLO (Objects)
        # 1. RUN YOLO (Objects)
        objects, device_seen = detector.analyze(small_frame)
        print(f"[YOLO] device_seen={device_seen}, objects={len(objects)}")

        # 1b. HEAD POSE CHECK
        

        # Phone Timer Logic
        # if device_seen:
        #     if phone_start_time is None: phone_start_time = time.time()
        #     elapsed = time.time() - phone_start_time
        #     ai_memory["phone_timer"] = elapsed
        #     ai_memory["is_cheating"] = elapsed > 2.0
        # else:
        #     phone_start_time = None
        #     ai_memory["is_cheating"] = False
        #     ai_memory["phone_timer"] = 0
        
        # Instant device detection
        if device_seen:
            if phone_start_time is None:
                phone_start_time = time.time()
            ai_memory["phone_timer"] = time.time() - phone_start_time
        else:
            phone_start_time = None
            ai_memory["phone_timer"] = 0

        if device_seen and not ai_memory["is_cheating"]:
            ai_memory["screenshot_device"] = True   # Signal: take one screenshot
        ai_memory["is_cheating"] = device_seen
        ai_memory["objects"] = objects

        # Take screenshot ONCE when device first appears
        if ai_memory.get("screenshot_device"):
            ai_memory["screenshot_device"] = False
            print(f"[REPORT CALL] Calling report_cheating with ID={PHASE_CANDIDATE_ID}")

            report_cheating(PHASE_CANDIDATE_ID, "UNAUTHORIZED_DEVICE", "Device detected during exam", ai_memory["frame_to_analyze"])


        # --- FACE SIZE CHECK (camera too close = hands not visible) ---
        h, w = small_frame.shape[:2]
        gray = cv2.cvtColor(small_frame, cv2.COLOR_BGR2GRAY)
        faces = cv2.CascadeClassifier(
            cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        ).detectMultiScale(gray, 1.1, 5, minSize=(30, 30))

        if len(faces) > 0:
            fx, fy, fw, fh = max(faces, key=lambda f: f[2]*f[3])
            face_ratio = fw / w  # what % of frame width is the face
            ai_memory["face_too_close"] = face_ratio > 0.45  # face takes more than 45% = too close
        else:
            ai_memory["face_too_close"] = False


        # 2. RUN DEEPFACE (Identity)
# Run DeepFace every 10 frames to reduce lag
        frame_count += 1  # increment each loop
        if frame_count % 10 == 0:
            status, color, unauthorized, reason = verifier.verify(small_frame)
            ai_memory["identity_status"] = status
            ai_memory["face_color"] = color

            now = time.time()

            # --- ABSENCE TIMER LOGIC ---
            if reason == "NO_FACE":
                if ai_memory["absence_start"] is None:
                    ai_memory["absence_start"] = now      # start the clock
                    ai_memory["absence_alerted"] = False

                absence_duration = now - ai_memory["absence_start"]

                # Update UI to show how long they've been gone
                ai_memory["identity_status"] = f"NO FACE - {int(absence_duration)}s"

                # Only screenshot after ABSENCE_LIMIT seconds, and only once
                if absence_duration >= ABSENCE_LIMIT and not ai_memory["absence_alerted"]:
                    ai_memory["absence_alerted"] = True
                    ai_memory["absence_start"] = now  # reset for next absence
                    screenshot_dir = os.path.join(BASE_DIR, "screenshots")
                    os.makedirs(screenshot_dir, exist_ok=True)
                    timestamp = time.strftime("%Y%m%d-%H%M%S")
                    report_cheating(PHASE_CANDIDATE_ID, "LEFT_EXAM", "Candidate absent for 3+ seconds", ai_memory["frame_to_analyze"])

            else:
                # Face is back — reset absence tracking
                ai_memory["absence_start"] = None
                ai_memory["absence_alerted"] = False

            # --- REAL VIOLATION SCREENSHOT (with cooldown) ---
            SCREENSHOT_REASONS = {"UNKNOWN_PERSON", "MULTIPLE_PEOPLE", "SPOOF"}
            if unauthorized and reason in SCREENSHOT_REASONS:
                if now - last_screenshot_time > 10:   # max 1 screenshot per 10 seconds
                    last_screenshot_time = now
                    screenshot_dir = os.path.join(BASE_DIR, "screenshots")
                    os.makedirs(screenshot_dir, exist_ok=True)
                    timestamp = time.strftime("%Y%m%d-%H%M%S")
                    report_cheating(PHASE_CANDIDATE_ID, reason, f"Identity violation: {reason}", ai_memory["frame_to_analyze"])


# ==========================================
# MAIN VIDEO THREAD
# ==========================================
def process_frame(frame, phase_candidate_id):
    global ai_memory, PHASE_CANDIDATE_ID
    PHASE_CANDIDATE_ID = phase_candidate_id
    ai_memory["frame_to_analyze"] = frame
    
Thread(target=ai_worker, daemon=True).start()