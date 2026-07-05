const pool = require("../config/db");

exports.createCheatingEvent = async (req, res) => {
  try {
    const { phase_candidate_id, cheating_type, description } = req.body;

    const evidencePath = req.file ? `/uploads/${req.file.filename}` : null;

    // 1) insert cheating event
    await pool.query(
      `INSERT INTO cheating_events (phase_candidate_id, cheating_type, description, evidence)
       VALUES ($1, $2, $3, $4)`,
      [phase_candidate_id, cheating_type, description, evidencePath]
    );

    // 2) mark phase candidate cheating_flag = true
    await pool.query(
      `UPDATE phase_candidates
       SET cheating_flag = true
       WHERE id = $1`,
      [phase_candidate_id]
    );

    res.status(201).json({ message: "Cheating event saved" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



exports.getCheatingEventsByPhaseCandidate = async (req, res) => {
  try {
    const { id } = req.params; // phase_candidate_id
    const result = await pool.query(
      `SELECT id, phase_candidate_id, cheating_type, description, evidence, created_at
       FROM cheating_events
       WHERE phase_candidate_id = $1
       ORDER BY created_at DESC`,
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};