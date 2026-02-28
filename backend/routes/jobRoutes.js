// backend/routes/hrRoute.js
const express = require("express");
const pool = require("../config/db"); // make sure this file exists and exports pool
const router = express.Router();

console.log("Job routes loaded");

// Test route
router.get("/test", async (req, res) => {
  console.log("Job test route hit");
  
  try {
    // Test database connection
    const result = await pool.query("SELECT NOW()");
    console.log("Database test successful:", result.rows[0]);
    
    res.json({ 
      message: "Job routes are working!",
      database: "Connected",
      time: result.rows[0].now
    });
  } catch (err) {
    console.error("Database test failed:", err);
    res.status(500).json({ 
      message: "Job routes loaded but database failed",
      error: err.message 
    });
  }
});

router.post("/add-job", async (req, res) => {
  console.log("=== JOB CREATION REQUEST STARTED ===");
  console.log("Job creation request received");
  console.log("Request body:", req.body);
  console.log("Request headers:", req.headers);
  
  const { hr_id, title, jobDescription, closingDate, fields } = req.body;

  if (!hr_id || !title) {
    console.log("Missing required fields:", { hr_id, title });
    return res.status(400).json({ message: "HR ID and title are required" });
  }

  console.log("Attempting to connect to database...");
  const client = await pool.connect();
  console.log("Database connected successfully");

  try {
    await client.query("BEGIN");
    console.log("Database transaction started");

    // 1️⃣ Insert job with description
    const jobResult = await client.query(
      `INSERT INTO job (hr_id, title, job_desc, end_date)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [hr_id, title, jobDescription || null, closingDate || null]
    );

    const job = jobResult.rows[0];
    console.log("Job inserted:", job);

    // 2️⃣ Insert custom fields
    console.log("Inserting fields:", fields);
    for (const field of fields) {
      const fieldResult = await client.query(
        `INSERT INTO job_field (job_id, field_name, field_type, is_required)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [job.id, field.label, field.type, field.isRequired || false]
      );
      console.log("Field inserted:", fieldResult.rows[0]);
    }

    await client.query("COMMIT");
    console.log("Transaction committed");

    const response = {
      message: "Job created successfully",
      job
    };
    console.log("Sending response:", response);
    res.status(201).json(response);

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Create job error:", err.message);
    console.error("Full error:", err);
    res.status(500).json({ message: "Server error: " + err.message });
  } finally {
    client.release();
    console.log("Database connection released");
    console.log("=== JOB CREATION REQUEST ENDED ===");
  }
});

