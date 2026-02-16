const express = require("express");
const cors = require("cors");
require("dotenv").config();

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





const app = express();

app.use(cors());
app.use(express.json());

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
});
