const { query } = require('../config/db');
const { DEATH_CASE_STATUSES } = require('../config/constants');

const generateRegistrationNumber = async () => {
  const year = new Date().getFullYear();
  const result = await query(
    `SELECT registration_number FROM death_cases
     WHERE registration_number LIKE $1
     ORDER BY registration_number DESC LIMIT 1`,
    [`DC-${year}-%`]
  );

  let nextNum = 1;
  if (result.rows.length > 0) {
    const lastNum = parseInt(result.rows[0].registration_number.split('-')[2]);
    nextNum = lastNum + 1;
  }
  return `DC-${year}-${String(nextNum).padStart(4, '0')}`;
};

const createCase = async (req, res) => {
  try {
    const {
      deceased_name,
      gender,
      age,
      cnic,
      date_of_death,
      cause_of_death,
      next_of_kin_name,
      next_of_kin_contact,
      next_of_kin_relation
    } = req.body;

    if (!deceased_name || !date_of_death || !next_of_kin_name || !next_of_kin_contact) {
      return res.status(400).json({
        error: 'Missing required fields: deceased_name, date_of_death, next_of_kin_name, next_of_kin_contact'
      });
    }

    const registration_number = await generateRegistrationNumber();

    const result = await query(
      `INSERT INTO death_cases (
        registration_number, deceased_name, gender, age, cnic,
        date_of_death, cause_of_death, next_of_kin_name,
        next_of_kin_contact, next_of_kin_relation,
        status, submitted_by_user_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending', $11)
      RETURNING *`,
      [
        registration_number, deceased_name, gender, age, cnic,
        date_of_death, cause_of_death, next_of_kin_name,
        next_of_kin_contact, next_of_kin_relation, req.user.user_id
      ]
    );

    const newCase = result.rows[0];

    await query(
      `INSERT INTO case_status_history (case_id, old_status, new_status, changed_by_user_id, notes)
       VALUES ($1, NULL, 'pending', $2, 'Case created')`,
      [newCase.case_id, req.user.user_id]
    );

    res.status(201).json({
      message: 'Death case created successfully',
      case: newCase
    });
  } catch (error) {
    console.error('Create case error:', error);
    res.status(500).json({ error: 'Failed to create death case' });
  }
};

const getAllCases = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const offset = (page - 1) * limit;
    const params = [];
    let whereClause = '';
    let paramIndex = 1;

    const isPrivileged = ['admin', 'staff', 'cemetery_manager'].includes(req.user.role);

    if (!isPrivileged) {
      whereClause = `WHERE submitted_by_user_id = $${paramIndex}`;
      params.push(req.user.user_id);
      paramIndex++;
    }

    if (status) {
      whereClause += whereClause ? ' AND ' : 'WHERE ';
      whereClause += `status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (search) {
      whereClause += whereClause ? ' AND ' : 'WHERE ';
      whereClause += `(deceased_name ILIKE $${paramIndex} OR registration_number ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    const countResult = await query(
      `SELECT COUNT(*) FROM death_cases ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    params.push(limit, offset);
    const result = await query(
      `SELECT dc.*, u.full_name as submitted_by_name, s.full_name as assigned_staff_name
       FROM death_cases dc
       LEFT JOIN users u ON dc.submitted_by_user_id = u.user_id
       LEFT JOIN users s ON dc.assigned_staff_id = s.user_id
       ${whereClause}
       ORDER BY dc.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );

    res.json({
      cases: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get all cases error:', error);
    res.status(500).json({ error: 'Failed to fetch death cases' });
  }
};

const getCaseById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT dc.*, u.full_name as submitted_by_name, u.email as submitted_by_email,
              s.full_name as assigned_staff_name
       FROM death_cases dc
       LEFT JOIN users u ON dc.submitted_by_user_id = u.user_id
       LEFT JOIN users s ON dc.assigned_staff_id = s.user_id
       WHERE dc.case_id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Death case not found' });
    }

    const deathCase = result.rows[0];

    const isPrivileged = ['admin', 'staff', 'cemetery_manager'].includes(req.user.role);
    if (!isPrivileged && deathCase.submitted_by_user_id !== req.user.user_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const historyResult = await query(
      `SELECT csh.*, u.full_name as changed_by_name
       FROM case_status_history csh
       LEFT JOIN users u ON csh.changed_by_user_id = u.user_id
       WHERE csh.case_id = $1
       ORDER BY csh.changed_at DESC`,
      [id]
    );

    res.json({
      case: deathCase,
      status_history: historyResult.rows
    });
  } catch (error) {
    console.error('Get case by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch death case' });
  }
};

const updateCaseStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, assigned_staff_id } = req.body;

    if (!DEATH_CASE_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const currentResult = await query(
      'SELECT status FROM death_cases WHERE case_id = $1',
      [id]
    );

    if (currentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Death case not found' });
    }

    const oldStatus = currentResult.rows[0].status;

    let updateQuery = 'UPDATE death_cases SET status = $1, updated_at = NOW()';
    const params = [status];
    let paramIndex = 2;

    if (assigned_staff_id) {
      updateQuery += `, assigned_staff_id = $${paramIndex}`;
      params.push(assigned_staff_id);
      paramIndex++;
    }

    updateQuery += ` WHERE case_id = $${paramIndex} RETURNING *`;
    params.push(id);

    const result = await query(updateQuery, params);

    await query(
      `INSERT INTO case_status_history (case_id, old_status, new_status, changed_by_user_id, notes)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, oldStatus, status, req.user.user_id, notes || null]
    );

    const historyResult = await query(
      `SELECT csh.*, u.full_name as changed_by_name
       FROM case_status_history csh
       LEFT JOIN users u ON csh.changed_by_user_id = u.user_id
       WHERE csh.case_id = $1
       ORDER BY csh.changed_at DESC`,
      [id]
    );

    res.json({
      message: 'Case status updated successfully',
      case: result.rows[0],
      status_history: historyResult.rows
    });
  } catch (error) {
    console.error('Update case status error:', error);
    res.status(500).json({ error: 'Failed to update case status' });
  }
};

const getUserCases = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const countResult = await query(
      'SELECT COUNT(*) FROM death_cases WHERE submitted_by_user_id = $1',
      [req.user.user_id]
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await query(
      `SELECT * FROM death_cases
       WHERE submitted_by_user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user.user_id, limit, offset]
    );

    res.json({
      cases: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get user cases error:', error);
    res.status(500).json({ error: 'Failed to fetch user cases' });
  }
};

module.exports = {
  createCase,
  getAllCases,
  getCaseById,
  updateCaseStatus,
  getUserCases
};
