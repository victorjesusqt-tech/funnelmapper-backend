const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : 'root',
  port: Number(process.env.DB_PORT) || 3306,
  database: process.env.DB_NAME || 'funnelmapper_db',
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 10,
  waitForConnections: true,
  queueLimit: 0,
  timezone: '+00:00',
  charset: 'utf8mb4'
});

module.exports = pool;
