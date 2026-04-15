const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'RestaurantDB',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: process.env.DB_HOST && process.env.DB_HOST !== 'localhost' ? {
    rejectUnauthorized: false
  } : false
});

// Immediate test connection to log errors clearly in Render
pool.getConnection()
  .then(conn => {
    console.log('✅ Connected to MySQL Database!');
    conn.release();
  })
  .catch(err => {
    console.error('❌ DATABASE CONNECTION ERROR:', err.message);
  });

module.exports = pool;
