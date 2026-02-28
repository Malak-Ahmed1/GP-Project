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

// Update phase candidate score and CGPA based on previous phase only
exports.updatePhaseCandidateWithCGPA = async (req, res) => {
  try {
    const { id } = req.params;
    let { phase_score, passed, cheating_flag, video_url } = req.body;

    // Ensure phase_score is a number
    phase_score = parseFloat(phase_score) || 0;

    // 1️⃣ Get the phase candidate info along with job_application_id and phase_id
    const candidateRes = await pool.query(
      `SELECT pc.*, ja.cgpa AS current_cgpa, ja.id AS job_application_id
       FROM phase_candidates pc
       JOIN job_application ja ON pc.job_application_id = ja.id
       WHERE pc.id = $1`,
      [id]
    );

    if (candidateRes.rows.length === 0) {
      return res.status(404).json({ error: "Phase candidate not found." });
    }

    const candidate = candidateRes.rows[0];

    // 2️⃣ Get previous phase CGPA (highest phase < current)
    const previousPhaseRes = await pool.query(
      `SELECT cgpa_phase_score
       FROM phase_candidates
       WHERE job_application_id = $1 AND phase_id < $2
       ORDER BY phase_id DESC
       LIMIT 1`,
      [candidate.job_application_id, candidate.phase_id]
    );

    // If no previous phase, previous CGPA = 0
    const previousCGPA = previousPhaseRes.rows.length > 0
      ? parseFloat(previousPhaseRes.rows[0].cgpa_phase_score) || 0
      : 0;

    // 3️⃣ New CGPA = previous phase CGPA + current phase_score
    const newCGPA = previousCGPA + phase_score;

    // 4️⃣ Update phase candidate
    const updatePhase = await pool.query(
      `UPDATE phase_candidates
       SET phase_score = $1,
           passed = $2,
           cheating_flag = $3,
           video_url = $4,
           cgpa_phase_score = $5
       WHERE id = $6
       RETURNING *`,
      [phase_score, passed, cheating_flag, video_url, newCGPA, id]
    );

    // 5️⃣ Update job_application CGPA
    await pool.query(
      `UPDATE job_application
       SET cgpa = $1
       WHERE id = $2`,
      [newCGPA, candidate.job_application_id]
    );

    res.json({
      message: "Phase score and cumulative CGPA updated successfully",
      phase_candidate: updatePhase.rows[0],
      new_cgpa: newCGPA
    });

  } catch (err) {
    console.error(err);
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




// Mark candidate(s) as passed after sending acceptance mail
exports.markCandidatesPassed = async (req, res) => {
  try {
    const { phase_id, candidate_ids } = req.body; // candidate_ids = array of job_application_ids

    if (!phase_id || !Array.isArray(candidate_ids) || candidate_ids.length === 0) {
      return res.status(400).json({ error: "phase_id and candidate_ids are required." });
    }

    // Update phase_candidates passed=true
    const result = await pool.query(
      `UPDATE phase_candidates
       SET passed = true
       WHERE phase_id = $1 AND job_application_id = ANY($2::int[])
       RETURNING *`,
      [phase_id, candidate_ids]
    );

    res.json({
      message: `Marked ${result.rows.length} candidate(s) as passed.`,
      updated: result.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};