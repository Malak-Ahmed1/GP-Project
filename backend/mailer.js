const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail", // you can use other providers too
  auth: {
    user: process.env.EMAIL_USER, // your gmail
    pass: process.env.EMAIL_PASS, // app password if using gmail
  },
});

const sendEmail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      html,
    });
    console.log("Email sent to:", to);
  } catch (err) {
    console.error("Error sending email:", err.message);
  }
};

module.exports = sendEmail;
