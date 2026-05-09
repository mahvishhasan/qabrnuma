const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { getReportSummary } = require('../controllers/reportController');

router.get('/summary', authenticate, authorize('admin'), getReportSummary);

module.exports = router;
