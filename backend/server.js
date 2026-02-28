const express = require("express");
const cors = require("cors");
require("dotenv").config();

<<<<<<< HEAD
const jobRoutes = require('./routes/jobRoutes');
const hrRoutes = require('./routes/hrRoute');
const candidateRoutes = require('./routes/candidateRoutes');
const jobScheduler = require('./services/jobScheduler');
const socialAuth = require('./routes/socialAuth');
const emailRoutes = require('./routes/emailRoutes');

const app = express();

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Routes
app.use('/api/job', jobRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/hr', socialAuth);
app.use('/api/candidate', candidateRoutes);
app.use('/api/email', emailRoutes);
app.use("/uploads", express.static("uploads"));

const PORT = process.env.PORT || 5000;

jobScheduler.start();

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Job scheduler started - checking expired jobs every 5 minutes');
=======
const hrRoutes = require("./routes/hrRoutes");
const jobRoutes = require("./routes/jobRoutes");
const candidateRoutes = require("./routes/candidateRoutes");
const jobApplicationRoutes = require("./routes/jobApplicationRoutes");

const phaseRoutes = require("./routes/phaseRoutes");
const questionsRoutes = require("./routes/questionsRoutes");
const phaseCandidatesRoutes = require("./routes/phaseCandidatesRoutes"); // <-- ADD THIS
const quizRoutes = require("./routes/quizRoutes");

const acceptanceRoutes = require('./routes/acceptanceRoutes');

const candidateAnswerRoutes = require("./routes/candidateAnswerRoutes");



const interviewUploadRoutes = require("./routes/interviewUploadRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", interviewUploadRoutes);


app.use("/api/hr", hrRoutes);
app.use("/api/job", jobRoutes);
app.use("/api/candidate", candidateRoutes);
app.use("/api/job-application", jobApplicationRoutes);

app.use("/api/phase", phaseRoutes);
app.use("/api/questions", questionsRoutes);

app.use("/api/phase-candidates", phaseCandidatesRoutes); // <-- MOUNT HERE

app.use("/api/quiz", quizRoutes);
app.use('/api', acceptanceRoutes);



app.use("/api/candidate-answer", candidateAnswerRoutes);




const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
>>>>>>> origin/Combined_with_whisper
});
