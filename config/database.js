const mysql = require('mysql2/promise');
require('dotenv').config();

// สร้าง Connection Pool แทนการสร้าง Connection ธรรมดา
// เพื่อให้จัดการคิวและประหยัดทรัพยากรเมื่อมีคนเข้าใช้งานพร้อมกัน
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10, // จำนวน Connection สูงสุดใน Pool
    queueLimit: 0
});

module.exports = pool;