const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');

// GET /api/books/search
router.get('/search', bookController.search);

module.exports = router;