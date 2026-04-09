# 🎓 AI-Powered Proctoring System

An automated, real-time proctoring core built for secure examination environments. This system utilizes a dual-threaded AI architecture to ensure candidate identity and detect unauthorized devices without interrupting video feed performance.

## 🌟 Core Features
* **Continuous Identity Verification:** Uses `DeepFace` (VGG-Face model) to verify the exam candidate against a secure database image.
* **Anti-Cheating Object Detection:** Uses a custom-trained `YOLO` model to detect unauthorized devices (e.g., smartphones) in the frame.
* **Presence & Crowd Control:** Automatically flags if the candidate leaves the frame or if multiple people enter the camera view.
* **Asynchronous Processing:** Features a custom multithreaded camera engine to decouple heavy AI math from the video stream, ensuring a zero-lag 60 FPS visual experience.
* **Passive Liveness Detection:** Utilizes `MiniFASNet` to analyze facial texture and depth, successfully blocking presentation attacks (spoofing) via printed photos or digital screens.
## 🛠️ Installation & Setup

**1. Clone the Repository**
`git clone https://github.com/Black13Cat-Ops/Proctoring-System.git`
`cd Proctoring-System`

**2. Create a Virtual Environment**
It is highly recommended to use a virtual environment to prevent dependency conflicts.
`python -m venv venv`
`source venv/Scripts/activate`

**3. Install Dependencies**
`pip install -r requirements.txt`
*(Note: The default `requirements.txt` installs the CPU version of PyTorch for maximum compatibility. If you have an NVIDIA GPU, you will need to install the CUDA 12.1 version of PyTorch manually for real-time inference speeds).*

## 🚀 How to Run

**1. Setup the Database:** Take a clear, well-lit photo of your face. Name the file exactly `candidate.jpg` and place it inside the `database/` folder.

**2. Execute the Core:**
`python proctore_core.py`
*(Press `q` to safely exit the camera window).*

## 🧪 Testing Protocol
To verify the system is working, perform the following tests:
* **The Identity Test:** Look straight into the camera. The status bar should read `IDENTITY VERIFIED` in green. Look 90 degrees away or cover your face to trigger the `UNKNOWN PERSON` alert.
* **The Device Test:** Hold a smartphone in the frame. The system will track it, and after 2 seconds of sustained visibility, a red `UNAUTHORIZED DEVICE DETECTED` alert will trigger.
* **The Spoof Test:** Hold up a smartphone displaying a photo or video of a face to the webcam. The system will detect the screen's digital pixels and trigger a red _SPOOF DETECTED (FAKE FACE)_ alert.
## ⚠️ Known Limitations (Iteration 1)
* **Calculator False Positives:** The current `best.pt` YOLO weights occasionally flag calculators as mobile phones due to geometric similarities. A dataset update with negative mining is planned for the next training iteration.