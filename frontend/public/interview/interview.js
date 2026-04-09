const preview = document.getElementById('preview');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const questionEl = document.getElementById('question');
const status = document.getElementById('status');

const BACKEND = 'http://127.0.0.1:5000';
const params = new URLSearchParams(window.location.search);
const jobId = params.get("jobId");
const phaseId = params.get("phaseId");
const pcId = params.get("pcId");   // ✅ NEW
let qIndex = parseInt(params.get("q") || "0", 10);

let isRecording = false;
let currentCheatingCount = 0;

startBtn.disabled = true;
const nextBtn = document.getElementById("nextBtn");

let questions = [];
let currentQuestion = null;


let screenStream = null;
let screenVideoEl = null;
let isMonitoring = false; // NEW: start monitoring once screen share is granted
let interviewEnded = false;

let proctoringInterval = null;

function startProctoring() {
  if (proctoringInterval) return;

  proctoringInterval = setInterval(async () => {
    if (!isMonitoring || interviewEnded) return;
    if (!preview || !preview.videoWidth) return;

    const canvas = document.createElement("canvas");
    canvas.width = preview.videoWidth;
    canvas.height = preview.videoHeight;
    canvas.getContext("2d").drawImage(preview, 0, 0);

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const fd = new FormData();
      fd.append("frame", blob, "frame.jpg");
      fd.append("phase_candidate_id", pcId);

      try {
        await fetch("http://127.0.0.1:5001/upload-frame", {
          method: "POST",
          body: fd
        });
      } catch (e) {
        console.warn("Proctoring frame failed:", e.message);
      }
    }, "image/jpeg", 0.7);

  }, 2000);
}

function stopProctoring() {
  if (proctoringInterval) {
    clearInterval(proctoringInterval);
    proctoringInterval = null;
  }
}

let mediaRecorder, recordedChunks = [], localStream;
async function startCameraAlways() {
  try {
    // request camera + mic immediately
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

    // show camera preview
    preview.srcObject = localStream;
    preview.autoplay = true;
    preview.muted = true;
    preview.playsInline = true;

    // Set camera size to half screen
// Replace the preview styling in startCameraAlways() with this:
    preview.style.position = "relative"; // inside parent container
    preview.style.width = "100%";        // fill the frame
    preview.style.height = "100%";       // fill the frame
    preview.style.top = "0";
    preview.style.left = "0";
    preview.style.border = "2px solid black";
    preview.style.borderRadius = "8px";
    preview.style.objectFit = "cover";   // maintain camera aspect ratio
    preview.style.zIndex = "1";          // behind questions/buttons if needed


  } catch (err) {
    console.error("Camera permission denied:", err);
    alert("Camera + Mic permissions are required to start the interview.");
  }
}

// Call it immediately to start camera on page load
startCameraAlways();

async function startScreenCapture() {
  // If StartInterviewPage already started it, reuse it
  screenStream = await navigator.mediaDevices.getDisplayMedia({
  video: { displaySurface: "monitor" },
  audio: false
});

  // validate entire screen
  const track = screenStream.getVideoTracks()[0];
  const settings = track.getSettings();

  if (settings.displaySurface && settings.displaySurface !== "monitor") {
    screenStream.getTracks().forEach(t => t.stop());
    screenStream = null;
    window.__INTERVIEW_SCREEN_STREAM__ = null;

    alert("❌ You must select ENTIRE SCREEN (Monitor).");
    throw new Error("Not entire screen");
  }

  // Create hidden video element for screenshots
  screenVideoEl = document.createElement("video");
  screenVideoEl.srcObject = screenStream;
  screenVideoEl.muted = true;
  screenVideoEl.playsInline = true;
  await screenVideoEl.play();
  isMonitoring = true;
  startProctoring();
}


function captureScreenSnapshot() {
  if (!screenVideoEl) return Promise.resolve(null);

  const canvas = document.createElement("canvas");
  canvas.width = screenVideoEl.videoWidth || 1280;
  canvas.height = screenVideoEl.videoHeight || 720;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(screenVideoEl, 0, 0, canvas.width, canvas.height);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png");
  });
}

function captureWebcamSnapshot(videoEl) {
  if (!videoEl) return Promise.resolve(null); // always return a Promise
  const width = videoEl.videoWidth || 640;
  const height = videoEl.videoHeight || 480;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(videoEl, 0, 0, width, height);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.9);
  });
}

