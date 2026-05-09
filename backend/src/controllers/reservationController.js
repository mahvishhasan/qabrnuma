const { pool, query } = require('../config/db');

const generateReservationNumber = async () => {
  const year = new Date().getFullYear();
  const result = await query(
    `SELECT reservation_number FROM reservations
     WHERE reservation_number LIKE $1
     ORDER BY reservation_number DESC LIMIT 1`,
    [`RES-${year}-%`]
  );

  let nextNum = 1;
  if (result.rows.length > 0) {
    const lastNum = parseInt(result.rows[0].reservation_number.split('-')[2]);
    nextNum = lastNum + 1;
  }
  return `RES-${year}-${String(nextNum).padStart(4, '0')}`;
};

const createReservation = async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      grave_id,
      primary_contact,
      phone_number,
      email,
      reservation_purpose,
      holding_fee
    } = req.body;

    if (!grave_id) {
      client.release();
      return res.status(400).json({ error: 'grave_id is required' });
    }

    await client.query('BEGIN');

    const graveResult = await client.query(
      'SELECT * FROM graves WHERE grave_id = $1 FOR UPDATE',
      [grave_id]
    );

    if (graveResult.rows.length === 0) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(404).json({ error: 'Grave not found' });
    }

    if (graveResult.rows[0].status !== 'available') {
      await client.query('ROLLBACK');
      client.release();
      return res.status(400).json({ error: 'This plot is no longer available' });
    }

    const reservation_number = await generateReservationNumber();
    const expiry_date = new Date(Date.now() + 48 * 60 * 60 * 1000);

    const result = await client.query(
      `INSERT INTO reservations (
        reservation_number, grave_id, user_id, primary_contact,
        phone_number, email, reservation_purpose, holding_fee, expiry_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        reservation_number, grave_id, req.user.user_id,
        primary_contact || req.user.full_name,
        phone_number, email || req.user.email,
        reservation_purpose, holding_fee, expiry_date
      ]
    );

    await client.query(
      'UPDATE graves SET status = $1 WHERE grave_id = $2',
      ['reserved', grave_id]
    );

    await client.query(
      'UPDATE sections SET available_plots = available_plots - 1 WHERE section_id = $1',
      [graveResult.rows[0].section_id]
    );

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Reservation created successfully',
      reservation: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create reservation error:', error);
    res.status(500).json({ error: 'Failed to create reservation' });
  } finally {
    client.release();
  }
};

const getUserReservations = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const countResult = await query(
      'SELECT COUNT(*) FROM reservations WHERE user_id = $1',
      [req.user.user_id]
    );
    const total = parseInt(countResult.rows[0].count);

    const statusCountsResult = await query(
      `SELECT
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'approved') as approved,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled,
        COUNT(*) FILTER (WHERE status = 'expired') as expired,
        COUNT(*) FILTER (WHERE status IN ('pending', 'approved') AND expiry_date < NOW() + INTERVAL '24 hours') as expiring_soon
       FROM reservations WHERE user_id = $1`,
      [req.user.user_id]
    );

    const result = await query(
      `SELECT r.*, g.plot_id, g.plot_type, s.section_name, c.name as cemetery_name
       FROM reservations r
       JOIN graves g ON r.grave_id = g.grave_id
       JOIN sections s ON g.section_id = s.section_id
       JOIN cemeteries c ON s.cemetery_id = c.cemetery_id
       WHERE r.user_id = $1
       ORDER BY r.created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user.user_id, limit, offset]
    );

    res.json({
      reservations: result.rows,
      status_counts: statusCountsResult.rows[0],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get user reservations error:', error);
    res.status(500).json({ error: 'Failed to fetch reservations' });
  }
};

const getReservationById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT r.*, g.plot_id, g.plot_type, g.dimensions, g.base_price,
              s.section_name, s.section_code, c.name as cemetery_name, c.city,
              u.full_name as reserved_by_name, u.email as reserved_by_email,
              dc.registration_number as linked_case_number, dc.deceased_name
       FROM reservations r
       JOIN graves g ON r.grave_id = g.grave_id
       JOIN sections s ON g.section_id = s.section_id
       JOIN cemeteries c ON s.cemetery_id = c.cemetery_id
       JOIN users u ON r.user_id = u.user_id
       LEFT JOIN death_cases dc ON r.linked_case_id = dc.case_id
       WHERE r.reservation_id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    const reservation = result.rows[0];
    const isPrivileged = ['admin', 'staff', 'cemetery_manager'].includes(req.user.role);
    if (!isPrivileged && reservation.user_id !== req.user.user_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ reservation });
  } catch (error) {
    console.error('Get reservation by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch reservation' });
  }
};