// Close job manually
router.post("/close-job/:jobId", async (req, res) => {
  const { jobId } = req.params;
  
  try {
    const result = await pool.query(
      `UPDATE job 
       SET available = false 
       WHERE id = $1
       RETURNING *`,
      [jobId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Job not found" });
    }

    console.log(`Job "${result.rows[0].title}" closed manually`);
    res.json({ 
      message: "Job closed successfully", 
      job: result.rows[0] 
    });

  } catch (err) {
    console.error("Close job error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// Get job details + fields
router.get("/details/:jobId", async (req, res) => {
  const { jobId } = req.params;

  try {
    // 1️⃣ Get job
    const jobResult = await pool.query(
      `SELECT id, title, job_desc, available, end_date, created_at
       FROM job
       WHERE id = $1`,
      [jobId]
    );

    if (jobResult.rows.length === 0) {
      return res.status(404).json({ message: "Job not found" });
    }

    const job = jobResult.rows[0];
    
    console.log(`Job ${jobId} details:`, {
      id: job.id,
      title: job.title,
      available: job.available,
      end_date: job.end_date
    });
    
    // 2️⃣ Get job fields
    const fieldsResult = await pool.query(
      `SELECT id, field_name, field_type, is_required
       FROM job_field
       WHERE job_id = $1
       ORDER BY id ASC`,
      [jobId]
    );

    // 3️⃣ Calculate status directly from available field
    let status;
    if (job.end_date) {
      const endDate = new Date(job.end_date);
      const now = new Date();
      
      console.log(`Job with end date:`, {
        endDate: endDate,
        now: now,
        isExpired: endDate <= now
      });
      
      if (endDate <= now) {
        status = 'closed';
        console.log(`Job ${jobId} is expired, setting status to closed`);
      } else {
        status = job.available ? 'open' : 'closed';
        console.log(`Job ${jobId} has end date but not expired, using available field: ${job.available}, status: ${status}`);
      }
    } else {
      // If no end date, use the available field directly
      status = job.available ? 'open' : 'closed';
      console.log(`Job ${jobId} has no end date, using available field: ${job.available}, status: ${status}`);
    }

    console.log(`Final status for job ${jobId}: ${status}`);

    // 4️⃣ Send full response
    res.json({
      id: job.id,
      title: job.title,
      job_desc: job.job_desc,
      end_date: job.end_date,
      created_at: job.created_at,
      status,
      fields: fieldsResult.rows
    });

  } catch (err) {
    console.error("Get job details error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});


// Open job manually
router.post("/open-job/:jobId", async (req, res) => {
  const { jobId } = req.params;
  
  try {
    const result = await pool.query(
      `UPDATE job 
       SET available = true, end_date = null
       WHERE id = $1
       RETURNING *`,
      [jobId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Job not found" });
    }

    console.log(`Job "${result.rows[0].title}" opened manually`);
    res.json({ 
      message: "Job opened successfully", 
      job: result.rows[0] 
    });

  } catch (err) {
    console.error("Open job error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete job
router.delete("/delete-job/:jobId", async (req, res) => {
  const { jobId } = req.params;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1️⃣ Delete related job fields first (foreign key safety)
    await client.query(
      `DELETE FROM job_field WHERE job_id = $1`,
      [jobId]
    );

    // 2️⃣ Delete the job
    const result = await client.query(
      `DELETE FROM job WHERE id = $1 RETURNING *`,
      [jobId]
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Job not found" });
    }

    await client.query("COMMIT");

    console.log(`Job "${result.rows[0].title}" deleted`);

    res.json({
      message: "Job deleted successfully",
      job: result.rows[0]
    });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Delete job error:", err.message);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
});

// PUT /api/job/update-job/:jobId - Update an existing job
router.put("/update-job/:jobId", async (req, res) => {
  const client = await pool.connect();
  const { jobId } = req.params;
  const { hr_id, title, jobDescription, closingDate, fields } = req.body;

  console.log("Updating job:", {
    jobId,
    hr_id,
    title,
    jobDescription,
    closingDate,
    fields
  });

  try {
    await client.query("BEGIN");

    // 1️⃣ Check if job exists and belongs to the HR
    const jobCheck = await client.query(
      `SELECT id, title FROM job WHERE id = $1 AND hr_id = $2`,
      [jobId, hr_id]
    );

    if (jobCheck.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Job not found or access denied" });
    }

    // 2️⃣ Update job title, description, and date
   const updateQuery = `
  UPDATE job 
  SET title = $1, job_desc = $2, end_date = $3
  WHERE id = $4 AND hr_id = $5
  RETURNING *
`;

    
    const result = await client.query(updateQuery, [
      title,
      jobDescription,
      closingDate || null,
      jobId,
      hr_id
    ]);

    // 3️⃣ Delete existing fields and insert new ones
    await client.query("DELETE FROM job_field WHERE job_id = $1", [jobId]);
    
    console.log("Updating fields:", fields);
    for (const field of fields) {
      const fieldResult = await client.query(
        `INSERT INTO job_field (job_id, field_name, field_type, is_required)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [jobId, field.label, field.type, field.isRequired || false]
      );
      console.log("Field updated:", fieldResult.rows[0]);
    }

    await client.query("COMMIT");

    console.log(`Job "${title}" updated successfully`);

    res.json({
      message: "Job updated successfully",
      job: result.rows[0]
    });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Update job error:", err.message);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
});

module.exports = router; 
