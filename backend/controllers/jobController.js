const pool = require("../config/db");

// Create Job
exports.createJob = async (req, res) => {
  try {
    const { hr_id, title, job_desc, available, end_date, link } = req.body;

    // Check that HR exists first
    const hrCheck = await pool.query("SELECT * FROM hr WHERE id = $1", [hr_id]);
    if (hrCheck.rows.length === 0) {
      return res.status(400).json({ error: "HR not found. Create HR first." });
    }

    const result = await pool.query(
      `INSERT INTO job (hr_id, title, job_desc, available, end_date, link)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [hr_id, title, job_desc, available, end_date, link]
    );

    res.status(201).json({
      message: "Job created successfully",
      job: result.rows[0]
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



// Get Jobs for specific HR
exports.getJobs = async (req, res) => {
  try {
    const hr_id = req.query.hr_id; // get HR ID from frontend

    if (!hr_id) {
      return res.status(400).json({ error: "hr_id query parameter is required." });
    }

    const result = await pool.query(
      `SELECT j.*, h.name as hr_name, h.company_name
       FROM job j
       JOIN hr h ON j.hr_id = h.id
       WHERE j.hr_id = $1
       ORDER BY j.id ASC`,
      [hr_id]
    );

    res.json(result.rows);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// Get single job by ID
exports.getJobById = async (req, res) => {
  try {
    const { jobId } = req.params; // get jobId from URL

    const result = await pool.query(
      `SELECT j.*, h.name as hr_name, h.company_name
       FROM job j
       JOIN hr h ON j.hr_id = h.id
       WHERE j.id = $1`,
      [jobId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Job not found" });
    }

    res.json(result.rows[0]);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