async function sendCheatingEvent({ phase_candidate_id, cheating_type, description, evidenceBlob }) {
  const fd = new FormData();
  fd.append("phase_candidate_id", phase_candidate_id);
  fd.append("cheating_type", cheating_type);
  fd.append("description", description);

  if (evidenceBlob) {
    fd.append("evidence", evidenceBlob, "evidence.png");
  }

  const res = await fetch(`${BACKEND}/api/cheating-events`, {
    method: "POST",
    body: fd
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Cheating event failed:", err);
  }
}

// Load question
async function loadQuestion() {
  if (!phaseId) {
    questionEl.textContent = "Error: phaseId missing in URL";
    return;
  }

  if (!pcId) {
    questionEl.textContent = "Error: pcId missing in URL";
    startBtn.disabled = true;
    return;
  }

  const res = await fetch(`${BACKEND}/api/questions/phase/${phaseId}`);
  const data = await res.json();

  if (!Array.isArray(data) || data.length === 0) {
    questionEl.textContent = "No questions found for this phase.";
    return;
  }

  questions = data;

  if (qIndex < 0 || qIndex >= questions.length) {
    questionEl.textContent = "Invalid question number.";
    return;
  }

  currentQuestion = questions[qIndex];
  questionEl.textContent = currentQuestion.ques_text;
  startBtn.disabled = false;

  // disable next until upload finishes
  nextBtn.disabled = true;
}

loadQuestion();
startScreenCapture().catch(console.error);
// Start recording

startBtn.onclick = async () => {
  startBtn.disabled = true;
  status.textContent = 'Requesting screen share...';

  try {
    // ✅ Reuse existing screen stream if already granted
    if (!screenStream) {
      await startScreenCapture();
      if (!screenStream) {
        alert("Screen sharing is required. Refresh and allow Entire Screen.");
        startBtn.disabled = false;
        return;
      }
    }

    // Start recording camera + mic
    recordedChunks = [];
    mediaRecorder = new MediaRecorder(localStream, { mimeType: 'video/webm;codecs=vp8,opus' });
    mediaRecorder.ondataavailable = e => { if (e.data.size) recordedChunks.push(e.data); };
    mediaRecorder.start();

    isRecording = true;
    stopBtn.disabled = false;
    status.textContent = 'Recording...';

  } catch (err) {
    console.error(err);
    alert('Screen sharing permission required.');
    startBtn.disabled = false;
    status.textContent = '';
  }
};

// Stop recording & upload
stopBtn.onclick = () => 
  {
  if (!mediaRecorder) return;
  if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop();
  stopBtn.disabled = true;
  startBtn.disabled = false;
  isRecording = false;
  //if (localStream) localStream.getTracks().forEach(t => t.stop());
 
  status.textContent = 'Stopped. Uploading...';

  mediaRecorder.onstop = async () => {
    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const fd = new FormData();
    fd.append('video', blob, 'answer.webm');
    fd.append("ideal_answer", currentQuestion?.correct_answer || "");
    fd.append("question", currentQuestion?.ques_text || questionEl.textContent);

    // Animated loading dots
    let dots = 0;
    const loadingInterval = setInterval(() => {
      status.textContent = 'Uploading and analyzing' + '.'.repeat(dots);
      dots = (dots + 1) % 4;
    }, 500);

    try {
      const res = await fetch(`${BACKEND}/api/upload`, { method: 'POST', body: fd });
      clearInterval(loadingInterval);
      const data = await res.json();

      if (data.error) {

        status.innerHTML = `<b>Error:</b> ${data.error}`;

      } else {

        status.innerHTML = `
    <b>Raw Transcript:</b><br>${data.raw_transcript}<br><br>
    <b>Polished Transcript:</b><br>${data.polished_transcript}<br><br>
    <b>Similarity:</b> ${(data.similarity * 100).toFixed(2)}%
  `;

        // ✅ SAVE ANSWER TO DB
        await fetch(`${BACKEND}/api/candidate-answer`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phase_candidate_id: pcId,
            question_item_id: currentQuestion.id,
            raw_answer: data.raw_transcript,
            polished_answer: data.polished_transcript,
            score: Math.round((data.similarity || 0) * 100)
          })
        });

        // ✅ ENABLE NEXT BUTTON AFTER SUCCESSFUL UPLOAD
        nextBtn.disabled = false;

        // ✅ CHANGE BUTTON TEXT IF LAST QUESTION
        if (qIndex >= questions.length - 1) {
          nextBtn.textContent = "Finish";
        } else {
          nextBtn.textContent = "Next Question";
        }

      }
    } catch (e) {
      clearInterval(loadingInterval);
      console.error(e);
      status.textContent = 'Upload failed';
    }

  };
};
function stopMonitoringAndStreams() {
  interviewEnded = true;   // ✅ important
  isMonitoring = false;
  isRecording = false;
  stopProctoring();

  // stop camera stream if still running
  if (localStream) {
    localStream.getTracks().forEach(t => t.stop());
    localStream = null;
  }

  // stop screen share
  if (screenStream) {
    screenStream.getTracks().forEach(t => t.stop());
    screenStream = null;
  }

  // clean video element
  screenVideoEl = null;
}
nextBtn.onclick = async () => {
  if (nextBtn.disabled) return;
  if (!questions.length) return;

  const nextIndex = qIndex + 1;

 if (nextIndex >= questions.length) {
  stopMonitoringAndStreams(); // ✅ stop cheating + stop screen share
  window.location.href = "/interview/finish.html"; // ✅ show UI page
  return;
}

  // update current question without reloading the page
  currentQuestion = questions[nextIndex];
  questionEl.textContent = currentQuestion.ques_text;

  // reset UI
  nextBtn.disabled = true;
  startBtn.disabled = false;
  stopBtn.disabled = true;
  status.textContent = "";

  // update qIndex value (make it let not const)
qIndex = nextIndex;
if (qIndex >= questions.length - 1) {
  nextBtn.textContent = "Finish";
} else {
  nextBtn.textContent = "Next Question";
}
};

document.addEventListener("visibilitychange", async () => {
  if (interviewEnded) return;
  if (document.hidden) {
    currentCheatingCount++;
    try {
      let evidenceBlob = null;

      // 1️⃣ Use screen capture if available
      if (screenVideoEl) {
        evidenceBlob = await captureScreenSnapshot();
      }

      // 2️⃣ Fallback to webcam if screen capture not available
      if (!evidenceBlob && preview) {
        if (preview.paused) await preview.play().catch(() => {});
        evidenceBlob = await captureWebcamSnapshot(preview);
      }

      if (!evidenceBlob) {
        console.warn("⚠️ No frame captured for tab switch!");
        return;
      }

      await sendCheatingEvent({
        phase_candidate_id: pcId,
        cheating_type: "TAB_SWITCH",
        description: `Candidate switched tab (count=${currentCheatingCount})`,
        evidenceBlob
      });

      alert("Warning: Tab switching is not allowed. This action is recorded.");

    } catch (err) {
      console.error("Tab switch capture failed:", err);
    }
  }
});


