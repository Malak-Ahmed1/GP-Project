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

// // Controller: send quiz link
// exports.sendQuizLink = async (req, res) => {
//   try {
//     const { jobId, phaseOrder, quizLink } = req.body;

//     const candidates = await getCandidatesForPhase(jobId, phaseOrder);

//     if (candidates.length === 0) {
//       return res.status(404).json({ message: "No candidates to send link." });
//     }

//     for (let candidate of candidates) {
//       await sendEmail(
//         candidate.email,
//         `Quiz Link for Phase ${phaseOrder}`,
//         `<p>Hello ${candidate.name},</p>
//          <p>Please click the link to start your quiz:</p>
//          <a href="${link}">Start Quiz</a>`
//       );
//     }
//     // ✅ Mark the phase as quiz_sent = true
//     await pool.query(
//       `UPDATE phase 
//        SET quiz_sent = TRUE
//        WHERE job_id = $1 AND phase_order = $2`,
//       [jobId, phaseOrder]
//     );

//     res.json({ message: "Quiz links sent successfully", count: candidates.length });

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: err.message });
//   }
// };







//---------------------------------
// =========================
// Get candidates for selection and assign them to a phase
// =========================

// Get selectable candidates for a phase
// Get selectable candidates for a phase
exports.getCandidatesForPhaseSelection = async (req, res) => {
  try {
    const { jobId, phaseOrder } = req.params;

    let result;
    if (parseInt(phaseOrder) === 1) {
      // Phase 1: candidates from job_application where passed = true
      result = await pool.query(
        `SELECT ja.id AS job_application_id, c.id AS candidate_id, c.name, c.email
         FROM job_application ja
         JOIN candidate c ON ja.candidate_id = c.id
         WHERE ja.job_id = $1 AND ja.passed = true
         ORDER BY c.name ASC`,
        [jobId]
      );
    } else {
      // Phase >1: candidates from previous phase_candidates where passed = true
      result = await pool.query(
        `SELECT pc.job_application_id, c.id AS candidate_id, c.name, c.email
         FROM phase_candidates pc
         JOIN job_application ja ON ja.id = pc.job_application_id
         JOIN candidate c ON c.id = ja.candidate_id
         JOIN phase p ON pc.phase_id = p.id
         WHERE p.job_id = $1 AND p.phase_order = $2 AND pc.passed = true
         ORDER BY c.name ASC`,
        [jobId, phaseOrder - 1]
      );
    }

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// Assign selected candidates to a phase
exports.assignCandidatesToPhase = async (req, res) => {
  try {
    const { phase_id, jobApplicationIds } = req.body; // jobApplicationIds = array of selected job_application_ids

    if (!Array.isArray(jobApplicationIds) || jobApplicationIds.length === 0) {
      return res.status(400).json({ error: "No candidates selected." });
    }

    const insertedCandidates = [];
    for (let jobAppId of jobApplicationIds) {
      // Prevent duplicates
      const duplicateCheck = await pool.query(
        `SELECT * FROM phase_candidates WHERE phase_id = $1 AND job_application_id = $2`,
        [phase_id, jobAppId]
      );
      if (duplicateCheck.rows.length === 0) {
        const insert = await pool.query(
          `INSERT INTO phase_candidates (phase_id, job_application_id)
           VALUES ($1, $2)
           RETURNING *`,
          [phase_id, jobAppId]
        );
        insertedCandidates.push(insert.rows[0]);
      }
    }

    res.json({
      message: `${insertedCandidates.length} candidates assigned to phase successfully.`,
      phase_candidates: insertedCandidates
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};







// Assign selected candidates to phase AND send quiz link
exports.assignAndSendQuiz = async (req, res) => {
  try {
    const { phase_id, jobApplicationIds, phaseOrder, jobId, quizLink } = req.body;

    if (!Array.isArray(jobApplicationIds) || jobApplicationIds.length === 0) {
      return res.status(400).json({ error: "No candidates selected." });
    }

    const insertedCandidates = [];

    // 1️⃣ Insert selected candidates into phase_candidates
    for (let jobAppId of jobApplicationIds) {
      const duplicateCheck = await pool.query(
        `SELECT * FROM phase_candidates WHERE phase_id = $1 AND job_application_id = $2`,
        [phase_id, jobAppId]
      );
      if (duplicateCheck.rows.length === 0) {
        // get cgpa value
        // get cgpa value from previous phase
        let cgpaValue = 0;

        if (phaseOrder > 1) {
          const prevCgpa = await pool.query(
            `SELECT pc.cgpa_phase_score
     FROM phase_candidates pc
     JOIN phase p ON pc.phase_id = p.id
     WHERE pc.job_application_id = $1
     AND p.phase_order = $2
     AND p.job_id = $3`,
            [jobAppId, phaseOrder - 1, jobId]
          );

          if (prevCgpa.rows.length > 0 && prevCgpa.rows[0].cgpa_phase_score != null) {
            cgpaValue = prevCgpa.rows[0].cgpa_phase_score;
          }
        }

        // insert with cgpa
        const insert = await pool.query(
          `INSERT INTO phase_candidates (phase_id, job_application_id, cgpa_phase_score)
   VALUES ($1, $2, $3)
   RETURNING *`,
          [phase_id, jobAppId, cgpaValue]
        );
        insertedCandidates.push(insert.rows[0]);
      }
    }

    if (insertedCandidates.length === 0) {
      //return res.status(400).json({ message: "Selected candidates are already assigned." });
    }

    // 2️⃣ Send quiz link emails
    for (let candidate of insertedCandidates) {
      const candidateData = await pool.query(
        `SELECT c.name, c.email
         FROM job_application ja
         JOIN candidate c ON c.id = ja.candidate_id
         WHERE ja.id = $1`,
        [candidate.job_application_id]
      );
      const c = candidateData.rows[0];

      const pcId = candidate.id; // this is phase_candidates.id

const link = `http://localhost:3000/interview/${jobId}/${phase_id}/start?pcId=${pcId}`;
      await sendEmail(
        c.email,
        `Quiz Link for Phase ${phaseOrder}`,
        `<p>Hello ${c.name},</p>
   <p>Please click the link to start your quiz:</p>
   <a href="${link}">Start Quiz</a>`
      );
    }

    // 3️⃣ Mark the phase as quiz_sent = true
    await pool.query(
      `UPDATE phase 
       SET quiz_sent = TRUE
       WHERE id = $1`,
      [phase_id]
    );

    res.json({
      message: `Quiz sent and ${insertedCandidates.length} candidates assigned successfully!`,
      phase_candidates: insertedCandidates
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};