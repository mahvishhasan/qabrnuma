const { query } = require('../config/db');
const { SERVICE_TYPES, SERVICE_STATUSES, STAFF_STATUS_TRANSITIONS } = require('../config/constants');

const getAllServices = async (req, res) => {
  try {
    const { service_type, status, search, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    const params = [];
    let whereClause = '';
    let paramIndex = 1;

    if (service_type) {
      whereClause = `WHERE fs.service_type = $${paramIndex}`;
      params.push(service_type);
      paramIndex++;
    }

    if (status) {
      whereClause += whereClause ? ' AND ' : 'WHERE ';
      whereClause += `fs.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (search) {
      whereClause += whereClause ? ' AND ' : 'WHERE ';
      whereClause += `(dc.registration_number ILIKE $${paramIndex} OR dc.deceased_name ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    const countResult = await query(
      `SELECT COUNT(*) FROM funeral_services fs
       LEFT JOIN death_cases dc ON fs.case_id = dc.case_id
       ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    params.push(limit, offset);
    const result = await query(
      `SELECT fs.*, dc.registration_number, dc.deceased_name,
              u.full_name as assigned_staff_name
       FROM funeral_services fs
       LEFT JOIN death_cases dc ON fs.case_id = dc.case_id
       LEFT JOIN users u ON fs.assigned_staff_id = u.user_id
       ${whereClause}
       ORDER BY fs.scheduled_datetime DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );

    res.json({
      services: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get all services error:', error);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
};

const getServiceById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT fs.*, dc.registration_number, dc.deceased_name,
              u.full_name as assigned_staff_name
       FROM funeral_services fs
       LEFT JOIN death_cases dc ON fs.case_id = dc.case_id
       LEFT JOIN users u ON fs.assigned_staff_id = u.user_id
       WHERE fs.service_id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }

    res.json({ service: result.rows[0] });
  } catch (error) {
    console.error('Get service by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch service' });
  }
};

const createService = async (req, res) => {
  try {
    const { case_id, service_type, scheduled_datetime, assigned_staff_id, location, notes } = req.body;

    if (!case_id || !service_type) {
      return res.status(400).json({ error: 'case_id and service_type are required' });
    }

    if (!SERVICE_TYPES.includes(service_type.toLowerCase())) {
      return res.status(400).json({ error: 'Invalid service type' });
    }

    const caseResult = await query(
      'SELECT * FROM death_cases WHERE case_id = $1',
      [case_id]
    );

    if (caseResult.rows.length === 0) {
      return res.status(404).json({ error: 'Death case not found' });
    }

    const result = await query(
      `INSERT INTO funeral_services (case_id, service_type, scheduled_datetime, assigned_staff_id, location, notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'scheduled')
       RETURNING *`,
      [case_id, service_type.toLowerCase(), scheduled_datetime, assigned_staff_id, location, notes]
    );

    res.status(201).json({
      message: 'Service scheduled successfully',
      service: result.rows[0]
    });
  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({ error: 'Failed to create service' });
  }
};

const updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const { service_type, scheduled_datetime, assigned_staff_id, location, status, notes } = req.body;

    const existingResult = await query(
      'SELECT * FROM funeral_services WHERE service_id = $1',
      [id]
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }

    if (status) {
      const updateValidStatuses = ['scheduled', 'in_progress', 'completed'];
      if (!updateValidStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
    }

    const completedAt = status === 'completed' ? new Date() : existingResult.rows[0].completed_at;

    const result = await query(
      `UPDATE funeral_services SET
        service_type = COALESCE($1, service_type),
        scheduled_datetime = COALESCE($2, scheduled_datetime),
        assigned_staff_id = $3,
        location = COALESCE($4, location),
        status = COALESCE($5, status),
        notes = COALESCE($6, notes),
        completed_at = $7
       WHERE service_id = $8
       RETURNING *`,
      [service_type, scheduled_datetime, assigned_staff_id, location, status, notes, completedAt, id]
    );

    res.json({
      message: 'Service updated successfully',
      service: result.rows[0]
    });
  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({ error: 'Failed to update service' });
  }
};

const getServicesByCase = async (req, res) => {
  try {
    const { caseId } = req.params;

    const result = await query(
      `SELECT fs.*, u.full_name as assigned_staff_name
       FROM funeral_services fs
       LEFT JOIN users u ON fs.assigned_staff_id = u.user_id
       WHERE fs.case_id = $1
       ORDER BY fs.scheduled_datetime`,
      [caseId]
    );

    res.json({ services: result.rows });
  } catch (error) {
    console.error('Get services by case error:', error);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
};

const requestService = async (req, res) => {
  try {
    const { service_type, case_id, preferred_datetime, notes, price } = req.body;
    const userId = req.user.user_id;

    if (!service_type || !case_id) {
      return res.status(400).json({ error: 'service_type and case_id are required' });
    }

    const caseResult = await query(
      'SELECT * FROM death_cases WHERE case_id = $1 AND submitted_by_user_id = $2',
      [case_id, userId]
    );

    if (caseResult.rows.length === 0) {
      return res.status(403).json({ error: 'You can only request services for your own death cases' });
    }

    const result = await query(
      `INSERT INTO funeral_services (case_id, service_type, preferred_datetime, notes, price, status, requested_by_user_id)
       VALUES ($1, $2, $3, $4, $5, 'pending', $6)
       RETURNING *`,
      [case_id, service_type, preferred_datetime, notes, price, userId]
    );

    res.status(201).json({
      message: 'Service request submitted successfully',
      service: result.rows[0]
    });
  } catch (error) {
    console.error('Request service error:', error);
    res.status(500).json({ error: 'Failed to request service' });
  }
};

const getUserServices = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const result = await query(
      `SELECT fs.*, dc.registration_number, dc.deceased_name
       FROM funeral_services fs
       LEFT JOIN death_cases dc ON fs.case_id = dc.case_id
       WHERE fs.requested_by_user_id = $1
       ORDER BY fs.service_id DESC`,
      [userId]
    );

    res.json({ services: result.rows });
  } catch (error) {
    console.error('Get user services error:', error);
    res.status(500).json({ error: 'Failed to fetch your services' });
  }
};

