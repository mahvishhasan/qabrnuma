const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { getActivityLogs } = require('../controllers/activityLogController');

router.get('/', authenticate, authorize('admin'), getActivityLogs);

module.exports = router;
