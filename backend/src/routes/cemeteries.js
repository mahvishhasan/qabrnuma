const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  getAllCemeteries,
  getCemeteryById,
  createCemetery,
  updateCemetery,
  createSection,
  getSectionsByCemetery
} = require('../controllers/cemeteryController');

router.get('/', authenticate, getAllCemeteries);

router.get('/:id', authenticate, getCemeteryById);

router.post(
  '/',
  authenticate,
  authorize('admin', 'cemetery_manager'),
  createCemetery
);

router.put(
  '/:id',
  authenticate,
  authorize('admin', 'cemetery_manager'),
  updateCemetery
);

router.get('/:id/sections', authenticate, getSectionsByCemetery);

router.post(
  '/:id/sections',
  authenticate,
  authorize('admin', 'cemetery_manager'),
  createSection
);

module.exports = router;
