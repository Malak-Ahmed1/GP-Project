const express = require("express");
const router = express.Router();

const { createPhase, getPhases,getPhasesByJob , deletePhaseSafe, deletePhaseForce,updatePhase  } = require("../controllers/phaseController");

// Create phase
router.post("/", createPhase);

// Get all phases
router.get("/", getPhases);
router.get("/job/:jobId", getPhasesByJob);

// router.delete("/:phaseId", deletePhase);

// Safe delete: only if no questions
router.delete("/safe/:phaseId", deletePhaseSafe);

// Force delete: delete phase + all questions
router.delete("/force/:phaseId", deletePhaseForce);

router.put("/:phaseId", updatePhase);  // <--- new route





module.exports = router;