const cancelReservation = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;

    const result = await client.query(
      'SELECT * FROM reservations WHERE reservation_id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      client.release();
      return res.status(404).json({ error: 'Reservation not found' });
    }

    const reservation = result.rows[0];
    const isPrivileged = ['admin', 'cemetery_manager'].includes(req.user.role);
    if (!isPrivileged && reservation.user_id !== req.user.user_id) {
      client.release();
      return res.status(403).json({ error: 'Access denied' });
    }

    if (reservation.status === 'cancelled') {
      client.release();
      return res.status(400).json({ error: 'Reservation is already cancelled' });
    }

    await client.query('BEGIN');

    await client.query(
      'UPDATE reservations SET status = $1 WHERE reservation_id = $2',
      ['cancelled', id]
    );

    await client.query(
      'UPDATE graves SET status = $1 WHERE grave_id = $2',
      ['available', reservation.grave_id]
    );

    const graveResult = await client.query(
      'SELECT section_id FROM graves WHERE grave_id = $1',
      [reservation.grave_id]
    );
    await client.query(
      'UPDATE sections SET available_plots = available_plots + 1 WHERE section_id = $1',
      [graveResult.rows[0].section_id]
    );

    await client.query('COMMIT');

    res.json({ message: 'Reservation cancelled successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Cancel reservation error:', error);
    res.status(500).json({ error: 'Failed to cancel reservation' });
  } finally {
    client.release();
  }
};

const approveReservation = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'SELECT * FROM reservations WHERE reservation_id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    if (result.rows[0].status !== 'pending') {
      return res.status(400).json({ error: 'Only pending reservations can be approved' });
    }

    const updateResult = await query(
      'UPDATE reservations SET status = $1 WHERE reservation_id = $2 RETURNING *',
      ['approved', id]
    );

    res.json({
      message: 'Reservation approved successfully',
      reservation: updateResult.rows[0]
    });
  } catch (error) {
    console.error('Approve reservation error:', error);
    res.status(500).json({ error: 'Failed to approve reservation' });
  }
};

const linkReservationToCase = async (req, res) => {
  try {
    const { id } = req.params;
    const { case_id } = req.body;

    if (!case_id) {
      return res.status(400).json({ error: 'case_id is required' });
    }

    const reservationResult = await query(
      'SELECT * FROM reservations WHERE reservation_id = $1',
      [id]
    );

    if (reservationResult.rows.length === 0) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    const caseResult = await query(
      'SELECT * FROM death_cases WHERE case_id = $1',
      [case_id]
    );

    if (caseResult.rows.length === 0) {
      return res.status(404).json({ error: 'Death case not found' });
    }

    const result = await query(
      'UPDATE reservations SET linked_case_id = $1 WHERE reservation_id = $2 RETURNING *',
      [case_id, id]
    );

    res.json({
      message: 'Reservation linked to case successfully',
      reservation: result.rows[0]
    });
  } catch (error) {
    console.error('Link reservation to case error:', error);
    res.status(500).json({ error: 'Failed to link reservation to case' });
  }
};

