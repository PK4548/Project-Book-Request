exports.verifyAdmin = (req, res, next) => {
    // ต้องเรียกใช้งานต่อจาก verifyToken เสมอ ทำให้ req.user มีค่า
    if (!req.user) {
        return res.status(401).json({ 
            status: 'error', 
            message: 'User not authenticated.' 
        });
    }

    if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ 
            status: 'error', 
            message: 'Access denied. Admin privileges required.' 
        });
    }

    next(); // ให้ไปทำงานในฟังก์ชันถัดไป (เช่น หน้าจัดการคำร้อง)
};