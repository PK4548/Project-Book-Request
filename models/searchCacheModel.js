const db = require('../config/database');

exports.searchCache = async ({ keyword, title, author, isbn }) => {
    // 1. ดึงข้อมูล พร้อมดึงสถานะคำร้องล่าสุดติดมาด้วย (แก้ข้อ 6)
    // 2. ดึงเฉพาะข้อมูลที่อายุไม่เกิน 1 ปี (แก้ข้อ 1, 2)
    let sql = `
        SELECT sc.*, 
            (SELECT status 
             FROM book_request br 
             WHERE br.cache_id = sc.cache_id 
             ORDER BY FIELD(status, 'completed', 'ordering', 'approved', 'pending', 'rejected') LIMIT 1
            ) AS request_status
        FROM search_cache sc
        WHERE sc.created_at >= DATE_SUB(NOW(), INTERVAL 1 YEAR)
    `;
    const params = [];

    if (isbn) {
        sql += ' AND sc.isbn = ?';
        params.push(isbn);
    }
    if (title) {
        sql += ' AND sc.book_title LIKE ?';
        params.push(`%${title}%`);
    }
    if (author) {
        sql += ' AND sc.author LIKE ?';
        params.push(`%${author}%`);
    }

    const keywords = keyword ? keyword.trim().split(/\s+/).filter(Boolean) : [];
    if (keywords.length > 0) {
        const kwClauses = keywords.map(() => '(sc.keyword LIKE ? OR sc.book_title LIKE ? OR sc.author LIKE ?)');
        sql += ` AND (${kwClauses.join(' AND ')})`;
        keywords.forEach(kw => {
            params.push(`%${kw}%`, `%${kw}%`, `%${kw}%`);
        });
    }

    const [rows] = await db.query(sql, params);
    // เรียงลำดับตามปีที่พิมพ์ใหม่สุดขึ้นก่อน
    rows.sort((a, b) => (parseInt(b.publish_year) || 0) - (parseInt(a.publish_year) || 0));
    return rows;
};

exports.saveCache = async (bookData, searchKeyword) => {
    const [existing] = await db.query(
        'SELECT cache_id FROM search_cache WHERE book_title = ? LIMIT 1',
        [bookData.book_title || '']
    );

    if (existing.length > 0) {
        // หากเคยแคชไว้แล้ว ให้อัปเดตเวลาเป็นปัจจุบันเพื่อต่ออายุ (แก้ข้อ 2)
        await db.query(
            'UPDATE search_cache SET created_at = NOW(), keyword = ? WHERE cache_id = ?', 
            [searchKeyword || '', existing[0].cache_id]
        );
        return existing[0].cache_id;
    }

    const sql = `
        INSERT INTO search_cache 
        (keyword, book_title, author, publisher, isbn, publish_year, src_web, src_url) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
        searchKeyword || '',
        bookData.book_title || 'ไม่ระบุชื่อเรื่อง',
        bookData.author || 'ไม่ระบุผู้แต่ง',
        bookData.publisher || '-',
        bookData.isbn || '-',
        bookData.publish_year || '-',
        bookData.src_web || 'PSU dotBlue AI',
        bookData.src_url || ''
    ];

    const [result] = await db.query(sql, params);
    return result.insertId; 
};

// ฟังก์ชันสำหรับรัน Cronjob เพื่อล้างข้อมูลขยะที่เกิน 1 ปีและไม่มีใครกดขอ (แก้ข้อ 2)
exports.cleanupOldCache = async () => {
    const sql = `
        DELETE FROM search_cache 
        WHERE created_at < DATE_SUB(NOW(), INTERVAL 1 YEAR)
        AND cache_id NOT IN (SELECT DISTINCT cache_id FROM book_request WHERE cache_id IS NOT NULL)
    `;
    const [result] = await db.query(sql);
    return result.affectedRows;
};