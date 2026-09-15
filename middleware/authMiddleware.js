const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {
    // รับ Token จาก Header ที่ชื่อว่า Authorization
    const bearerHeader = req.headers['authorization'];
    
    if (!bearerHeader) {
        return res.status(401).json({ 
            status: 'error', 
            message: 'Access denied. No token provided.' 
        });
    }

    // รูปแบบของ Header คือ "Bearer <token>"
    const token = bearerHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ 
            status: 'error', 
            message: 'Access denied. Token missing.' 
        });
    }

    try {
        // ถอดรหัส Token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // นำข้อมูล user_id และ role แนบไปกับ request
        next(); // ให้ไปทำงานในฟังก์ชันถัดไป
    } catch (error) {
        return res.status(403).json({ 
            status: 'error', 
            message: 'Invalid or expired token.' 
        });
    }
};