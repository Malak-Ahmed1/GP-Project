const express = require("express");
const router = express.Router();
const { getCandidatesForPhaseSelection, 
  assignCandidatesToPhase,assignAndSendQuiz } = require("../controllers/quizController");

// POST: send quiz link to candidates
// router.post("/send-quiz", sendQuizLink);

// ✅ FIXED: GET selectable candidates for a phase
// Remove /phase-candidates from path here
router.get("/select/:jobId/:phaseOrder", getCandidatesForPhaseSelection);

// ✅ FIXED: Assign selected candidates to a phase
// Remove /phase-candidates from path here
router.post("/assign", assignCandidatesToPhase);

// ✅ FIXED: Assign selected candidates AND send quiz
// Remove /phase-candidates from path here
router.post("/assign-and-send", assignAndSendQuiz);

module.exports = router;
