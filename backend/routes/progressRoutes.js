const express = require('express');
const router = express.Router();
const { getStats } = require('../controllers/progressController');

// All routes require authentication
const { protect } = require('../middleware/auth');

router.get('/stats', protect, getStats);

module.exports = router;
