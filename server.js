require('dotenv').config();
const express = require('express');
const db = require('./config/database');

// นำเข้า Routes และ Middleware
const authRoutes = require('./routes/authRoutes');
const bookRoutes = require('./routes/bookRoutes');
const requestRoutes = require('./routes/requestRoutes');
const adminRoutes = require('./routes/adminRoutes');  
const { verifyToken } = require('./middleware/authMiddleware');
const { verifyAdmin } = require('./middleware/adminMiddleware');


const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const path = require('path');
// ตั้งค่าให้ Express ให้บริการไฟล์ Static (HTML, CSS, JS) จากโฟลเดอร์ views
app.use(express.static(path.join(__dirname, 'views')));
app.use('/js', express.static(path.join(__dirname, 'public/js')));

// ==========================================
// API Routes
// ==========================================
app.use('/api/auth', authRoutes);
app.use('/api/books', verifyToken, bookRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/admin', adminRoutes);
                                                                                                                                 
// ==========================================
// Test Routes (สำหรับทดสอบ Middleware)
// ==========================================
// ทดสอบสิทธิ์ USER ทั่วไป (ต้องใส่ Token)
app.get('/api/test/user', verifyToken, (req, res) => {
    res.json({ message: 'User access granted', user: req.user });
});

// ทดสอบสิทธิ์ ADMIN (ต้องใส่ Token และ role ต้องเป็น ADMIN)
app.get('/api/test/admin', verifyToken, verifyAdmin, (req, res) => {
    res.json({ message: 'Admin access granted', user: req.user });
});

// ==========================================
// Test Database Route 
// ==========================================
app.get('/test-db', async (req, res) => {
    try {
        // ใช้ await เพื่อรอรับค่าแบบ Promise (คืนค่าเป็น array โดย index แรกคือผลลัพธ์)
        const [results] = await db.query('SELECT 1 + 1 AS solution');
        
        res.json({ 
            message: 'Database connected successfully!', 
            result: results 
        });
    } catch (error) {
        // หากเกิด Error จะวิ่งเข้ามาที่ catch ทันที
        console.error('Database connection failed:', error);
        res.status(500).send(`Database connection failed: ${error.message}`);
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});