const getMyAssignedServices = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const result = await query(
      `SELECT fs.*, dc.registration_number, dc.deceased_name,
              u.full_name as requester_name
       FROM funeral_services fs
       LEFT JOIN death_cases dc ON fs.case_id = dc.case_id
       LEFT JOIN users u ON fs.requested_by_user_id = u.user_id
       WHERE fs.assigned_staff_id = $1
       ORDER BY fs.scheduled_datetime ASC NULLS LAST`,
      [userId]
    );

    res.json({ services: result.rows });
  } catch (error) {
    console.error('Get my assigned services error:', error);
    res.status(500).json({ error: 'Failed to fetch assigned services' });
  }
};

const scheduleAndAssign = async (req, res) => {
  try {
    const { id } = req.params;
    const { scheduled_datetime, assigned_staff_id } = req.body;

    if (!['funeral_coordinator', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Only coordinators and admins can schedule services' });
    }

    if (!scheduled_datetime || !assigned_staff_id) {
      return res.status(400).json({ error: 'scheduled_datetime and assigned_staff_id are required' });
    }

    const staffResult = await query(
      'SELECT user_id FROM users WHERE user_id = $1 AND role = $2',
      [assigned_staff_id, 'staff']
    );

    if (staffResult.rows.length === 0) {
      return res.status(400).json({ error: 'Assigned user must have staff role' });
    }

    const result = await query(
      `UPDATE funeral_services SET
        status = 'scheduled',
        scheduled_datetime = $1,
        assigned_staff_id = $2
       WHERE service_id = $3 AND status = 'pending'
       RETURNING *`,
      [scheduled_datetime, assigned_staff_id, id]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Service must be in pending status to schedule' });
    }

    res.json({
      message: 'Service scheduled and assigned successfully',
      service: result.rows[0]
    });
  } catch (error) {
    console.error('Schedule and assign error:', error);
    res.status(500).json({ error: 'Failed to schedule service' });
  }
};

const rejectService = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejection_reason } = req.body;

    if (!['funeral_coordinator', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Only coordinators and admins can reject services' });
    }

    if (!rejection_reason) {
      return res.status(400).json({ error: 'rejection_reason is required' });
    }

    const result = await query(
      `UPDATE funeral_services SET
        status = 'cancelled',
        rejection_reason = $1
       WHERE service_id = $2 AND status = 'pending'
       RETURNING *`,
      [rejection_reason, id]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Service must be in pending status to reject' });
    }

    res.json({
      message: 'Service rejected successfully',
      service: result.rows[0]
    });
  } catch (error) {
    console.error('Reject service error:', error);
    res.status(500).json({ error: 'Failed to reject service' });
  }
};

const updateServiceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!SERVICE_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const existingResult = await query(
      'SELECT * FROM funeral_services WHERE service_id = $1',
      [id]
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }

    const service = existingResult.rows[0];
    const currentStatus = service.status;

    if (req.user.role === 'staff') {
      if (service.assigned_staff_id !== req.user.user_id) {
        return res.status(403).json({ error: 'You can only update your assigned services' });
      }

      if (!STAFF_STATUS_TRANSITIONS[currentStatus] || !STAFF_STATUS_TRANSITIONS[currentStatus].includes(status)) {
        return res.status(400).json({ error: 'Invalid status transition' });
      }
    }

    const completedAt = status === 'completed' ? new Date() : service.completed_at;

    const result = await query(
      `UPDATE funeral_services SET
        status = $1,
        completed_at = $2
       WHERE service_id = $3
       RETURNING *`,
      [status, completedAt, id]
    );

    res.json({
      message: 'Service status updated successfully',
      service: result.rows[0]
    });
  } catch (error) {
    console.error('Update service status error:', error);
    res.status(500).json({ error: 'Failed to update service status' });
  }
};

module.exports = {
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
};
