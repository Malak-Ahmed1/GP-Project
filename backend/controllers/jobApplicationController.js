const pool = require("../config/db");

// Create a job application
exports.createJobApplication = async (req, res) => {
  try {
    const { job_id, candidate_id, score_cv, cgpa } = req.body;

    // Check that job exists
    const jobCheck = await pool.query("SELECT * FROM job WHERE id = $1", [job_id]);
    if (jobCheck.rows.length === 0) {
      return res.status(400).json({ error: "Job not found." });
    }

    // Check that candidate exists
    const candidateCheck = await pool.query("SELECT * FROM candidate WHERE id = $1", [candidate_id]);
    if (candidateCheck.rows.length === 0) {
      return res.status(400).json({ error: "Candidate not found." });
    }

    // Prevent duplicate application
    const duplicateCheck = await pool.query(
      "SELECT * FROM job_application WHERE job_id = $1 AND candidate_id = $2",
      [job_id, candidate_id]
    );

    if (duplicateCheck.rows.length > 0) {
      return res.status(400).json({ error: "Candidate already applied to this job." });
    }

    // Insert job application
    const result = await pool.query(
      `INSERT INTO job_application (job_id, candidate_id, score_cv, cgpa)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [job_id, candidate_id, score_cv, cgpa]
    );

    res.status(201).json({
      message: "Job application created successfully",
      job_application: result.rows[0]
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all job applications
exports.getJobApplications = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ja.*, c.name as candidate_name, j.title as job_title
       FROM job_application ja
       JOIN candidate c ON ja.candidate_id = c.id
       JOIN job j ON ja.job_id = j.id
       ORDER BY ja.id ASC`
    );

    res.json(result.rows);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
