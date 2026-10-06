const libraryBookModel = require('../models/libraryBookModel');
const searchCacheModel = require('../models/searchCacheModel');
const aiService = require('./aiService'); 

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

    // 3. LEVEL 3: ให้ AI ค้นหาและแนะนำหนังสือจากภายนอก (ผ่าน dotBlue API)
    const aiResults = await aiService.recommendBooks(searchParams);
    
    if (aiResults && aiResults.length > 0) {
        const finalResults = [];
        const keywordToSave = searchParams.keyword || searchParams.title || searchParams.author || '';

        // วนลูปบันทึกข้อมูลที่ AI หามาได้ลงแคชและส่งออกแสดงผลหน้าเว็บทันที
        for (let book of aiResults) {
            const cacheId = await searchCacheModel.saveCache(book, keywordToSave);
            book.cache_id = cacheId;
            finalResults.push(book);
        }

        return {
            source: 'ai_recommendation',
            library_exists: false,
            books: finalResults
        };
    }

    return { source: 'none', library_exists: false, books: [] };
};