// db.js
const { Pool } = require("pg");

// Create a new connection pool
const pool = new Pool({
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
});

module.exports = pool;
