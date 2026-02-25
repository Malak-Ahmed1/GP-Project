const pool = require("../config/db");

// Create Phase with automatic phase_order
exports.createPhase = async (req, res) => {
  try {
    const {
      job_id,
      ranked = false,
      method,
      time_limit,
      available = true,
      num_questions,
      severity,
      end_date,
      link
    } = req.body;

    // Check job exists
    const jobCheck = await pool.query("SELECT * FROM job WHERE id = $1", [job_id]);
    if (jobCheck.rows.length === 0) {
      return res.status(400).json({ error: "Job not found." });
    }

    // Get the last phase_order for this job
    const lastPhase = await pool.query(
      "SELECT phase_order FROM phase WHERE job_id = $1 ORDER BY phase_order DESC LIMIT 1",
      [job_id]
    );

    let phase_order = 1; // default if no phases yet
    if (lastPhase.rows.length > 0) {
      phase_order = lastPhase.rows[0].phase_order + 1; // next order
    }

    // Insert the new phase
    const result = await pool.query(
      `INSERT INTO phase 
      (job_id, phase_order, ranked, method, time_limit, available, num_questions, severity, end_date, link)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *`,
      [job_id, phase_order, ranked, method, time_limit, available, num_questions, severity, end_date, link]
    );

    res.status(201).json({
      message: "Phase created successfully",
      phase: result.rows[0]
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// Update phase info
exports.updatePhase = async (req, res) => {
  try {
    const { phaseId } = req.params;
    const { time_limit, num_questions, severity, end_date } = req.body;

    // Update only the fields provided
    const result = await pool.query(
      `UPDATE phase
       SET time_limit = COALESCE($1, time_limit),
           num_questions = COALESCE($2, num_questions),
           severity = COALESCE($3, severity),
           end_date = COALESCE($4, end_date)
       WHERE id = $5
       RETURNING *`,
      [time_limit, num_questions, severity, end_date, phaseId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Phase not found" });
    }

    res.json({ message: "Phase updated", phase: result.rows[0] });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};






// Get all phases
exports.getPhases = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, j.title as job_title
       FROM phase p
       JOIN job j ON p.job_id = j.id
       ORDER BY p.id ASC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// Get all phases for a specific job
exports.getPhasesByJob = async (req, res) => {
  try {
    const { jobId } = req.params;

    const result = await pool.query(
      `SELECT * FROM phase
       WHERE job_id = $1
       ORDER BY phase_order ASC`,
      [jobId]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// DELETE phase ONLY if no questions exist
exports.deletePhaseSafe = async (req, res) => {

  try {

    const { phaseId } = req.params;

    console.log("SAFE DELETE phase:", phaseId);

    // check questions count
    const questionCheck = await pool.query(
      "SELECT COUNT(*) FROM questions_items WHERE phase_id = $1",
      [phaseId]
    );

    const count = parseInt(questionCheck.rows[0].count);

    if (count > 0) {
      return res.status(400).json({
        error: "Cannot delete phase. It contains questions."
      });
    }

    // delete phase
    await pool.query(
      "DELETE FROM phase WHERE id = $1",
      [phaseId]
    );

    res.json({
      message: "Phase deleted successfully (safe delete)"
    });

  } catch (err) {

    console.error(err);
    res.status(500).json({ error: err.message });

  }

};


// ----- FORCE DELETE: Delete phase along with all its questions and related data -----
exports.deletePhaseForce = async (req, res) => {
  try {
    const { phaseId } = req.params;

    console.log("FORCE DELETE phase:", phaseId);

    // check if phase exists
    const check = await pool.query("SELECT * FROM phase WHERE id = $1", [phaseId]);

    if (check.rows.length === 0) {
      return res.status(404).json({ error: "Phase not found" });
    }

    // delete phase -> cascades to questions and dependent tables
    await pool.query("DELETE FROM phase WHERE id = $1", [phaseId]);

    res.json({
      message: "Phase and all its questions deleted successfully (force delete)"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};




// MARK acceptance as sent
exports.markAcceptanceSent = async (req, res) => {
  try {
    const { phase_id } = req.body;

    const result = await pool.query(
      `UPDATE phase
       SET acceptance_sent = TRUE
       WHERE id = $1
       RETURNING *`,
      [phase_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Phase not found" });
    }

    res.json({
      message: "Acceptance marked as sent",
      phase: result.rows[0]
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};