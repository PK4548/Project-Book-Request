const libraryBookModel = require('../models/libraryBookModel');
const searchCacheModel = require('../models/searchCacheModel');
const aiService = require('./aiService'); 

exports.performSearch = async (searchParams) => {
    // 1. ค้นหาหนังสือที่มีอยู่ในห้องสมุด
    const libraryResults = await libraryBookModel.searchBooks(searchParams);

    // 2. ค้นหาหนังสือที่เกี่ยวข้องจากใน Cache ก่อน
    let externalResults = await searchCacheModel.searchCache(searchParams);
    let externalSource = 'cache';

    // 3. ถ้าใน Cache ยังไม่มีคำค้นหานี้ ให้เรียก AI ช่วยลิสต์หนังสือใหม่ที่เกี่ยวข้อง (แม้ในห้องสมุดจะเจอแล้วก็ตาม - แก้ข้อ 7 และ 9)
    if (!externalResults || externalResults.length === 0) {
        const aiResults = await aiService.recommendBooks(searchParams);
        
        if (aiResults && aiResults.length > 0) {
            externalResults = [];
            externalSource = 'ai_recommendation';
            const keywordToSave = searchParams.keyword || searchParams.title || searchParams.author || '';

            for (let book of aiResults) {
                const cacheId = await searchCacheModel.saveCache(book, keywordToSave);
                book.cache_id = cacheId;
                externalResults.push(book);
            }
        }
    }

    // กรองไม่ให้หนังสือที่ AI แนะนำ ซ้ำกับหนังสือที่มีอยู่แล้วในห้องสมุด
    const libTitles = new Set(libraryResults.map(b => (b.title || b.book_title || '').trim().toLowerCase()));
    const filteredExternal = (externalResults || []).filter(b => {
        const extTitle = (b.book_title || b.title || '').trim().toLowerCase();
        return !libTitles.has(extTitle);
    });

    const hasLibrary = libraryResults.length > 0;
    const hasExternal = filteredExternal.length > 0;

    return {
        source: hasLibrary && hasExternal ? 'both' : (hasLibrary ? 'library' : (hasExternal ? externalSource : 'none')),
        library_exists: hasLibrary,
        libraryBooks: libraryResults,     // รายการหนังสือที่มีในห้องสมุด
        externalBooks: filteredExternal,  // รายการหนังสือที่เกี่ยวข้องจาก AI / Cache
        books: hasLibrary ? libraryResults : filteredExternal // เผื่อโค้ดส่วนอื่นอ้างอิงคีย์เดิม
    };
};