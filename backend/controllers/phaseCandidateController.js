const pool = require("../config/db");

// Assign candidate to a phase
exports.assignCandidateToPhase = async (req, res) => {
  try {
    const { phase_id, job_application_id } = req.body;

    // Check phase exists
    const phaseCheck = await pool.query("SELECT * FROM phase WHERE id = $1", [phase_id]);
    if (phaseCheck.rows.length === 0) return res.status(400).json({ error: "Phase not found." });

    // Check job_application exists
    const appCheck = await pool.query("SELECT * FROM job_application WHERE id = $1", [job_application_id]);
    if (appCheck.rows.length === 0) return res.status(400).json({ error: "Job application not found." });

    // Prevent duplicate assignment
    const duplicateCheck = await pool.query(
      "SELECT * FROM phase_candidates WHERE phase_id = $1 AND job_application_id = $2",
      [phase_id, job_application_id]
    );
    if (duplicateCheck.rows.length > 0) return res.status(400).json({ error: "Candidate already assigned to this phase." });

    // Insert
    const result = await pool.query(
      `INSERT INTO phase_candidates (phase_id, job_application_id)
       VALUES ($1, $2)
       RETURNING *`,
      [phase_id, job_application_id]
    );

    res.status(201).json({
      message: "Candidate assigned to phase successfully",
      phase_candidate: result.rows[0]
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all candidates in a phase
exports.getPhaseCandidates = async (req, res) => {
  try {
    const { phaseId } = req.params;

    const result = await pool.query(
      `SELECT 
pc.*, 
c.name AS candidate_name,
c.email AS candidate_email,
j.title AS job_title
FROM phase_candidates pc
JOIN job_application ja ON pc.job_application_id = ja.id
JOIN candidate c ON ja.candidate_id = c.id
JOIN job j ON ja.job_id = j.id
WHERE pc.phase_id = $1
ORDER BY pc.id ASC
`,
      [phaseId]

    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update phase candidate (score, passed, cheating_flag)
exports.updatePhaseCandidate = async (req, res) => {
  try {
    const { id } = req.params;
    const { phase_score, passed, cheating_flag, video_url } = req.body;

    const result = await pool.query(
      `UPDATE phase_candidates
       SET phase_score = $1,
           passed = $2,
           cheating_flag = $3,
           video_url = $4
       WHERE id = $5
       RETURNING *`,
      [phase_score, passed, cheating_flag, video_url, id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: "Phase candidate not found." });

    res.json({ message: "Phase candidate updated successfully", phase_candidate: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete phase candidate
exports.deletePhaseCandidate = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM phase_candidates WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: "Phase candidate not found." });

    res.json({ message: "Phase candidate deleted successfully", phase_candidate: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
