const express = require("express");
const router = express.Router();
const candidateAnswerController = require("../controllers/candidateAnswerController");

// Add a candidate answer
router.post("/", candidateAnswerController.addCandidateAnswer);

// Get all answers for a candidate in a phase
router.get("/phase-candidate/:phase_candidate_id", candidateAnswerController.getAnswersByPhaseCandidate);

// Update an answer
router.put("/:id", candidateAnswerController.updateCandidateAnswer);

// Delete an answer
router.delete("/:id", candidateAnswerController.deleteCandidateAnswer);

module.exports = router;
