// backend/routes/hrRoute.js
const express = require("express");
const pool = require("../config/db"); // your pg pool
const router = express.Router();

// =========================================
// APPLY TO JOB
// =========================================
const upload = require("../middleware/uploads");

router.post("/apply/:jobId", upload.single("cv"), async (req, res) => {
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





module.exports = router;
