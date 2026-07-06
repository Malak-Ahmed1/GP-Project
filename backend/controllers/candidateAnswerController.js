const pool = require("../config/db");

// Add a candidate answer detail
// exports.addCandidateAnswer = async (req, res) => {
//   try {
//     const { phase_candidate_id, question_item_id, raw_answer, polished_answer, score } = req.body;

//     const result = await pool.query(
//       `INSERT INTO candidate_answer_details
//        (phase_candidate_id, question_item_id, raw_answer, polished_answer, score)
//        VALUES ($1, $2, $3, $4, $5)
//        RETURNING *`,
//       [phase_candidate_id, question_item_id, raw_answer, polished_answer, score]
//     );

//     res.status(201).json({ message: "Answer added successfully", answer: result.rows[0] });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

exports.addCandidateAnswer = async (req, res) => {
  try {
    const { phase_candidate_id, question_item_id, raw_answer, polished_answer, score } = req.body;

    // 1) Insert the answer row
    const insertRes = await pool.query(
      `INSERT INTO candidate_answer_details
       (phase_candidate_id, question_item_id, raw_answer, polished_answer, score)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [phase_candidate_id, question_item_id, raw_answer, polished_answer, score]
    );

    // 2) Recalculate PHASE SCORE = SUM(question scores) for this phase_candidate
    const sumRes = await pool.query(
  `SELECT COALESCE(AVG(score), 0) AS phase_score
   FROM candidate_answer_details
   WHERE phase_candidate_id = $1`,
  [phase_candidate_id]
);
    const phaseScore = Number(sumRes.rows[0].phase_score) || 0;

    // 3) Get job_application_id + current phase_order + job_id
    const pcRes = await pool.query(
      `SELECT pc.job_application_id, p.phase_order, p.job_id
       FROM phase_candidates pc
       JOIN phase p ON pc.phase_id = p.id
       WHERE pc.id = $1`,
      [phase_candidate_id]
    );

    if (pcRes.rows.length === 0) {
      return res.status(404).json({ error: "phase_candidate_id not found" });
    }

    const { job_application_id, phase_order, job_id } = pcRes.rows[0];

    // 4) Update phase_candidates.phase_score
    await pool.query(
      `UPDATE phase_candidates
       SET phase_score = $1
       WHERE id = $2`,
      [phaseScore, phase_candidate_id]
    );

    // 5) Recalculate CGPA (cumulative) = SUM(phase_score) for all phases <= current phase_order
    const cgpaRes = await pool.query(
      `SELECT COALESCE(SUM(pc.phase_score), 0) AS cgpa
       FROM phase_candidates pc
       JOIN phase p ON pc.phase_id = p.id
       WHERE pc.job_application_id = $1
         AND p.job_id = $2
         AND p.phase_order <= $3`,
      [job_application_id, job_id, phase_order]
    );

    const newCGPA = Number(cgpaRes.rows[0].cgpa) || 0;

    // 6) Update phase_candidates.cgpa_phase_score for THIS phase_candidate row
    await pool.query(
      `UPDATE phase_candidates
       SET cgpa_phase_score = $1
       WHERE id = $2`,
      [newCGPA, phase_candidate_id]
    );

    // 7) Update job_application.cgpa (cumulative)
    await pool.query(
      `UPDATE job_application
       SET cgpa = $1
       WHERE id = $2`,
      [newCGPA, job_application_id]
    );

    // OPTIONAL: if you have a column like job_application.phase_score, update it too:
    // await pool.query(
    //   `UPDATE job_application
    //    SET phase_score = $1
    //    WHERE id = $2`,
    //   [phaseScore, job_application_id]
    // );

    res.status(201).json({
      message: "Answer saved + phase score + CGPA updated successfully",
      answer: insertRes.rows[0],
      phase_score: phaseScore,
      cgpa: newCGPA
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// Get all answers for a candidate in a phase
exports.getAnswersByPhaseCandidate = async (req, res) => {
  try {
    const { phase_candidate_id } = req.params;
    console.log("Fetching answers for phase_candidate_id:", phase_candidate_id);

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