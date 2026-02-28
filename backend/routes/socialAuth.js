const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { v4: uuidv4 } = require("uuid"); // random token

// Simulated social login
router.post("/social-login", async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email || !name) {
      return res.status(400).json({ message: "Missing email or name" });
    }

    // Check if user exists
    const userResult = await pool.query(
      "SELECT * FROM hr WHERE email=$1",
      [email]
    );

    let user;

    if (userResult.rows.length === 0) {
      // Create HR with random token as password
      const randomToken = uuidv4(); // temporary password

      const insertResult = await pool.query(
        `INSERT INTO hr (name, email, company_email, password)
         VALUES ($1, $2, $2, $3)
         RETURNING *`,
        [name, email, randomToken]
      );

      user = insertResult.rows[0];
    } else {
      user = userResult.rows[0];
    }

    // Return random token for now (later JWT/Firebase token)
    const token = uuidv4();

    res.json({
      message: "Social login success",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        company_email: user.company_email,
        phone_number: user.phone_number,
        company_name: user.company_name,
      },
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
