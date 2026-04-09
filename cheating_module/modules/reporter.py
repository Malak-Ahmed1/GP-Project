import requests
import cv2
import tempfile
import os

BACKEND_URL = "http://127.0.0.1:5000/api/cheating-events"

def report_cheating(phase_candidate_id, cheating_type, description, frame=None):
    tmp_file = None

    try:
        data = {
            "phase_candidate_id": str(phase_candidate_id),
            "cheating_type": cheating_type,
            "description": description
        }

        files = None

        if frame is not None:
            # ✅ SAFE temp file
            tmp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".jpg")
            tmp_path = tmp_file.name
            tmp_file.close()

            cv2.imwrite(tmp_path, frame)

            files = {
                "evidence": ("evidence.jpg", open(tmp_path, "rb"), "image/jpeg")
            }

        # ✅ Send request
        response = requests.post(BACKEND_URL, data=data, files=files)

        # ✅ Debug log
        print(f"[REPORT] {cheating_type} → Status: {response.status_code}")

        if response.status_code != 201:
            print("[REPORT ERROR] Backend response:", response.text)

    except Exception as e:
        print(f"[REPORT ERROR] {e}")

    finally:
        # ✅ ALWAYS CLEAN FILE
        try:
            if files:
                files["evidence"][1].close()
            if tmp_file and os.path.exists(tmp_file.name):
                os.remove(tmp_file.name)
        except:
            pass