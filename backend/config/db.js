const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

const pool = mysql.createPool({
  host:     process.env.DB_HOST,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port:     3306,
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  ssl: { rejectUnauthorized: false },
});

const connectDB = async () => {
  try {
    console.log(process.env.DB_HOST);
    const conn = await pool.getConnection();
    console.log(`MySQL RDS Connected: ${process.env.DB_HOST}`);
    conn.release();
  } catch (error) {
    console.error(`DB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = { connectDB, pool };
