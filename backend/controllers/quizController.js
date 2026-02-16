const pool = require("../config/db");
const nodemailer = require("nodemailer");

// Setup Gmail transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // your gmail
    pass: process.env.EMAIL_PASS  // your app password
  }
});

// Helper to send email
async function sendEmail(to, subject, htmlContent) {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    html: htmlContent
  });
}

// Get candidates to send quiz link
async function getCandidatesForPhase(jobId, phaseOrder) {
  if (phaseOrder === 1) {
    // Phase 1: candidates with score_cv > 50
    const result = await pool.query(
      `SELECT c.id, c.name, c.email
       FROM candidate c
       JOIN job_application ja ON c.id = ja.candidate_id
       WHERE ja.job_id = $1 AND ja.score_cv > 50`,
      [jobId]
    );
    return result.rows;
  } else {
    // Phase > 1: candidates who passed previous phase
    const result = await pool.query(
      `SELECT c.id, c.name, c.email
       FROM candidate c
       JOIN job_application ja ON c.id = ja.candidate_id
       JOIN phase_candidates pc ON ja.id = pc.job_application_id
       JOIN phase p ON pc.phase_id = p.id
       WHERE p.job_id = $1 AND p.phase_order = $2 AND pc.passed = true`,
      [jobId, phaseOrder - 1]
    );
    return result.rows;
  }
}

// Controller: send quiz link
exports.sendQuizLink = async (req, res) => {
  try {
    const { jobId, phaseOrder, quizLink } = req.body;

    const candidates = await getCandidatesForPhase(jobId, phaseOrder);

    if (candidates.length === 0) {
      return res.status(404).json({ message: "No candidates to send link." });
    }

    for (let candidate of candidates) {
      await sendEmail(
        candidate.email,
        `Quiz Link for Phase ${phaseOrder}`,
        `<p>Hello ${candidate.name},</p>
         <p>Please click the link to start your quiz:</p>
         <a href="${quizLink}">Start Quiz</a>`
      );
    }
    // ✅ Mark the phase as quiz_sent = true
    await pool.query(
      `UPDATE phase 
       SET quiz_sent = TRUE
       WHERE job_id = $1 AND phase_order = $2`,
      [jobId, phaseOrder]
    );

    res.json({ message: "Quiz links sent successfully", count: candidates.length });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
