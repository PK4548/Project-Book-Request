const db = require('../config/database');

// 1. ดึงข้อมูลคำร้องทั้งหมด (รองรับการกรองด้วย Status)
exports.getAllRequests = async (statusFilter) => {
    let sql = `
        SELECT 
            br.request_id,
            br.request_date,
            br.status,
            br.reason,
            u.full_name AS requester_name,
            u.email AS requester_email,
            sc.book_title,
            sc.author,
            sc.isbn
        FROM book_request br
        JOIN user u ON br.user_id = u.user_id
        LEFT JOIN search_cache sc ON br.cache_id = sc.cache_id
        WHERE 1=1
    `;
    const params = [];

    if (statusFilter) {
        sql += ` AND br.status = ?`;
        params.push(statusFilter);
    }

    sql += ` ORDER BY br.request_date DESC`;
    
    const [rows] = await db.query(sql, params);
    return rows;
};

// 2. ดึงรายละเอียดคำร้องแบบเจาะจง 1 รายการ
exports.getRequestById = async (requestId) => {
    const sql = `
        SELECT 
            br.*,
            u.full_name AS requester_name,
            u.email AS requester_email,
            sc.book_title,
            sc.author,
            sc.publisher,
            sc.isbn,
            sc.publish_year,
            sc.src_web,
            sc.src_url
        FROM book_request br
        JOIN user u ON br.user_id = u.user_id
        LEFT JOIN search_cache sc ON br.cache_id = sc.cache_id
        WHERE br.request_id = ?
    `;
    const [rows] = await db.query(sql, [requestId]);
    return rows[0]; // คืนค่าเป็น Object เดียว
};

// 3. อัปเดตสถานะและเพิ่ม Admin Note
exports.updateRequestStatus = async (requestId, status, adminNote) => {
    // เพิ่ม admin_note เข้าไปในคำสั่งอัปเดต
    const sql = `
        UPDATE book_request 
        SET status = ?, admin_note = ?, updated_at = NOW() 
        WHERE request_id = ?
    `;
    
    // adminNote ถ้าไม่มีค่า (กรณีอนุมัติ) ให้เป็น null
    const [result] = await db.execute(sql, [status, adminNote || null, requestId]);
    return result;
};

// 4. สถิติสำหรับ Dashboard
exports.getDashboardStats = async () => {
    const sql = `
        SELECT 
            COUNT(*) AS total_requests,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
            SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) AS approved,
            SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) AS rejected,
            SUM(CASE WHEN status = 'ordering' THEN 1 ELSE 0 END) AS ordering,
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed
        FROM book_request
    `;
    const [rows] = await db.query(sql);
    
    // ป้องกันค่า null กรณีที่ยังไม่มีข้อมูลในตารางเลย ให้แปลงเป็น 0
    const stats = rows[0];
    return {
        total_requests: Number(stats.total_requests) || 0,
        pending: Number(stats.pending) || 0,
        approved: Number(stats.approved) || 0,
        rejected: Number(stats.rejected) || 0,
        ordering: Number(stats.ordering) || 0,
        completed: Number(stats.completed) || 0
    };
};