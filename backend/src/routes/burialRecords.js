const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  createBurialRecord,
  getAllBurialRecords,
  getBurialRecordById,
  getBurialRecordByCaseId,
  updateBurialRecord,
  getFamilyBurialHistory
} = require('../controllers/burialRecordController');

router.get('/family-history', authenticate, getFamilyBurialHistory);

router.get('/', authenticate, getAllBurialRecords);

router.post(
  '/',
  authenticate,
  authorize('admin', 'staff', 'cemetery_manager'),
  createBurialRecord
);

router.get('/:id', authenticate, getBurialRecordById);

router.get('/case/:caseId', authenticate, getBurialRecordByCaseId);

router.put(
  '/:id',
  authenticate,
  authorize('admin', 'cemetery_manager'),
  updateBurialRecord
);

module.exports = router;
