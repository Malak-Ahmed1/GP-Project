const express = require("express");
const router = express.Router();
const { sendAcceptanceMail } = require("../controllers/acceptanceController");

// POST: send acceptance mail
router.post("/send-acceptance", sendAcceptanceMail);

module.exports = router;
