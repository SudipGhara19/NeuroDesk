const express = require('express');
const router = express.Router();
const { verifyToken, restrictTo } = require('../middlewares/auth.middleware');
const { getSystemAnalytics, analyzeSystemHealth } = require('../controllers/analytics.controller');

// Admin and Manager can view system analytics
router.get('/system', verifyToken, restrictTo('Admin', 'Manager'), getSystemAnalytics);

// Admin and Manager can trigger an AI-generated health report
router.post('/system/analyze', verifyToken, restrictTo('Admin', 'Manager'), analyzeSystemHealth);

module.exports = router;
