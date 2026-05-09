const { query } = require('../config/db');

const getActivityLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const countResult = await query('SELECT COUNT(*) FROM case_status_history');
    const total = parseInt(countResult.rows[0].count);

    const result = await query(
      `SELECT
        csh.history_id,
        csh.case_id,
        dc.registration_number,
        csh.old_status,
        csh.new_status,
        u.full_name as changed_by_name,
        csh.notes,
        csh.changed_at
       FROM case_status_history csh
       LEFT JOIN death_cases dc ON csh.case_id = dc.case_id
       LEFT JOIN users u ON csh.changed_by_user_id = u.user_id
       ORDER BY csh.changed_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.json({
      logs: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get activity logs error:', error);
    res.status(500).json({ error: 'Failed to fetch activity logs' });
  }
};

module.exports = { getActivityLogs };
