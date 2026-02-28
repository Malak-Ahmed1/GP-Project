const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// exports.sendAcceptanceMail = async (req, res) => {
//   try {
//     const { to, subject, body } = req.body;

//     if (!to || !subject || !body) {
//       return res.status(400).json({ message: 'Missing parameters' });
//     }

//     await transporter.sendMail({
//       from: process.env.EMAIL_USER,
//       to,
//       subject,
//       html: body
//     });

//     res.json({ message: 'Acceptance email sent successfully' });

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: err.message });
//   }
// };

exports.sendAcceptanceMail = async (req, res) => {
  try {
    const { emails } = req.body; // array of { to, subject, body }

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ message: 'No emails provided' });
    }

    for (let emailData of emails) {
      const { to, subject, body } = emailData;
      if (!to || !subject || !body) continue;

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to,
        subject,
        html: body
      });
    }

    res.json({ message: 'Acceptance emails sent', count: emails.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

