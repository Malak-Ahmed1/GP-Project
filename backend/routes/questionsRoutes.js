const express = require("express");
const router = express.Router();

const { createQuestion, getQuestions, getQuestionsByPhase ,getQuestionsByJob ,updateQuestion,
  deleteQuestion,uploadQuestionsExcel} = require("../controllers/questionsController");

// Create a new question
router.post("/", createQuestion);

// Get all questions
router.get("/", getQuestions);

// Get questions for a specific phase
router.get("/phase/:phaseId", getQuestionsByPhase);
router.get("/job/:jobId", getQuestionsByJob);

// ✅ UPDATE question
router.put("/:questionId", updateQuestion);

// ✅ DELETE question
router.delete("/:questionId", deleteQuestion);

router.post("/upload-excel/:phaseId", uploadQuestionsExcel);


module.exports = router;
