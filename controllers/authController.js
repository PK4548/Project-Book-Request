const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. ตรวจสอบว่ามีการส่งข้อมูลมาครบหรือไม่
        if (!email || !password) {
            return res.status(400).json({ 
                status: 'error', 
                message: 'Please provide both email and password' 
            });
        }

        // 2. ค้นหาผู้ใช้จากอีเมลในฐานข้อมูล
        const [users] = await db.query('SELECT * FROM user WHERE email = ?', [email]);
        
        // 3. ตรวจสอบว่าพบอีเมลนี้หรือไม่
        if (users.length === 0) {
            return res.status(401).json({ 
                status: 'error', 
                message: 'Invalid email or password' 
            });
        }

        const user = users[0];

        // 4. ตรวจสอบรหัสผ่านว่าตรงกับ Hash ในระบบหรือไม่
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(401).json({ 
                status: 'error', 
                message: 'Invalid email or password' 
            });
        }

        // 5. สร้าง JWT Token โดยเก็บ user_id และ role ไว้ใน Token
        const token = jwt.sign(
            { id: user.user_id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        // 6. ส่งผลลัพธ์กลับไป (ไม่ส่ง password กลับไปเด็ดขาด)
        res.status(200).json({
            status: 'success',
            message: 'Login successful',
            token: token,
            user: {
                user_id: user.user_id,
                full_name: user.full_name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            status: 'error', 
            message: 'Internal server error' 
        });
    }
};