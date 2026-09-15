const libraryBookModel = require('../models/libraryBookModel');
const searchCacheModel = require('../models/searchCacheModel');
const crawlerService = require('./crawlerService');

exports.performSearch = async (searchParams) => {
    // 1. LEVEL 1: ค้นหาในห้องสมุดด้วย Input ของผู้ใช้
    const libraryResults = await libraryBookModel.searchBooks(searchParams);
    if (libraryResults.length > 0) {
        return { source: 'library', library_exists: true, books: libraryResults };
    }

    // 2. LEVEL 2: ค้นหาในแคช
    const cacheResults = await searchCacheModel.searchCache(searchParams);
    if (cacheResults.length > 0) {
        return { source: 'cache', library_exists: false, books: cacheResults };
    }

    // 3. LEVEL 3: ดึงข้อมูลจากภายนอก
    const externalResults = await crawlerService.scrapeBooks(searchParams);
    
    if (externalResults.length > 0) {
        const finalResults = [];
        const keywordToSave = searchParams.keyword || searchParams.title || searchParams.isbn || '';

        // ลูปเช็คหนังสือที่ได้จากเว็บทีละเล่ม (Double Check Logic)
        for (let book of externalResults) {
            
            // นำ "ชื่อหนังสือ" ที่ได้จากเว็บ ไปเช็คในตารางห้องสมุดอีกรอบ (ป้องกันกรณีเด็กหาด้วย ISBN แล้วหลุดมา)
            // ใช้ substring ตัดมาเช็คแค่ 10-15 ตัวอักษรแรก เพื่อป้องกันชื่อเว็บ 길เกินไปจนไม่แมตช์
            const shortTitle = book.book_title.substring(0, 15); 
            const doubleCheck = await libraryBookModel.searchBooks({ title: shortTitle });

            if (doubleCheck.length > 0) {
                // ถ้ามีในห้องสมุดแล้ว ให้สลับ Source คืนเป็น library และจบการทำงาน
                return {
                    source: 'library',
                    library_exists: true,
                    books: doubleCheck // แสดงข้อมูลของห้องสมุดแทน
                };
            }

            // ถ้าผ่านด่านเช็คแล้วแปลว่าไม่มีในห้องสมุดจริงๆ ให้เซฟลงแคช
            const cacheId = await searchCacheModel.saveCache(book, keywordToSave);
            book.cache_id = cacheId;
            finalResults.push(book);
        }

        return {
            source: 'external',
            library_exists: false,
            books: finalResults
        };
    }

    return { source: 'none', library_exists: false, books: [] };
};