// MOCK CRAWLER SERVICE
// ตอนนี้เป็นการดึงข้อมูลแบบจำลองไปก่อน ห้ามแสร้งทำว่าเป็นการดึงข้อมูลจริง
exports.scrapeBooks = async (searchParams) => {
    // สมมติว่าระบบใช้เวลา 1 วินาทีในการดึงข้อมูลจากเว็บ
    await new Promise(resolve => setTimeout(resolve, 1000));

    const keyword = searchParams.keyword || searchParams.title || searchParams.isbn || 'Unknown';

    // คืนค่าข้อมูลที่ถูกจัดรูปแบบแล้ว (Normalized Data)
    return [
        {
            book_title: `ผลการค้นหาจากภายนอกสำหรับ: ${keyword}`,
            author: "John Doe (Mock Author)",
            publisher: "Mock Publisher",
            isbn: searchParams.isbn || "978-0000000000",
            publish_year: "2024",
            src_web: "MockBookStore.com",
            src_url: `http://mockbookstore.com/search?q=${encodeURIComponent(keyword)}`
        }
    ];
};