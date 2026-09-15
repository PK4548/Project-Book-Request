const db = require('../config/database');

// ตรวจสอบว่า cache_id ที่ส่งมามีอยู่ในระบบหรือไม่ ป้องกัน Invalid Request
exports.checkCacheExists = async (cacheId) => {
    const [rows] = await db.query('SELECT cache_id FROM search_cache WHERE cache_id = ?', [cacheId]);
    return rows.length > 0;
};

// บันทึกคำร้องขอหนังสือลงฐานข้อมูล
exports.createRequest = async (userId, cacheId, reason) => {
    const sql = `
        INSERT INTO book_request (user_id, cache_id, reason, status)
        VALUES (?, ?, ?, 'pending')
    `;
    const [result] = await db.query(sql, [userId, cacheId, reason]);
    return result.insertId;
};

// ดึงประวัติคำร้องเฉพาะของ User คนนั้นๆ พร้อม JOIN ข้อมูลหนังสือจากแคช
exports.getMyRequests = async (userId) => {
    const sql = `
        SELECT 
            br.request_id,
            br.reason,
            br.request_date,
            br.status,
            br.admin_note,
            br.updated_at,
            sc.book_title,
            sc.author,
            sc.isbn,
            sc.src_web
        FROM book_request br
        JOIN search_cache sc ON br.cache_id = sc.cache_id
        WHERE br.user_id = ?
        ORDER BY br.request_date DESC
    `;
    const [rows] = await db.query(sql, [userId]);
    return rows;
};