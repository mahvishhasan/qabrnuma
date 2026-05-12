const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { writeLimiter } = require('../middleware/rateLimiter');
const {
  createReservation,
  getUserReservations,
  getReservationById,
  cancelReservation,
  approveReservation,
  linkReservationToCase,
  createFamilyPlotGroup,
  requestAdjacentPlot
} = require('../controllers/reservationController');

router.get('/', authenticate, getUserReservations);

router.post('/', authenticate, writeLimiter, createReservation);

router.post('/family-plot', authenticate, createFamilyPlotGroup);

router.post('/adjacent-plot', authenticate, requestAdjacentPlot);

router.get('/:id', authenticate, getReservationById);

router.delete('/:id', authenticate, cancelReservation);

router.put(
  '/:id/approve',
  authenticate,
  authorize('admin', 'cemetery_manager'),
  approveReservation
);

router.put(
  '/:id/link-case',
  authenticate,
  authorize('admin', 'staff', 'cemetery_manager'),
  linkReservationToCase
);

module.exports = router;
