const { query } = require('../config/db');
const { ROLES } = require('../config/constants');

const getUsers = async (req, res) => {
  try {
    const { role } = req.query;
    let whereClause = '';
    const params = [];

    if (role) {
      whereClause = 'WHERE role = $1';
      params.push(role);
    }

    const result = await query(
      `SELECT user_id, full_name, email, phone_number, cnic, role, is_active, created_at
       FROM users ${whereClause} ORDER BY full_name`,
      params
    );

    res.json({ users: result.rows });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

const toggleUserActive = async (req, res) => {
  try {
    const { id } = req.params;

    const existingResult = await query(
      'SELECT * FROM users WHERE user_id = $1',
      [id]
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currentStatus = existingResult.rows[0].is_active;

    const result = await query(
      'UPDATE users SET is_active = $1 WHERE user_id = $2 RETURNING user_id, full_name, email, role, is_active',
      [!currentStatus, id]
    );

    res.json({
      message: `User ${result.rows[0].is_active ? 'activated' : 'deactivated'} successfully`,
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Toggle user active error:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!ROLES.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const existingResult = await query(
      'SELECT * FROM users WHERE user_id = $1',
      [id]
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const result = await query(
      'UPDATE users SET role = $1 WHERE user_id = $2 RETURNING user_id, full_name, email, role',
      [role, id]
    );

    res.json({
      message: 'User role updated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
};

module.exports = { getUsers, toggleUserActive, updateUserRole };
