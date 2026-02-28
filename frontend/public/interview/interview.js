const preview = document.getElementById('preview');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const questionEl = document.getElementById('question');
const status = document.getElementById('status');

const BACKEND = 'http://127.0.0.1:5000';
const params = new URLSearchParams(window.location.search);
const jobId = params.get("jobId");
const phaseId = params.get("phaseId");
const qIndex = parseInt(params.get("q") || "0", 10);
startBtn.disabled = true;
const nextBtn = document.getElementById("nextBtn");

let questions = [];
let currentQuestion = null;

let mediaRecorder, recordedChunks = [], localStream;

// Load question
async function loadQuestion() {
  if (!phaseId) {
    questionEl.textContent = "Error: phaseId missing in URL";
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
// Start recording
startBtn.onclick = async () => {
  startBtn.disabled = true;
  status.textContent = 'Requesting camera & mic...';
  try {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    preview.srcObject = localStream;
    recordedChunks = [];
    mediaRecorder = new MediaRecorder(localStream, { mimeType: 'video/webm;codecs=vp8,opus' });
    mediaRecorder.ondataavailable = e => { if (e.data.size) recordedChunks.push(e.data); };
    mediaRecorder.start();
    stopBtn.disabled = false;
    status.textContent = 'Recording...';
  } catch {
    alert('Camera/microphone permission required.');
    startBtn.disabled = false;
    status.textContent = '';
  }
};

// Stop recording & upload
stopBtn.onclick = () => {
  if (!mediaRecorder) return;
  if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop();
  stopBtn.disabled = true;
  startBtn.disabled = false;
  if (localStream) localStream.getTracks().forEach(t => t.stop());
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
nextBtn.onclick = () => {
    if (nextBtn.disabled) return;   // ✅ ADD THIS

  if (!questions.length) return;

  if (qIndex >= questions.length - 1) {
    // finished
    alert("Interview finished ✅");
    // You can redirect somewhere if you want:
    // window.location.href = "/thank-you";
    return;
  }

  const nextIndex = qIndex + 1;
  window.location.href = `/interview/?jobId=${jobId}&phaseId=${phaseId}&q=${nextIndex}`;
};