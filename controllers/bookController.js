const searchService = require('../services/searchService');

exports.search = async (req, res) => {
    try {
        const { keyword, title, author, isbn } = req.query;

        // ตรวจสอบ Input Validation เบื้องต้น
        if (!keyword && !title && !author && !isbn) {
            return res.status(400).json({
                status: 'error',
                message: 'Please provide at least one search parameter (keyword, title, author, isbn)'
            });
        }

        // โยน Parameter ไปให้ Service จัดการตาม Logic 3 ระดับ
        const result = await searchService.performSearch({
            keyword: keyword?.trim(),
            title: title?.trim(),
            author: author?.trim(),
            isbn: isbn?.trim()
        });

        res.status(200).json({
            status: 'success',
            data: result
        });

    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error while searching'
        });
    }
};