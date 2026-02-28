const express = require("express");
const router = express.Router();

const {
  assignCandidateToPhase,
  getPhaseCandidates,
  updatePhaseCandidateWithCGPA,
  deletePhaseCandidate,markCandidatesPassed
} = require("../controllers/phaseCandidateController");

// Assign candidate to a phase
router.post("/", assignCandidateToPhase);

// Get all candidates in a phase
router.get("/phase/:phaseId", getPhaseCandidates);

// Update a phase candidate (e.g., score, pass status)
router.put("/:id", updatePhaseCandidateWithCGPA);

// Delete a phase candidate
router.delete("/:id", deletePhaseCandidate);

// Mark candidates as passed
router.post("/mark-passed", markCandidatesPassed);

module.exports = router;
