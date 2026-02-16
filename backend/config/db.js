const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "hiring_system",
  password: "aloalo123",
  port: 5432,
});

module.exports = pool;
