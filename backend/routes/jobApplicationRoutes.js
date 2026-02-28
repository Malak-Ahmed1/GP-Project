const express = require("express");
const router = express.Router();

const { createJobApplication, getJobApplications } = require("../controllers/jobApplicationController");

// Create job application
router.post("/", createJobApplication);

// Get all job applications
router.get("/", getJobApplications);

module.exports = router;
