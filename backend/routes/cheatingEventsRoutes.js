const express = require("express");
const multer = require("multer");
const router = express.Router();

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    const ext = file.mimetype === "image/png" ? ".png"
      : file.mimetype === "image/jpeg" ? ".jpg"
      : file.mimetype === "image/webp" ? ".webp"
      : "";
    cb(null, Date.now() + "-" + Math.round(Math.random() * 1e9) + ext);
  }
});

const upload = multer({ storage });
const {
  createCheatingEvent,
  getCheatingEventsByPhaseCandidate
} = require("../controllers/cheatingEventsController");

// POST: create cheating event (with optional evidence file)
router.post("/", upload.single("evidence"), createCheatingEvent);

// GET: list cheating events for a phase_candidate
router.get("/phase-candidate/:id", getCheatingEventsByPhaseCandidate);

module.exports = router;