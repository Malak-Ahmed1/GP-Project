const express = require("express");
const router = express.Router();

const {
  createHR,
  getHR
} = require("../controllers/hrController");

router.post("/", createHR);
router.get("/", getHR);

module.exports = router;
