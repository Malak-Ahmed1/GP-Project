// backend/routes/hrRoute.js
const express = require("express");
const pool = require("../config/db"); // your pg pool
const router = express.Router();

// =========================================
// APPLY TO JOB
// =========================================

router.post("/apply/:jobId", async (req, res) => {
  const client = await pool.connect();
  const { jobId } = req.params;
  const cv_link = req.file
  ? `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`
  : null;

  const {
    name,
    email,
    phone_number,
    answers // array of { job_field_id, value }
  } = req.body;

  try {
    await client.query("BEGIN");

    // 1️⃣ Check if job exists
    const jobCheck = await client.query(
      "SELECT id FROM job WHERE id = $1 AND available = TRUE",
      [jobId]
    );

    if (jobCheck.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Job not found or closed" });
    }

    // 2️⃣ Check if candidate already exists by email
    let candidateResult = await client.query(
      "SELECT id FROM candidate WHERE email = $1",
      [email]
    );

    let candidateId;

if (candidateResult.rows.length === 0) {
  // 1️⃣ Create new candidate
  const newCandidate = await client.query(
    `INSERT INTO candidate (name, email, phone_number, cv_link)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [name || null, email, phone_number || null, cv_link || null]
  );

  candidateId = newCandidate.rows[0].id;

} else {
  candidateId = candidateResult.rows[0].id;

  // 2️⃣ Update candidate if new data is provided
  await client.query(
    `UPDATE candidate
     SET 
       name = COALESCE($1, name),
       phone_number = COALESCE($2, phone_number),
       cv_link = COALESCE($3, cv_link)
     WHERE id = $4`,
    [name || null, phone_number || null, cv_link || null, candidateId]
  );
}


    // 3️⃣ Prevent duplicate application
    const duplicateCheck = await client.query(
      `SELECT id FROM job_application
       WHERE job_id = $1 AND candidate_id = $2`,
      [jobId, candidateId]
    );

    if (duplicateCheck.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "You already applied to this job"
      });
    }

    // 4️⃣ Create job application
    const applicationResult = await client.query(
      `INSERT INTO job_application (job_id, candidate_id)
       VALUES ($1, $2)
       RETURNING id`,
      [jobId, candidateId]
    );

    const applicationId = applicationResult.rows[0].id;

    // 5️⃣ Insert field answers
    if (Array.isArray(answers) && answers.length > 0) {
      for (const answer of answers) {
        await client.query(
          `INSERT INTO job_application_field_answer
           (job_application_id, job_field_id, value)
           VALUES ($1, $2, $3)`,
          [applicationId, answer.job_field_id, answer.value]
        );
      }
    }

    await client.query("COMMIT");

    res.status(201).json({
      message: "Application submitted successfully",
      applicationId
    });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Apply error:", err);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
});

// GET CANDIDATES BY JOB
router.get("/candidates/:jobId", async (req, res) => {
  const { jobId } = req.params;

  try {
    // 1️⃣ Check if job exists
    const jobCheck = await pool.query(
      "SELECT id, title FROM job WHERE id = $1",
      [jobId]
    );

    if (jobCheck.rows.length === 0) {
      return res.status(404).json({ message: "Job not found" });
    }

    // 2️⃣ Get all candidates who applied to this job
    const candidatesResult = await pool.query(
      `SELECT 
          c.id as candidate_id,
          c.name,
          c.email,
          c.phone_number,
          c.cv_link,
          c.created_at,
          ja.id as application_id,
          ja.score_cv,
          ja.total_score,
          ja.applied_at
       FROM candidate c
       JOIN job_application ja ON c.id = ja.candidate_id
       WHERE ja.job_id = $1
       ORDER BY ja.applied_at DESC`,
      [jobId]
    );

    // 3️⃣ Format candidates grouped by candidate
    const candidatesMap = {};

    candidatesResult.rows.forEach(row => {
      if (!candidatesMap[row.candidate_id]) {
        candidatesMap[row.candidate_id] = {
          id: row.candidate_id,
          name: row.name,
          email: row.email,
          phone_number: row.phone_number,
          cv_link: row.cv_link,
          created_at: row.created_at,
          applications: []
        };
      }

      candidatesMap[row.candidate_id].applications.push({
        application_id: row.application_id,
        score_cv: row.score_cv,
        total_score: row.total_score,
        applied_at: row.applied_at
      });
    });

    res.json({
      job: jobCheck.rows[0],
      candidates: Object.values(candidatesMap)
    });

  } catch (err) {
    console.error("Error fetching candidates by job:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET CANDIDATE BY ID
router.get("/:candidateId", async (req, res) => {
  const { candidateId } = req.params;

  try {
    const result = await pool.query(
      "SELECT * FROM candidate WHERE id = $1",
      [candidateId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching candidate:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET CANDIDATE DETAILS WITH APPLICATIONS
router.get("/details/:candidateId", async (req, res) => {
  const { candidateId } = req.params;

  try {
    // Get candidate basic info
    const candidateResult = await pool.query(
      "SELECT * FROM candidate WHERE id = $1",
      [candidateId]
    );

    if (candidateResult.rows.length === 0) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    const candidate = candidateResult.rows[0];

    res.json(candidate);
  } catch (err) {
    console.error("Error fetching candidate details:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET CANDIDATE APPLICATIONS
router.get("/:candidateId/applications", async (req, res) => {
  const { candidateId } = req.params;

  try {
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
  } catch (err) {
    console.error("Error fetching candidate applications:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// PATCH /api/candidate/mark-all-passed/:jobId
router.patch("/mark-all-passed/:jobId", async (req, res) => {
  try {
    const { jobId } = req.params;

    if (!jobId) return res.status(400).json({ error: "Job ID is required" });

    // Update all job applications for this job
    const result = await pool.query(
      `UPDATE job_application 
       SET passed = TRUE
       WHERE job_id = $1
       RETURNING id`,
      [jobId]
    );

    res.status(200).json({
      message: "All applications marked as passed",
      count: result.rowCount,
      updatedApplications: result.rows
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
