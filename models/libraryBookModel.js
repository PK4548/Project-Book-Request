const db = require('../config/database');

exports.searchBooks = async ({ keyword, title, author, isbn }) => {
    let sql = 'SELECT * FROM library_book WHERE 1=1';
    const params = [];

    // ISBN ใช้การค้นหาแบบ Exact Match (ตรงกันเป๊ะ)
    if (isbn) {
        sql += ' AND isbn = ?';
        params.push(isbn);
    }
    // ตัวอื่นๆ ใช้แบบ Partial Match (มีคำนี้ผสมอยู่)
    if (title) {
        sql += ' AND title LIKE ?';
        params.push(`%${title}%`);
    }
    if (author) {
        sql += ' AND author LIKE ?';
        params.push(`%${author}%`);
    }
    // Keyword จะค้นหาครอบคลุมหลายฟิลด์
    if (keyword) {
        sql += ' AND (title LIKE ? OR author LIKE ? OR category LIKE ?)';
        params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }

    const [rows] = await db.query(sql, params);
    return rows;
};

// เพิ่มต่อจากโค้ดที่มีอยู่เดิม

exports.findBookForImport = async (isbn, title) => {
    let sql = 'SELECT library_book_id FROM library_book WHERE ';
    const params = [];

    // ถ้ามี ISBN ให้หาด้วย ISBN ก่อน ถ้าไม่มีให้หาจาก ชื่อหนังสือ (Title)
    if (isbn && isbn.trim() !== "") {
        sql += 'isbn = ?';
        params.push(isbn.trim());
    } else {
        sql += 'title = ?';
        params.push(title.trim());
    }
    
    sql += ' LIMIT 1';
    const [rows] = await db.query(sql, params);
    return rows.length > 0 ? rows[0].library_book_id : null;
};

exports.addLibraryBook = async (book) => {
    const sql = `
        INSERT INTO library_book (title, author, publisher, isbn, category, publish_year) 
        VALUES (?, ?, ?, ?, ?, ?)
    `;
    await db.query(sql, [book.title, book.author, book.publisher, book.isbn, book.category, book.publish_year]);
};

exports.updateLibraryBook = async (id, book) => {
    const sql = `
        UPDATE library_book 
        SET title = ?, author = ?, publisher = ?, isbn = ?, category = ?, publish_year = ? 
        WHERE library_book_id = ?
    `;
    await db.query(sql, [book.title, book.author, book.publisher, book.isbn, book.category, book.publish_year, id]);
};