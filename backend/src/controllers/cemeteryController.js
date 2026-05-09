const { query } = require('../config/db');

const getAllCemeteries = async (req, res) => {
  try {
    const result = await query(
      `SELECT c.*,
              COUNT(DISTINCT s.section_id) as total_sections,
              COALESCE(SUM(s.available_plots), 0) as total_available_plots
       FROM cemeteries c
       LEFT JOIN sections s ON c.cemetery_id = s.cemetery_id
       GROUP BY c.cemetery_id
       ORDER BY c.name`
    );

    res.json({ cemeteries: result.rows });
  } catch (error) {
    console.error('Get all cemeteries error:', error);
    res.status(500).json({ error: 'Failed to fetch cemeteries' });
  }
};

const getCemeteryById = async (req, res) => {
  try {
    const { id } = req.params;

    const cemeteryResult = await query(
      'SELECT * FROM cemeteries WHERE cemetery_id = $1',
      [id]
    );

    if (cemeteryResult.rows.length === 0) {
      return res.status(404).json({ error: 'Cemetery not found' });
    }

    const sectionsResult = await query(
      `SELECT s.*,
              COUNT(g.grave_id) FILTER (WHERE g.status = 'available') as available_graves,
              COUNT(g.grave_id) FILTER (WHERE g.status = 'occupied') as occupied_graves,
              COUNT(g.grave_id) FILTER (WHERE g.status = 'reserved') as reserved_graves
       FROM sections s
       LEFT JOIN graves g ON s.section_id = g.section_id
       WHERE s.cemetery_id = $1
       GROUP BY s.section_id
       ORDER BY s.section_code`,
      [id]
    );

    res.json({
      cemetery: cemeteryResult.rows[0],
      sections: sectionsResult.rows
    });
  } catch (error) {
    console.error('Get cemetery by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch cemetery' });
  }
};

const createCemetery = async (req, res) => {
  try {
    const { name, address, city, state, country, postal_code, total_capacity, contact_phone, contact_email, type } = req.body;

    if (!name || !city) {
      return res.status(400).json({ error: 'name and city are required' });
    }

    const result = await query(
      `INSERT INTO cemeteries (name, address, city, state, country, postal_code, total_capacity, current_occupancy, contact_phone, contact_email, type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 0, $8, $9, $10)
       RETURNING *`,
      [name, address, city, state, country, postal_code, total_capacity || 0, contact_phone, contact_email, type || 'standard']
    );

    res.status(201).json({
      message: 'Cemetery created successfully',
      cemetery: result.rows[0]
    });
  } catch (error) {
    console.error('Create cemetery error:', error);
    res.status(500).json({ error: 'Failed to create cemetery' });
  }
};

const updateCemetery = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, city, state, country, postal_code, total_capacity, contact_phone, contact_email, is_active, type } = req.body;

    const existingResult = await query(
      'SELECT * FROM cemeteries WHERE cemetery_id = $1',
      [id]
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Cemetery not found' });
    }

    const result = await query(
      `UPDATE cemeteries SET
        name = COALESCE($1, name),
        address = COALESCE($2, address),
        city = COALESCE($3, city),
        state = COALESCE($4, state),
        country = COALESCE($5, country),
        postal_code = COALESCE($6, postal_code),
        total_capacity = COALESCE($7, total_capacity),
        contact_phone = COALESCE($8, contact_phone),
        contact_email = COALESCE($9, contact_email),
        is_active = COALESCE($10, is_active),
        type = COALESCE($11, type)
       WHERE cemetery_id = $12
       RETURNING *`,
      [name, address, city, state, country, postal_code, total_capacity, contact_phone, contact_email, is_active, type, id]
    );

    res.json({
      message: 'Cemetery updated successfully',
      cemetery: result.rows[0]
    });
  } catch (error) {
    console.error('Update cemetery error:', error);
    res.status(500).json({ error: 'Failed to update cemetery' });
  }
};

const createSection = async (req, res) => {
  try {
    const { id } = req.params;
    const { section_name, section_code, total_plots, description } = req.body;

    if (!section_name || !section_code) {
      return res.status(400).json({ error: 'section_name and section_code are required' });
    }

    const cemeteryResult = await query(
      'SELECT * FROM cemeteries WHERE cemetery_id = $1',
      [id]
    );

    if (cemeteryResult.rows.length === 0) {
      return res.status(404).json({ error: 'Cemetery not found' });
    }

    const existingSection = await query(
      'SELECT * FROM sections WHERE cemetery_id = $1 AND section_code = $2',
      [id, section_code]
    );

    if (existingSection.rows.length > 0) {
      return res.status(400).json({ error: 'Section code already exists in this cemetery' });
    }

    const result = await query(
      `INSERT INTO sections (cemetery_id, section_name, section_code, total_plots, available_plots, description)
       VALUES ($1, $2, $3, $4, $4, $5)
       RETURNING *`,
      [id, section_name, section_code, total_plots || 0, description]
    );

    res.status(201).json({
      message: 'Section created successfully',
      section: result.rows[0]
    });
  } catch (error) {
    console.error('Create section error:', error);
    res.status(500).json({ error: 'Failed to create section' });
  }
};

const getSectionsByCemetery = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT s.*,
              COUNT(g.grave_id) as total_graves,
              COUNT(g.grave_id) FILTER (WHERE g.status = 'available') as available_graves
       FROM sections s
       LEFT JOIN graves g ON s.section_id = g.section_id
       WHERE s.cemetery_id = $1
       GROUP BY s.section_id
       ORDER BY s.section_code`,
      [id]
    );

    res.json({ sections: result.rows });
  } catch (error) {
    console.error('Get sections error:', error);
    res.status(500).json({ error: 'Failed to fetch sections' });
  }
};

module.exports = {
  getAllCemeteries,
  getCemeteryById,
  createCemetery,
  updateCemetery,
  createSection,
  getSectionsByCemetery
};
