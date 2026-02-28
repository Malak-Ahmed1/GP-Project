<<<<<<< HEAD
// db.js
const { Pool } = require("pg");
=======
const { Pool } = require("pg");
require("dotenv").config();
>>>>>>> origin/Combined_with_whisper

// Create a new connection pool
const pool = new Pool({
<<<<<<< HEAD
  user: "postgres",                 // PostgreSQL username
  host: "localhost",                // PostgreSQL host
  database: "cv_ranking_db",        // your database name
  password: "Malak#pg1", // your password
  port: 5432,                       // default PostgreSQL port
});

// Test the connection
pool.connect((err, client, release) => {
  if (err) {
    return console.error("Error acquiring client", err.stack);
  }
  console.log("PostgreSQL connected successfully ✅");
  release();
=======
  user: "postgres",
  host: "localhost",
  database: "hiring_system",
  password: "aloalo123",
  port: 5432,
>>>>>>> origin/Combined_with_whisper
});

module.exports = pool;
