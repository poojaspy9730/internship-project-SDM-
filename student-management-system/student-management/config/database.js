// config/database.js
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'student_management',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+05:30',
  charset: 'utf8mb4'
});

// Test connection on startup
const testConnection = async () => {
  try {
    const conn = await pool.getConnection();
    console.log('✅ MySQL Database connected successfully');
    conn.release();
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    console.error('👉 Make sure MySQL is running and credentials in .env are correct');
  }
};

testConnection();

module.exports = pool;
