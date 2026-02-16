const express = require("express");
const router = express.Router();
const { sendQuizLink } = require("../controllers/quizController");

// POST: send quiz link to candidates
router.post("/send-quiz", sendQuizLink);

module.exports = router;
