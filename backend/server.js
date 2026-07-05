require('dotenv').config();
const path = require("path");


const express = require('express');
const cors = require('cors');
const jobRoutes = require('./routes/jobRoutes');
const hrRoutes = require('./routes/hrRoute');
const candidateRoutes = require('./routes/candidateRoutes');
const jobScheduler = require('./services/jobScheduler');
const socialAuth = require('./routes/socialAuth');
const emailRoutes = require('./routes/emailRoutes');
const phaseRoutes = require("./routes/phaseRoutes");
const questionsRoutes = require("./routes/questionsRoutes");
const phaseCandidatesRoutes = require("./routes/phaseCandidatesRoutes");
const quizRoutes = require("./routes/quizRoutes");
const acceptanceRoutes = require('./routes/acceptanceRoutes');
const candidateAnswerRoutes = require("./routes/candidateAnswerRoutes");
const interviewUploadRoutes = require("./routes/interviewUploadRoutes");
const cheatingEventsRoutes = require("./routes/cheatingEventsRoutes");

const app = express();

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Routes
app.use('/api/job', jobRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/hr', socialAuth);
app.use('/api/candidate', candidateRoutes);
app.use('/api/email', emailRoutes);
app.use("/api/phase", phaseRoutes);
app.use("/api/questions", questionsRoutes);
app.use("/api/phase-candidates", phaseCandidatesRoutes);
app.use("/api/quiz", quizRoutes);
app.use('/api', acceptanceRoutes);
app.use("/api/candidate-answer", candidateAnswerRoutes);
app.use("/api/interview-upload", interviewUploadRoutes);
app.use("/api/upload", interviewUploadRoutes);
app.use("/uploads", express.static("uploads"));

app.use("/uploads-inline", express.static(path.join(process.cwd(), "uploads"), {
  setHeaders: (res, filePath) => {
    res.setHeader("Content-Disposition", "inline");

    // ✅ Force correct content type for images
    if (filePath.endsWith(".png")) res.setHeader("Content-Type", "image/png");
    if (filePath.endsWith(".jpg") || filePath.endsWith(".jpeg")) res.setHeader("Content-Type", "image/jpeg");
    if (filePath.endsWith(".webp")) res.setHeader("Content-Type", "image/webp");
  }
}));
app.use("/api/cheating-events", cheatingEventsRoutes);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Job scheduler started - checking expired jobs every 5 minutes');
});

jobScheduler.start();
