const XLSX = require('xlsx');
const db = require('../config/database');
const fs = require('fs');

exports.importLibraryBooks = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ status: 'error', message: 'กรุณาอัปโหลดไฟล์ Excel' });
        }

        // 1. อ่านไฟล์ Excel (ข้าม 6 แถวแรกที่เป็นส่วนหัวรายงานของระบบห้องสมุด)
        const workbook = XLSX.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { range: 6 });

        let successCount = 0;

        // 2. วนลูปบันทึกข้อมูลลงฐานข้อมูล
        for (let row of sheetData) {
            const bib_no = row.BIB_NO || row.bib_no;
            const book_title = row.TITLE || row.title || 'ไม่ระบุชื่อหนังสือ';
            const author = row.CREATOR || row.creator || 'ไม่ระบุผู้แต่ง';
            const publish_year = row.PUB_YEAR || row.pub_year || '-';

            if (bib_no) {
                // 3. ใช้ BIB_NO เป็นรหัสหลักเช็คซ้ำ (Upsert)
                // ถ้ามี BIB_NO นี้อยู่แล้วจะทำการอัปเดต ถ้ายังไม่มีจะเพิ่มใหม่ทันที
                const query = `
                    INSERT INTO library_book (isbn, book_title, author, publisher, publish_year) 
                    VALUES (?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE 
                    book_title = VALUES(book_title),
                    author = VALUES(author),
                    publish_year = VALUES(publish_year)
                `;
                await db.query(query, [String(bib_no), String(book_title), String(author), '-', String(publish_year)]);
                successCount++;
            }
        }

        // ลบไฟล์ชั่วคราวหลังประมวลผลเสร็จ
        fs.unlinkSync(req.file.path);

        res.status(200).json({ 
            status: 'success', 
            message: `นำเข้าและอัปเดตข้อมูลสำเร็จจำนวน ${successCount} รายการ` 
        });

    } catch (error) {
        console.error("Import Error:", error);
        res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาดในการประมวลผลไฟล์ Excel' });
    }
};