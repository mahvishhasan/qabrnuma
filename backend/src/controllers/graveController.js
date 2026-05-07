const { query } = require('../config/db');

const getAvailablePlots = async (req, res) => {
  try {
    const { cemetery_id, section_id, plot_type, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const params = [];
    let whereClause = "WHERE g.status = 'available'";
    let paramIndex = 1;

    if (cemetery_id) {
      whereClause += ` AND s.cemetery_id = $${paramIndex}`;
      params.push(cemetery_id);
      paramIndex++;
    }

    if (section_id) {
      whereClause += ` AND g.section_id = $${paramIndex}`;
      params.push(section_id);
      paramIndex++;
    }

    if (plot_type) {
      whereClause += ` AND g.plot_type = $${paramIndex}`;
      params.push(plot_type);
      paramIndex++;
    }

    const countResult = await query(
      `SELECT COUNT(*) FROM graves g
       JOIN sections s ON g.section_id = s.section_id
       ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    params.push(limit, offset);
    const result = await query(
      `SELECT g.*, s.section_name, s.section_code, c.name as cemetery_name, c.city
       FROM graves g
       JOIN sections s ON g.section_id = s.section_id
       JOIN cemeteries c ON s.cemetery_id = c.cemetery_id
       ${whereClause}
       ORDER BY c.name, s.section_code, g.plot_id
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );

    res.json({
      plots: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get available plots error:', error);
    res.status(500).json({ error: 'Failed to fetch available plots' });
  }
};

const getGraveById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT g.*, s.section_name, s.section_code,
              c.name as cemetery_name, c.city, c.type as cemetery_type
       FROM graves g
       JOIN sections s ON g.section_id = s.section_id
       JOIN cemeteries c ON s.cemetery_id = c.cemetery_id
       WHERE g.grave_id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Grave not found' });
    }

    const grave = result.rows[0];

    const reservationResult = await query(
      `SELECT r.*, u.full_name as reserved_by_name
       FROM reservations r
       JOIN users u ON r.user_id = u.user_id
       WHERE r.grave_id = $1 AND r.status IN ('pending', 'approved')
       ORDER BY r.created_at DESC LIMIT 1`,
      [id]
    );

    const burialResult = await query(
      `SELECT br.*, dc.deceased_name, dc.date_of_death
       FROM burial_records br
       JOIN death_cases dc ON br.case_id = dc.case_id
       WHERE br.grave_id = $1`,
      [id]
    );

    res.json({
      grave,
      current_reservation: reservationResult.rows[0] || null,
      burial_records: burialResult.rows
    });
  } catch (error) {
    console.error('Get grave by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch grave' });
  }
};

const createGrave = async (req, res) => {
  try {
    const {
      section_id,
      plot_id,
      plot_type,
      dimensions,
      capacity,
      premium_tier,
      base_price,
      maintenance_plan
    } = req.body;

    if (!section_id || !plot_id) {
      return res.status(400).json({ error: 'section_id and plot_id are required' });
    }

    const sectionResult = await query(
      'SELECT * FROM sections WHERE section_id = $1',
      [section_id]
    );

    if (sectionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Section not found' });
    }

    const existingGrave = await query(
      'SELECT * FROM graves WHERE plot_id = $1',
      [plot_id]
    );

    if (existingGrave.rows.length > 0) {
      return res.status(400).json({ error: 'Plot ID already exists' });
    }

    const result = await query(
      `INSERT INTO graves (
        section_id, plot_id, plot_type, dimensions, capacity,
        premium_tier, base_price, maintenance_plan, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'available')
      RETURNING *`,
      [
        section_id, plot_id, plot_type || 'standard', dimensions,
        capacity || 1, premium_tier, base_price, maintenance_plan
      ]
    );

    await query(
      `UPDATE sections SET available_plots = available_plots + 1, total_plots = total_plots + 1
       WHERE section_id = $1`,
      [section_id]
    );

    res.status(201).json({
      message: 'Grave created successfully',
      grave: result.rows[0]
    });
  } catch (error) {
    console.error('Create grave error:', error);
    res.status(500).json({ error: 'Failed to create grave' });
  }
};

const updateGraveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['available', 'reserved', 'occupied'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const existingResult = await query(
      'SELECT * FROM graves WHERE grave_id = $1',
      [id]
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Grave not found' });
    }

    const oldStatus = existingResult.rows[0].status;

    const result = await query(
      'UPDATE graves SET status = $1 WHERE grave_id = $2 RETURNING *',
      [status, id]
    );

    const sectionId = result.rows[0].section_id;
    if (oldStatus === 'available' && status !== 'available') {
      await query(
        'UPDATE sections SET available_plots = available_plots - 1 WHERE section_id = $1',
        [sectionId]
      );
    } else if (oldStatus !== 'available' && status === 'available') {
      await query(
        'UPDATE sections SET available_plots = available_plots + 1 WHERE section_id = $1',
        [sectionId]
      );
    }

    res.json({
      message: 'Grave status updated successfully',
      grave: result.rows[0]
    });
  } catch (error) {
    console.error('Update grave status error:', error);
    res.status(500).json({ error: 'Failed to update grave status' });
  }
};

const getGravesBySection = async (req, res) => {
  try {
    const { sectionId } = req.params;
    const { status } = req.query;

    let whereClause = 'WHERE g.section_id = $1';
    const params = [sectionId];

    if (status) {
      whereClause += ' AND g.status = $2';
      params.push(status);
    }

    const result = await query(
      `SELECT g.*, s.section_name, s.section_code
       FROM graves g
       JOIN sections s ON g.section_id = s.section_id
       ${whereClause}
       ORDER BY g.plot_id`,
      params
    );

    res.json({ graves: result.rows });
  } catch (error) {
    console.error('Get graves by section error:', error);
    res.status(500).json({ error: 'Failed to fetch graves' });
  }
};

module.exports = {
  getAvailablePlots,
  getGraveById,
  createGrave,
  updateGraveStatus,
  getGravesBySection
};
