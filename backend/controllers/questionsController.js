const pool = require("../config/db");
const multer = require("multer");
const xlsx = require("xlsx");


const upload = multer({ storage: multer.memoryStorage() });

exports.uploadQuestionsExcel = [
  upload.single("file"),
  async (req, res) => {
    try {
      const { phaseId } = req.params;

      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // read excel
      const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      const rows = xlsx.utils.sheet_to_json(sheet);

      // validate
      const validRows = rows
        .map(r => ({
          ques_text: (r.ques_text || "").toString().trim(),
          correct_answer: (r.correct_answer || "").toString().trim()
        }))
        .filter(r => r.ques_text.length > 0);

      if (validRows.length === 0) {
        return res.status(400).json({ error: "Excel has no valid rows" });
      }

      // insert into DB
      const created = [];

      for (const r of validRows) {
        const result = await pool.query(
          `INSERT INTO questions_items (phase_id, ques_text, correct_answer)
           VALUES ($1, $2, $3)
           RETURNING *`,
          [phaseId, r.ques_text, r.correct_answer]
        );

        created.push(result.rows[0]);
      }

      return res.status(201).json({
        message: "Questions uploaded successfully",
        createdCount: created.length,
        questions: created
      });

    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
  }
];

// Create Question Item
exports.createQuestion = async (req, res) => {
  try {
    const { phase_id, ques_text, correct_answer } = req.body;

    // Check phase exists
    const phaseCheck = await pool.query("SELECT * FROM phase WHERE id = $1", [phase_id]);
    if (phaseCheck.rows.length === 0) {
      return res.status(400).json({ error: "Phase not found." });
    }

    const result = await pool.query(
      `INSERT INTO questions_items (phase_id, ques_text, correct_answer)
       VALUES ($1,$2,$3) RETURNING *`,
      [phase_id, ques_text, correct_answer]
    );

    res.status(201).json({
      message: "Question created successfully",
      question: result.rows[0]
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all questions
exports.getQuestions = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT q.*, p.phase_order, j.title as job_title
       FROM questions_items q
       JOIN phase p ON q.phase_id = p.id
       JOIN job j ON p.job_id = j.id
       ORDER BY q.id ASC`
    );

    res.json(result.rows);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// Get questions by phase
exports.getQuestionsByPhase = async (req, res) => {
  try {
    const { phaseId } = req.params;

    const result = await pool.query(
      `SELECT * FROM questions_items
       WHERE phase_id = $1
       ORDER BY id ASC`,
      [phaseId]
    );

    res.json(result.rows);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// Get all questions for a specific job
exports.getQuestionsByJob = async (req, res) => {
  try {
    const { jobId } = req.params;

    const result = await pool.query(
      `SELECT q.*, p.phase_order, p.id AS phase_id
       FROM questions_items q
       JOIN phase p ON q.phase_id = p.id
       WHERE p.job_id = $1
       ORDER BY p.phase_order ASC, q.id ASC`,
      [jobId]
    );

    res.json(result.rows);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update question (any fields)
exports.updateQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    const { ques_text, correct_answer, phase_id } = req.body;

    console.log("DEBUG: updateQuestion called");
    console.log("Question ID:", questionId);
    console.log("Body:", req.body);

    // Check question exists
    const check = await pool.query(
      "SELECT * FROM questions_items WHERE id = $1",
      [questionId]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ error: "Question not found." });
    }

    // Update only provided fields
    const result = await pool.query(
      `UPDATE questions_items
       SET 
         ques_text = COALESCE($1, ques_text),
         correct_answer = COALESCE($2, correct_answer),
         phase_id = COALESCE($3, phase_id)
       WHERE id = $4
       RETURNING *`,
      [ques_text, correct_answer, phase_id, questionId]
    );

    res.json({
      message: "Question updated successfully",
      question: result.rows[0]
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// Delete question
exports.deleteQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;

    console.log("DEBUG: deleteQuestion called");
    console.log("Question ID:", questionId);

    const result = await pool.query(
      "DELETE FROM questions_items WHERE id = $1 RETURNING *",
      [questionId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Question not found." });
    }

    res.json({
      message: "Question deleted successfully",
      question: result.rows[0]
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
