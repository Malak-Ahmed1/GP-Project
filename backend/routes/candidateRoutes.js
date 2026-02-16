const express = require("express");
const router = express.Router();

const {
  createCandidate,
  getCandidates,
  getCandidateById,
  deleteCandidate,
  getCandidateApplications // <-- make sure this exists in your controller

} = require("../controllers/candidateController");

// Create candidate
router.post("/", createCandidate);

// Get all candidates
router.get("/", getCandidates);

// Get candidate by ID
router.get("/:id", getCandidateById);

// Delete candidate
router.delete("/:id", deleteCandidate);
router.get("/:id/applications", getCandidateApplications);



module.exports = router;
