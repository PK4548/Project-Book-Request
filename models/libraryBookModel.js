const db = require('../config/database');

exports.searchBooks = async ({ keyword, title, author, isbn }) => {
    let sql = 'SELECT * FROM library_book WHERE 1=1';
    const params = [];

    if (isbn) {
        sql += ' AND isbn = ?';
        params.push(isbn);
    }
    if (title) {
        sql += ' AND title LIKE ?';
        params.push(`%${title}%`);
    }
    if (author) {
        sql += ' AND author LIKE ?';
        params.push(`%${author}%`);
    }

    // หั่นคำด้วยช่องว่าง แล้วใช้ AND เชื่อม (ต้องมีครบทุกคำที่พิมพ์ ถึงจะแสดงผล)
    if (keyword) {
        const keywords = keyword.trim().split(/\s+/).filter(Boolean);
        keywords.forEach(kw => {
            sql += ' AND (title LIKE ? OR author LIKE ? OR category LIKE ?)';
            // ใส่พารามิเตอร์ 3 ตัว สำหรับ title, author, category
            params.push(`%${kw}%`, `%${kw}%`, `%${kw}%`);
        });
    }

    sql += ' ORDER BY publish_year DESC, title ASC';

    const [rows] = await db.query(sql, params);
    return rows;
};

exports.findBookForImport = async (isbn, title) => {
    let sql = 'SELECT library_book_id FROM library_book WHERE ';
    const params = [];

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