const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');
const { verifyToken } = require('../middleware/authMiddleware');

// บังคับให้ทุก Endpoint ในนี้ต้องใช้ Token (verifyToken)
router.post('/', verifyToken, requestController.createRequest);
router.get('/my', verifyToken, requestController.getMyRequests);
router.get('/check-history/:cacheId', requestController.checkHistory);

module.exports = router;