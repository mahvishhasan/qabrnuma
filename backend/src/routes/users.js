const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { getUsers, toggleUserActive, updateUserRole } = require('../controllers/userController');

router.get('/', authenticate, getUsers);

router.put(
  '/:id/toggle-active',
  authenticate,
  authorize('admin'),
  toggleUserActive
);

router.put(
  '/:id/role',
  authenticate,
  authorize('admin'),
  updateUserRole
);

module.exports = router;
