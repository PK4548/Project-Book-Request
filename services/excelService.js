const xlsx = require('xlsx');

exports.parseLibraryExcel = (fileBuffer) => {
    const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // อ่านข้อมูลมาเป็น Array ซ้อน Array (เพื่อให้จัดการง่าย ไม่ยึดติดกับหัวคอลัมน์)
    const rawData = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: "" });
    const books = [];
    let startParsing = false;

    for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i];

        // 1. หาจุดเริ่มต้นของข้อมูล (เช็คว่าแถวนี้มีคำว่า TITLE หรือไม่)
        if (!startParsing && row.includes('TITLE')) {
            startParsing = true;
            continue; // ข้ามบรรทัดหัวตารางนี้ไป
        }

        if (startParsing) {
            // อิงจากโครงสร้างไฟล์ของคุณ: Index 4 = PUB_YEAR, Index 6 = TITLE
            const rawTitleStr = row[6] ? String(row[6]).trim() : "";
            const pubYear = row[4] ? String(row[4]).trim() : "";

            // 2. ข้ามแถวที่ว่างเปล่า (บรรทัดเว้นบรรทัด)
            if (rawTitleStr === "") continue;

            // 3. แยกชื่อเรื่องและผู้แต่งด้วย " / "
            let title = rawTitleStr;
            let author = "";
            
            if (rawTitleStr.includes(' / ')) {
                const parts = rawTitleStr.split(' / ');
                title = parts[0].trim();
                author = parts.slice(1).join(' / ').trim(); // เผื่อผู้แต่งมีเครื่องหมาย / ด้วย
            }

            // 4. จัดรูปแบบข้อมูลให้ตรงกับ Database
            books.push({
                title: title,
                author: author,
                publisher: "", // ไม่มีในไฟล์
                isbn: "",      // ไม่มีในไฟล์
                category: "",  // ไม่มีในไฟล์
                publish_year: pubYear
            });
        }
    }

    return books;
};