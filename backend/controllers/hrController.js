const pool = require("../config/db");

// Create HR
exports.createHR = async (req, res) => {
  try {
    const {
      name,
      email,
      company_email,
      phone_number,
      company_name,
      position
    } = req.body;

    const result = await pool.query(
      `INSERT INTO hr (name, email, company_email, phone_number, company_name, position)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, email, company_email, phone_number, company_name, position]
    );

    res.status(201).json({
      message: "HR created successfully",
      hr: result.rows[0]
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all HR
exports.getHR = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM hr ORDER BY id ASC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
