const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { writeLimiter } = require('../middleware/rateLimiter');
const {
  createCase,
  getAllCases,
  getCaseById,
  updateCaseStatus,
  getUserCases
} = require('../controllers/deathCaseController');

router.get('/my-cases', authenticate, getUserCases);

router.post('/', authenticate, writeLimiter, createCase);

router.get('/', authenticate, getAllCases);

router.get('/:id', authenticate, getCaseById);

router.put(
  '/:id/status',
  authenticate,
  authorize('admin', 'staff', 'cemetery_manager'),
  updateCaseStatus
);

module.exports = router;
