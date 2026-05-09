const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { getSettings, updateSettings } = require('../controllers/settingsController');

router.get('/', authenticate, authorize('admin'), getSettings);
router.put('/', authenticate, authorize('admin'), updateSettings);

module.exports = router;
