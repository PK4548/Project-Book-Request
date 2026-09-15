const excelService = require('../services/excelService');
const libraryBookModel = require('../models/libraryBookModel');

exports.importLibraryBooks = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ status: 'error', message: 'Please upload an Excel file.' });
        }

        // โยนไฟล์ให้ Custom Parser ที่เราเขียนไว้จัดการ
        const books = excelService.parseLibraryExcel(req.file.buffer);
        
        if (books.length === 0) {
            return res.status(400).json({ status: 'error', message: 'No valid book data found in the Excel file.' });
        }

        let newBooks = 0;
        let updatedBooks = 0;
        let failedRows = 0;
        const errors = [];

        // ลูปประมวลผลทีละเล่ม (Upsert)
        for (let i = 0; i < books.length; i++) {
            const bookData = books[i];

            if (!bookData.title) {
                failedRows++;
                continue;
            }

            try {
                const existingId = await libraryBookModel.findBookForImport(bookData.isbn, bookData.title);

                if (existingId) {
                    await libraryBookModel.updateLibraryBook(existingId, bookData);
                    updatedBooks++;
                } else {
                    await libraryBookModel.addLibraryBook(bookData);
                    newBooks++;
                }
            } catch (dbError) {
                console.error(`Database error on book: ${bookData.title}`, dbError);
                failedRows++;
                errors.push(`Failed to process: ${bookData.title}`);
            }
        }

        res.status(200).json({
            status: 'success',
            message: 'Excel import completed.',
            summary: {
                total_valid_rows: books.length,
                new_books: newBooks,
                updated_books: updatedBooks,
                failed_rows: failedRows,
                errors: errors.length > 0 ? errors : undefined
            }
        });

    } catch (error) {
        console.error('Excel import error:', error);
        res.status(500).json({ status: 'error', message: 'Internal server error during import' });
    }
};