const createFamilyPlotGroup = async (req, res) => {
  try {
    const {
      group_name,
      preferred_section,
      number_of_members,
      special_requirements,
      grave_ids
    } = req.body;

    if (!group_name) {
      return res.status(400).json({ error: 'group_name is required' });
    }

    const groupResult = await query(
      `INSERT INTO family_plot_groups (group_name, user_id, preferred_section, number_of_members, special_requirements)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [group_name, req.user.user_id, preferred_section, number_of_members || 1, special_requirements]
    );

    const group = groupResult.rows[0];

    if (grave_ids && grave_ids.length > 0) {
      for (const grave_id of grave_ids) {
        const graveResult = await query(
          'SELECT * FROM graves WHERE grave_id = $1',
          [grave_id]
        );

        if (graveResult.rows.length > 0) {
          await query(
            'INSERT INTO family_plot_members (group_id, grave_id) VALUES ($1, $2)',
            [group.group_id, grave_id]
          );
        }
      }
    }

    const membersResult = await query(
      `SELECT fpm.*, g.plot_id, g.plot_type
       FROM family_plot_members fpm
       JOIN graves g ON fpm.grave_id = g.grave_id
       WHERE fpm.group_id = $1`,
      [group.group_id]
    );

    res.status(201).json({
      message: 'Family plot group created successfully',
      group,
      members: membersResult.rows
    });
  } catch (error) {
    console.error('Create family plot group error:', error);
    res.status(500).json({ error: 'Failed to create family plot group' });
  }
};

const requestAdjacentPlot = async (req, res) => {
  try {
    const { existing_grave_id, reservation_purpose, holding_fee } = req.body;

    if (!existing_grave_id) {
      return res.status(400).json({ error: 'existing_grave_id is required' });
    }

    const existingGraveResult = await query(
      `SELECT g.*, s.section_id, s.section_code
       FROM graves g
       JOIN sections s ON g.section_id = s.section_id
       WHERE g.grave_id = $1`,
      [existing_grave_id]
    );

    if (existingGraveResult.rows.length === 0) {
      return res.status(404).json({ error: 'Existing grave not found' });
    }

    const existingGrave = existingGraveResult.rows[0];
    const plotParts = existingGrave.plot_id.match(/^(.+-)(\d+)$/);

    if (!plotParts) {
      return res.status(400).json({ error: 'Cannot determine adjacent plot from plot ID format' });
    }

    const prefix = plotParts[1];
    const plotNum = parseInt(plotParts[2]);
    const adjacentPlotIds = [
      `${prefix}${String(plotNum - 1).padStart(plotParts[2].length, '0')}`,
      `${prefix}${String(plotNum + 1).padStart(plotParts[2].length, '0')}`
    ];

    const adjacentResult = await query(
      `SELECT * FROM graves
       WHERE section_id = $1 AND plot_id = ANY($2) AND status = 'available'
       LIMIT 1`,
      [existingGrave.section_id, adjacentPlotIds]
    );

    if (adjacentResult.rows.length === 0) {
      return res.status(404).json({ error: 'No adjacent plots available' });
    }

    const adjacentGrave = adjacentResult.rows[0];
    const reservation_number = await generateReservationNumber();
    const expiry_date = new Date(Date.now() + 48 * 60 * 60 * 1000);

    const reservationResult = await query(
      `INSERT INTO reservations (
        reservation_number, grave_id, user_id, primary_contact,
        email, reservation_purpose, holding_fee, expiry_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        reservation_number, adjacentGrave.grave_id, req.user.user_id,
        req.user.full_name, req.user.email,
        reservation_purpose || 'Adjacent plot request', holding_fee, expiry_date
      ]
    );

    await query(
      'UPDATE graves SET status = $1 WHERE grave_id = $2',
      ['reserved', adjacentGrave.grave_id]
    );

    await query(
      'UPDATE sections SET available_plots = available_plots - 1 WHERE section_id = $1',
      [existingGrave.section_id]
    );

    res.status(201).json({
      message: 'Adjacent plot reserved successfully',
      reservation: reservationResult.rows[0],
      adjacent_plot: adjacentGrave
    });
  } catch (error) {
    console.error('Request adjacent plot error:', error);
    res.status(500).json({ error: 'Failed to request adjacent plot' });
  }
};

const checkAndExpireReservations = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const expiredResult = await client.query(
      `UPDATE reservations
       SET status = 'expired'
       WHERE status IN ('pending', 'approved') AND expiry_date < NOW()
       RETURNING grave_id`
    );

    if (expiredResult.rows.length > 0) {
      const graveIds = expiredResult.rows.map(r => r.grave_id);
      await client.query(
        `UPDATE graves SET status = 'available'
         WHERE grave_id = ANY($1)`,
        [graveIds]
      );

      const sectionResult = await client.query(
        `SELECT section_id, COUNT(*) as count FROM graves
         WHERE grave_id = ANY($1)
         GROUP BY section_id`,
        [graveIds]
      );

      for (const row of sectionResult.rows) {
        await client.query(
          'UPDATE sections SET available_plots = available_plots + $1 WHERE section_id = $2',
          [parseInt(row.count), row.section_id]
        );
      }

      console.log(`Expired ${expiredResult.rows.length} reservations`);
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

module.exports = {
  createReservation,
  getUserReservations,
  getReservationById,
  cancelReservation,
  approveReservation,
  linkReservationToCase,
  createFamilyPlotGroup,
  requestAdjacentPlot,
  checkAndExpireReservations
};
