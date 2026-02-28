// const express = require("express");
// const router = express.Router();
// const nodemailer = require("nodemailer");
// const { google } = require("googleapis");
// const pool = require("../config/db"); // your postgres connection
// const authenticate = require("../middleware/auth"); // JWT middleware

// const oAuth2Client = new google.auth.OAuth2(
//   process.env.GOOGLE_CLIENT_ID,
//   process.env.GOOGLE_CLIENT_SECRET,
//   process.env.GOOGLE_REDIRECT_URI
// );

// /*
// ===========================================
// STEP 1: Generate Google Consent URL
// ===========================================
// */
// router.get("/auth-url", authenticate, (req, res) => {
//   const url = oAuth2Client.generateAuthUrl({
//     access_type: "offline",
//     prompt: "consent",
//     scope: ["https://www.googleapis.com/auth/gmail.send"]
//   });

//   res.json({ url });
// });

// /*
// ===========================================
// STEP 2: Handle Google Callback
// ===========================================
// */
// router.get("/oauth2callback", async (req, res) => {
//   const code = req.query.code;
//   const hrId = req.query.state; // we pass HR id in state

//   try {
//     const { tokens } = await oAuth2Client.getToken(code);
//     oAuth2Client.setCredentials(tokens);

//     const gmail = google.gmail({
//       version: "v1",
//       auth: oAuth2Client
//     });

//     const profile = await gmail.users.getProfile({ userId: "me" });

//     const hrEmail = profile.data.emailAddress;
//     const refreshToken = tokens.refresh_token;

//     if (!refreshToken) {
//       return res.send("Refresh token not returned. Try removing previous permissions.");
//     }

//     // Save or update token in DB
//     await pool.query(
//       `
//       INSERT INTO hr_google_tokens (hr_id, email, refresh_token)
//       VALUES ($1, $2, $3)
//       ON CONFLICT (hr_id)
//       DO UPDATE SET
//         email = EXCLUDED.email,
//         refresh_token = EXCLUDED.refresh_token
//       `,
//       [hrId, hrEmail, refreshToken]
//     );

//     res.send("Gmail connected successfully. You can close this window.");
//   } catch (error) {
//     console.error("OAuth error:", error);
//     res.status(500).send("Authentication failed");
//   }
// });

// /*
// ===========================================
// STEP 3: Send Emails (Dynamic HR)
// ===========================================
// */
// router.post("/send-acceptance", authenticate, async (req, res) => {
//   try {
//     const { emails } = req.body;
//     const hrId = req.user.id;

//     if (!emails || emails.length === 0) {
//       return res.status(400).json({ message: "No emails provided" });
//     }

//     // Get HR Gmail token
//     const tokenResult = await pool.query(
//       "SELECT * FROM hr_google_tokens WHERE hr_id = $1",
//       [hrId]
//     );

//     if (tokenResult.rows.length === 0) {
//       return res.status(400).json({
//         message: "Gmail not connected. Please connect your account first."
//       });
//     }

//     const { email: hrEmail, refresh_token } = tokenResult.rows[0];

//     oAuth2Client.setCredentials({
//       refresh_token
//     });

//     const accessToken = await oAuth2Client.getAccessToken();

//     const transporter = nodemailer.createTransport({
//       service: "gmail",
//       auth: {
//         type: "OAuth2",
//         user: hrEmail,
//         clientId: process.env.GOOGLE_CLIENT_ID,
//         clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//         refreshToken: refresh_token,
//         accessToken: accessToken.token
//       }
//     });

//     const results = await Promise.all(
//       emails.map(async ({ to, subject, body }) => {
//         try {
//           await transporter.sendMail({
//             from: `"ComfyHire Team" <${hrEmail}>`,
//             to,
//             subject,
//             html: body
//           });

//           return { success: true, to };
//         } catch (error) {
//           return { success: false, to, error: error.message };
//         }
//       })
//     );

//     const successful = results.filter(r => r.success);
//     const failed = results.filter(r => !r.success);

//     res.json({
//       message: "Emails processed",
//       sent: successful.length,
//       failed: failed.length
//     });

//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: error.message });
//   }
// });

// module.exports = router;

// routes/email.js
const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");

/*
===========================================
Send Acceptance Emails Using HR Gmail + App Password
===========================================
*/
router.post("/send-acceptance", async (req, res) => {
  try {
    const { emails, hrEmail, hrAppPassword } = req.body;

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ message: "No emails provided" });
    }

    let transporter;

    // Check if HR credentials are provided (for quiz emails) or use system email (for approval emails)
    if (hrEmail && hrAppPassword) {
      // Use HR credentials
      transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: hrEmail,
          pass: hrAppPassword
        }
      });
    } else {
      // Use system email from mailer.js
      transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        },
        tls: {
          rejectUnauthorized: false // Allow self-signed certificates
        },
        secure: false // Use TLS
      });
    }

    const emailPromises = emails.map(async (emailData) => {
      const { to, subject, body } = emailData;

      try {
        await transporter.sendMail({
          from: transporter.options.auth.user,
          to,
          subject,
          html: body
        });

        return { success: true, to };
      } catch (error) {
        return { success: false, to, error: error.message };
      }
    });

    const results = await Promise.all(emailPromises);
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    res.json({
      message: "Emails processed",
      sent: successful.length,
      failed: failed.length
    });

  } catch (err) {
    console.error("Error sending emails:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;