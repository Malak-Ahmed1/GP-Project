from flask import Flask, request
from flask_cors import CORS

import cv2
import numpy as np
from main import process_frame
app = Flask(__name__)
CORS(app)

@app.route("/upload-frame", methods=["POST"])
def upload_frame():
    print("[FLASK] Frame received!")
    file = request.files.get("frame")
    if not file:
        print("[FLASK] No frame in request!")
        return {"status": "error", "message": "No frame"}, 400
    print(f"[FLASK] phase_candidate_id = {request.form.get('phase_candidate_id')}")

    # Convert file bytes to OpenCV image
    npimg = np.frombuffer(file.read(), np.uint8)
    frame = cv2.imdecode(npimg, cv2.IMREAD_COLOR)

    phase_candidate_id = request.form.get("phase_candidate_id", 1)
    process_frame(frame, int(phase_candidate_id))
    return {"status": "success"}

if __name__ == "__main__":
    app.run(port=5001)