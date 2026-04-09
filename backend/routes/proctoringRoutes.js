const express = require("express");
const router = express.Router();
const { spawn } = require("child_process");

router.post("/start-proctoring", (req, res) => {
  const { phase_candidate_id } = req.body;

  // 🔥 START PYTHON SCRIPT
  const pythonProcess = spawn("python", [
    "E:/Hr_User/GP-Project/cheating_module/main.py",
    phase_candidate_id
  ]);

  pythonProcess.stdout.on("data", (data) => {
    console.log(`PYTHON: ${data}`);
  });

  pythonProcess.stderr.on("data", (data) => {
    console.error(`PYTHON ERROR: ${data}`);
  });

  res.json({ message: "Proctoring started" });
});

module.exports = router;