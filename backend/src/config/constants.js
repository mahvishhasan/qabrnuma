const ROLES = ['user', 'staff', 'funeral_coordinator', 'cemetery_manager', 'admin'];

const DEATH_CASE_STATUSES = ['pending', 'under_review', 'approved', 'allocated', 'completed'];

const GRAVE_STATUSES = ['available', 'reserved', 'occupied', 'maintenance'];

const RESERVATION_STATUSES = ['pending', 'approved', 'cancelled', 'expired'];

const SERVICE_TYPES = ['ghusl', 'kafan', 'janaza', 'transport', 'other'];

const SERVICE_STATUSES = ['pending', 'scheduled', 'in_progress', 'completed', 'cancelled'];

const STAFF_STATUS_TRANSITIONS = {
  scheduled: ['in_progress'],
  in_progress: ['completed']
};

const RESERVATION_EXPIRY_HOURS = parseInt(process.env.RESERVATION_EXPIRY_HOURS) || 48;

const JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';

const DEFAULT_ROLE = 'user';

module.exports = {
  ROLES,
  DEATH_CASE_STATUSES,
  GRAVE_STATUSES,
  RESERVATION_STATUSES,
  SERVICE_TYPES,
  SERVICE_STATUSES,
  STAFF_STATUS_TRANSITIONS,
  RESERVATION_EXPIRY_HOURS,
  JWT_EXPIRY,
  DEFAULT_ROLE
};
