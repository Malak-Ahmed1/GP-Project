// backend/routes/hrRoute.js
const express = require("express");
const pool = require("../config/db"); // make sure this file exists and exports pool
const router = express.Router();

// HR signup
router.post("/signup", async (req, res) => {
  const { firstName, lastName, email, password, companyName, companyEmail, phoneNumber } = req.body;

  try {
    // Check if HR exists
    const existing = await pool.query(
      "SELECT * FROM hr WHERE email = $1 OR company_email = $2",
      [email, companyEmail]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ message: "HR with this email already exists" });
    }

    // Insert HR
    const result = await pool.query(
      `INSERT INTO hr (name, email, company_email, password, company_name, phone_number)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [`${firstName} ${lastName}`, email, companyEmail, password, companyName, phoneNumber || null]
    );

    res.status(201).json({ message: "HR account created successfully", hr: result.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }

});
// -------------------
// HR LOGIN
// -------------------
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    console.log("Login attempt with email:", email);
    
    // Find HR by either work email or company email
    const hrQuery = await pool.query(
      "SELECT * FROM hr WHERE email = $1 OR company_email = $1", 
      [email]
    );

    console.log("HR query result:", hrQuery.rows);

    if (hrQuery.rows.length === 0) {
      console.log("No HR found with email:", email);
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const hr = hrQuery.rows[0];
    console.log("Found HR:", hr.email, "Company email:", hr.company_email);

    // Check password (for now plain text)
    if (hr.password !== password) {
      console.log("Password mismatch for email:", email);
      return res.status(401).json({ message: "Invalid email or password" });
    }

    console.log("Login successful for:", email);
    
    // Success
    res.status(200).json({ message: "Login successful", hr });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});
// -------------------
// GET HR PROFILE
// -------------------
router.get("/profile/:id", async (req, res) => {
  const { id } = req.params;
  console.log("Profile request received for ID:", id);

  try {
    const result = await pool.query(
      `SELECT id, name, email, company_email, company_name, phone_number, created_at
       FROM hr
       WHERE id = $1`,
      [id]
    );

    console.log("Profile query result:", result.rows);

    if (result.rows.length === 0) {
      console.log("No HR found with ID:", id);
      return res.status(404).json({ message: "HR not found" });
    }

    console.log("Sending profile data:", result.rows[0]);
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error("Profile fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// UPDATE HR PROFILE
// -------------------
router.put("/profile/:id", async (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, email, companyEmail, company, phoneNumber, country, profilePhoto } = req.body;

  console.log("Profile update request for ID:", id);
  console.log("Update data:", { firstName, lastName, email, companyEmail, company, phoneNumber, country, profilePhoto });
  console.log("Request body type:", typeof req.body);
  console.log("All request body keys:", Object.keys(req.body || {}));

  // Extract phone number value if it's an object (from PhoneInput)
  let actualPhoneNumber = phoneNumber;
  if (phoneNumber && typeof phoneNumber === 'object' && phoneNumber.target) {
    actualPhoneNumber = phoneNumber.target.value;
    console.log("Extracted phone number from object:", actualPhoneNumber);
  }

  // Validate required fields
  if (!firstName || !lastName || !email) {
    return res.status(400).json({ message: "First name, last name, and email are required" });
  }

  // Validate phone number length
  if (actualPhoneNumber && actualPhoneNumber.length > 50) {
    return res.status(400).json({ message: "Phone number is too long (max 50 characters)" });
  }

  try {
    const fullName = `${firstName} ${lastName}`;
    console.log("Constructed full name:", fullName);
    console.log("SQL Parameters:", [fullName, email, companyEmail, company, actualPhoneNumber, id]);

    const result = await pool.query(
      `UPDATE hr 
       SET name = COALESCE($1, name),
           email = COALESCE($2, email),
           company_email = COALESCE($3, company_email),
           company_name = COALESCE($4, company_name),
           phone_number = COALESCE($5, phone_number)
       WHERE id = $6
       RETURNING id, name, email, company_email, company_name, phone_number, created_at`,
      [fullName, email, companyEmail, company, actualPhoneNumber, id]
    );

    console.log("Profile update result:", result.rows);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "HR not found" });
    }

    res.status(200).json({ 
      message: "Profile updated successfully",
      hr: result.rows[0]
    });
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// -------------------------
// GET ALL JOBS FOR HR
// -------------------------
router.get("/:hrId", async (req, res) => {
  const { hrId } = req.params;

  try {
    const jobScheduler = require('../services/jobScheduler');
    const jobs = await jobScheduler.getJobsWithStatus(hrId);

    res.status(200).json(jobs);

  } catch (err) {
    console.error("Fetch jobs error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// SOCIAL LOGIN
// -------------------
router.post("/social-login", async (req, res) => {
  const { provider, email, name, providerId } = req.body;

  try {
    console.log("Social login attempt:", { provider, email, name });

    // Check if HR exists with this email
    const hrQuery = await pool.query(
      "SELECT * FROM hr WHERE email = $1 OR company_email = $1", 
      [email]
    );

    let hr;
    if (hrQuery.rows.length === 0) {
      // Create new HR user from social login
      const result = await pool.query(
        `INSERT INTO hr (name, email, company_email, password)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [name, email, email, 'social-login'] // Placeholder password
      );
      hr = result.rows[0];
      console.log("Created new HR from social login:", hr.email);
    } else {
      hr = hrQuery.rows[0];
      console.log("Found existing HR for social login:", hr.email);
    }

    res.status(200).json({ message: "Social login successful", hr });
  } catch (err) {
    console.error("Social login error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router; 
