const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// กำหนด Route สำหรับ Login (POST /api/auth/login)
router.post('/login', authController.login);

module.exports = router;