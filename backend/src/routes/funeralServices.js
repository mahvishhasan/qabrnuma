const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  getServicesByCase,
  requestService,
  getUserServices,
  getMyAssignedServices,
  scheduleAndAssign,
  rejectService,
  updateServiceStatus
} = require('../controllers/funeralServiceController');

router.get('/', authenticate, getAllServices);

router.get('/my-requests', authenticate, getUserServices);

router.get('/my-assigned', authenticate, authorize('staff'), getMyAssignedServices);

router.get('/case/:caseId', authenticate, getServicesByCase);

router.post(
  '/request',
  authenticate,
  authorize('user'),
  requestService
);

router.get('/:id', authenticate, getServiceById);

router.post(
  '/',
  authenticate,
  authorize('admin', 'funeral_coordinator', 'staff'),
  createService
);

router.put(
  '/:id',
  authenticate,
  authorize('admin', 'staff', 'funeral_coordinator'),
  updateService
);

router.put(
  '/:id/schedule',
  authenticate,
  authorize('admin', 'funeral_coordinator'),
  scheduleAndAssign
);

router.put(
  '/:id/reject',
  authenticate,
  authorize('admin', 'funeral_coordinator'),
  rejectService
);

router.put(
  '/:id/status',
  authenticate,
  authorize('admin', 'staff', 'funeral_coordinator'),
  updateServiceStatus
);

module.exports = router;
