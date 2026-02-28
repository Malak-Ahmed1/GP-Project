const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// POST /api/upload
router.post("/upload", upload.single("video"), (req, res) => {
  const { ideal_answer } = req.body;
  const filePath = req.file.path;

  // ✅ CHANGE THESE PATHS TO YOUR MACHINE
  const pythonPath = process.env.PYTHON_PATH; // put in .env
  const scriptPath = path.join(__dirname, "..", "compare.py"); // put compare.py in backend root

  const py = spawn(pythonPath, [scriptPath, filePath, ideal_answer]);

  let output = "";

  py.stdout.on("data", (data) => {
    output += data.toString();
  });

  py.stderr.on("data", (data) => {
    console.error("Python stderr:", data.toString());
  });

  py.on("close", () => {
    try {
      fs.unlinkSync(filePath);
    } catch (e) {}

    try {
const lines = output.trim().split(/\r?\n/);
const lastLine = lines[lines.length - 1];
const jsonOutput = JSON.parse(lastLine);      return res.json({
        raw_transcript: jsonOutput.raw_transcript,
        polished_transcript: jsonOutput.polished_transcript,
        similarity: jsonOutput.similarity,
      });
    } catch (e) {
      return res.status(500).json({ error: "Python script failed", details: output });
    }
  });
});

module.exports = router;