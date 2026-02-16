const pool = require("../config/db");

// Create candidate
exports.createCandidate = async (req, res) => {
  try {
    const { name, email, phone_number, cv_link } = req.body;

    const result = await pool.query(
      `INSERT INTO candidate (name, email, phone_number, cv_link)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, email, phone_number, cv_link]
    );

    res.status(201).json({
      message: "Candidate created successfully",
      candidate: result.rows[0],
    });

  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

// Get all candidates
exports.getCandidates = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM candidate ORDER BY id ASC"
    );

    res.json(result.rows);

  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

// Get candidate by ID
exports.getCandidateById = async (req, res) => {
  try {
    const id = req.params.id;

    const result = await pool.query(
      "SELECT * FROM candidate WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Candidate not found",
      });
    }

    res.json(result.rows[0]);

  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

// Delete candidate
exports.deleteCandidate = async (req, res) => {
  try {
    const id = req.params.id;

    await pool.query(
      "DELETE FROM candidate WHERE id = $1",
      [id]
    );

    res.json({
      message: "Candidate deleted successfully",
    });

  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};



// =============================
// NEW: Get candidate applications
// =============================
exports.getCandidateApplications = async (req, res) => {
  try {
    const candidateId = req.params.id;

    // Get all job applications for this candidate
    const applicationsResult = await pool.query(
  `SELECT ja.id, ja.job_id as "jobId", j.title as "jobTitle",
          h.company_name as "companyName",
          ja.applied_at as "dateApplied",
          ja.score_cv as "overallScore",
          ja.cgpa
   FROM job_application ja
   JOIN job j ON ja.job_id = j.id
   JOIN hr h ON j.hr_id = h.id
   WHERE ja.candidate_id = $1
   ORDER BY ja.applied_at DESC`,
  [candidateId]
);


    const applications = [];

    for (const app of applicationsResult.rows) {
      // Get phases for each job application
      const phasesResult = await pool.query(
        `SELECT pc.id, p.phase_order as "phaseOrder", p.method, pc.phase_score as "score", 
                pc.passed as "status", pc.time_enter as "submittedAt"
         FROM phase_candidates pc
         JOIN phase p ON pc.phase_id = p.id
         WHERE pc.job_application_id = $1
         ORDER BY p.phase_order ASC`,
        [app.id]
      );

      applications.push({
        ...app,
        phases: phasesResult.rows
      });
    }

    res.json(applications);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};
