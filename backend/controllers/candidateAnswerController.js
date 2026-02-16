const pool = require("../config/db");

// Add a candidate answer detail
exports.addCandidateAnswer = async (req, res) => {
  try {
    const { phase_candidate_id, question_item_id, raw_answer, polished_answer, score } = req.body;

    const result = await pool.query(
      `INSERT INTO candidate_answer_details
       (phase_candidate_id, question_item_id, raw_answer, polished_answer, score)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [phase_candidate_id, question_item_id, raw_answer, polished_answer, score]
    );

    res.status(201).json({ message: "Answer added successfully", answer: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all answers for a candidate in a phase
exports.getAnswersByPhaseCandidate = async (req, res) => {
  try {
    const { phase_candidate_id } = req.params;

    const result = await pool.query(
      `SELECT cad.*, qi.ques_text, qi.correct_answer
       FROM candidate_answer_details cad
       JOIN questions_items qi ON cad.question_item_id = qi.id
       WHERE cad.phase_candidate_id = $1
       ORDER BY cad.id ASC`,
      [phase_candidate_id]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update a candidate answer
exports.updateCandidateAnswer = async (req, res) => {
  try {
    const { id } = req.params;
    const { raw_answer, polished_answer, score } = req.body;

    const result = await pool.query(
      `UPDATE candidate_answer_details
       SET raw_answer = $1,
           polished_answer = $2,
           score = $3
       WHERE id = $4
       RETURNING *`,
      [raw_answer, polished_answer, score, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Answer not found" });
    }

    res.json({ message: "Answer updated successfully", answer: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete a candidate answer
exports.deleteCandidateAnswer = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM candidate_answer_details WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Answer not found" });
    }

    res.json({ message: "Answer deleted successfully", answer: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
