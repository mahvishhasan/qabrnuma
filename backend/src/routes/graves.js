const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  getAvailablePlots,
  getGraveById,
  createGrave,
  updateGraveStatus,
  getGravesBySection
} = require('../controllers/graveController');

router.get('/', authenticate, getAvailablePlots);

router.get('/section/:sectionId', authenticate, getGravesBySection);

router.get('/:id', authenticate, getGraveById);

router.post(
  '/',
  authenticate,
  authorize('admin', 'cemetery_manager'),
  createGrave
);

router.put(
  '/:id/status',
  authenticate,
  authorize('admin', 'cemetery_manager', 'staff'),
  updateGraveStatus
);

module.exports = router;
