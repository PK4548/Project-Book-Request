const db = require('../config/database');

exports.searchCache = async ({ keyword, title, author, isbn }) => {
    let sql = 'SELECT * FROM search_cache WHERE 1=1';
    const params = [];

    if (isbn) {
        sql += ' AND isbn = ?';
        params.push(isbn);
    }
    if (title) {
        sql += ' AND book_title LIKE ?';
        params.push(`%${title}%`);
    }
    if (author) {
        sql += ' AND author LIKE ?';
        params.push(`%${author}%`);
    }
    if (keyword) {
        sql += ' AND (keyword LIKE ? OR book_title LIKE ? OR author LIKE ?)';
        params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }

    const [rows] = await db.query(sql, params);
    return rows;
};

exports.saveCache = async (bookData, searchKeyword) => {
    const sql = `
        INSERT INTO search_cache 
        (keyword, book_title, author, publisher, isbn, publish_year, src_web, src_url) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    // บันทึกคำค้นหาหลักลงไปด้วย เพื่อให้การค้นหาครั้งหน้าแมตช์ได้ง่ายขึ้น
    const params = [
        searchKeyword || '',
        bookData.book_title,
        bookData.author,
        bookData.publisher,
        bookData.isbn,
        bookData.publish_year,
        bookData.src_web,
        bookData.src_url
    ];

    const [result] = await db.query(sql, params);
    // ส่งคืน ID ที่เพิ่งถูกสร้าง
    return result.insertId; 
};