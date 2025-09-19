const express = require('express');
const router = express.Router();
const { authenticateAdmin } = require('../middlewares/authMiddleware');
const analytics = require('../controllers/analyticsController');

router.get('/summary', authenticateAdmin, analytics.summary);

module.exports = router;


