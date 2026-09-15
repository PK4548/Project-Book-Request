const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken } = require('../middleware/authMiddleware');
const { verifyAdmin } = require('../middleware/adminMiddleware');
// ... โค้ดด้านบน ...
const importController = require('../controllers/importController'); // นำเข้า
const upload = require('../middleware/uploadMiddleware'); // นำเข้า
// ...

// บังคับใช้ Middleware ทั้งสองตัวกับทุก Route ในไฟล์นี้
router.use(verifyToken, verifyAdmin);

router.post('/library-books/import', upload.single('file'), importController.importLibraryBooks);

// นิยาม API Endpoints
router.get('/dashboard', adminController.getDashboardStats);
router.get('/requests', adminController.getAllRequests);
router.get('/requests/:id', adminController.getRequestById);
router.put('/requests/:id/status', adminController.updateRequestStatus);

router.use((err, req, res, next) => {
    if (err) {
        res.status(400).json({ status: 'error', message: err.message });
    } else {
        next();
    }
});

module.exports = router;