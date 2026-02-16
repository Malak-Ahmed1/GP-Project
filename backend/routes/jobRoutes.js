const express = require("express");
const router = express.Router();

const {
  createJob,
  getJobs,
getJobById
} = require("../controllers/jobController");

router.post("/", createJob);
router.get("/", getJobs);
router.get("/:jobId", getJobById);  // <-- THIS IS REQUIRED

module.exports = router;
