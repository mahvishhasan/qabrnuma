const { query } = require('../config/db');

const generateRecordNumber = async () => {
  const year = new Date().getFullYear();
  const result = await query(
    `SELECT record_number FROM burial_records
     WHERE record_number LIKE $1
     ORDER BY record_number DESC LIMIT 1`,
    [`BR-${year}-%`]
  );

  let nextNum = 1;
  if (result.rows.length > 0) {
    const lastNum = parseInt(result.rows[0].record_number.split('-')[2]);
    nextNum = lastNum + 1;
  }
  return `BR-${year}-${String(nextNum).padStart(4, '0')}`;
};

const createBurialRecord = async (req, res) => {
  try {
    const {
      case_id,
      grave_id,
      funeral_director,
      burial_type,
      date_of_service,
      officiating_clergy,
      religious_affiliation,
      vault_type,
      memorial_type,
      plot_ownership,
      remarks
    } = req.body;

    if (!case_id || !grave_id) {
      return res.status(400).json({ error: 'case_id and grave_id are required' });
    }

    const caseResult = await query(
      'SELECT * FROM death_cases WHERE case_id = $1',
      [case_id]
    );
    if (caseResult.rows.length === 0) {
      return res.status(404).json({ error: 'Death case not found' });
    }

    const graveResult = await query(
      'SELECT * FROM graves WHERE grave_id = $1',
      [grave_id]
    );
    if (graveResult.rows.length === 0) {
      return res.status(404).json({ error: 'Grave not found' });
    }
    if (graveResult.rows[0].status === 'occupied') {
      return res.status(400).json({ error: 'Grave is already occupied' });
    }

    const existingRecord = await query(
      'SELECT * FROM burial_records WHERE case_id = $1',
      [case_id]
    );
    if (existingRecord.rows.length > 0) {
      return res.status(400).json({ error: 'Burial record already exists for this case' });
    }

    const record_number = await generateRecordNumber();

    const result = await query(
      `INSERT INTO burial_records (
        record_number, case_id, grave_id, funeral_director, burial_type,
        date_of_service, officiating_clergy, religious_affiliation,
        vault_type, memorial_type, plot_ownership, remarks
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        record_number, case_id, grave_id, funeral_director, burial_type,
        date_of_service, officiating_clergy, religious_affiliation,
        vault_type, memorial_type, plot_ownership, remarks
      ]
    );

    await query(
      'UPDATE graves SET status = $1 WHERE grave_id = $2',
      ['occupied', grave_id]
    );

    await query(
      'UPDATE death_cases SET status = $1, updated_at = NOW() WHERE case_id = $2',
      ['completed', case_id]
    );

    await query(
      `INSERT INTO case_status_history (case_id, old_status, new_status, changed_by_user_id, notes)
       VALUES ($1, $2, 'completed', $3, 'Burial record created')`,
      [case_id, caseResult.rows[0].status, req.user.user_id]
    );

    res.status(201).json({
      message: 'Burial record created successfully',
      record: result.rows[0]
    });
  } catch (error) {
    console.error('Create burial record error:', error);
    res.status(500).json({ error: 'Failed to create burial record' });
  }
};

const getBurialRecordById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT br.*,
              dc.deceased_name, dc.gender, dc.age, dc.date_of_death,
              dc.next_of_kin_name, dc.next_of_kin_contact, dc.next_of_kin_relation,
              g.plot_id, g.plot_type, g.dimensions,
              s.section_name, s.section_code,
              c.name as cemetery_name, c.city as cemetery_city
       FROM burial_records br
       JOIN death_cases dc ON br.case_id = dc.case_id
       JOIN graves g ON br.grave_id = g.grave_id
       JOIN sections s ON g.section_id = s.section_id
       JOIN cemeteries c ON s.cemetery_id = c.cemetery_id
       WHERE br.record_id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Burial record not found' });
    }

    res.json({ record: result.rows[0] });
  } catch (error) {
    console.error('Get burial record error:', error);
    res.status(500).json({ error: 'Failed to fetch burial record' });
  }
};

const getBurialRecordByCaseId = async (req, res) => {
  try {
    const { caseId } = req.params;

    const result = await query(
      `SELECT br.*,
              dc.deceased_name, dc.gender, dc.age, dc.date_of_death,
              dc.next_of_kin_name, dc.next_of_kin_contact, dc.next_of_kin_relation,
              g.plot_id, g.plot_type, g.dimensions,
              s.section_name, s.section_code,
              c.name as cemetery_name, c.city as cemetery_city
       FROM burial_records br
       JOIN death_cases dc ON br.case_id = dc.case_id
       JOIN graves g ON br.grave_id = g.grave_id
       JOIN sections s ON g.section_id = s.section_id
       JOIN cemeteries c ON s.cemetery_id = c.cemetery_id
       WHERE br.case_id = $1`,
      [caseId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Burial record not found for this case' });
    }

    res.json({ record: result.rows[0] });
  } catch (error) {
    console.error('Get burial record by case error:', error);
    res.status(500).json({ error: 'Failed to fetch burial record' });
  }
};

const updateBurialRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      funeral_director,
      burial_type,
      date_of_service,
      officiating_clergy,
      religious_affiliation,
      vault_type,
      memorial_type,
      plot_ownership,
      remarks
    } = req.body;

    const existingResult = await query(
      'SELECT * FROM burial_records WHERE record_id = $1',
      [id]
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Burial record not found' });
    }

    const result = await query(
      `UPDATE burial_records SET
        funeral_director = COALESCE($1, funeral_director),
        burial_type = COALESCE($2, burial_type),
        date_of_service = COALESCE($3, date_of_service),
        officiating_clergy = COALESCE($4, officiating_clergy),
        religious_affiliation = COALESCE($5, religious_affiliation),
        vault_type = COALESCE($6, vault_type),
        memorial_type = COALESCE($7, memorial_type),
        plot_ownership = COALESCE($8, plot_ownership),
        remarks = COALESCE($9, remarks)
       WHERE record_id = $10
       RETURNING *`,
      [
        funeral_director, burial_type, date_of_service, officiating_clergy,
        religious_affiliation, vault_type, memorial_type, plot_ownership,
        remarks, id
      ]
    );

    res.json({
      message: 'Burial record updated successfully',
      record: result.rows[0]
    });
  } catch (error) {
    console.error('Update burial record error:', error);
    res.status(500).json({ error: 'Failed to update burial record' });
  }
};

const getFamilyBurialHistory = async (req, res) => {
  try {
    const { surname } = req.query;

    if (!surname) {
      return res.status(400).json({ error: 'Surname query parameter is required' });
    }

    const result = await query(
      `SELECT br.*,
              dc.deceased_name, dc.gender, dc.age, dc.date_of_death,
              dc.next_of_kin_name, dc.next_of_kin_contact,
              g.plot_id, g.plot_type,
              s.section_name,
              c.name as cemetery_name
       FROM burial_records br
       JOIN death_cases dc ON br.case_id = dc.case_id
       JOIN graves g ON br.grave_id = g.grave_id
       JOIN sections s ON g.section_id = s.section_id
       JOIN cemeteries c ON s.cemetery_id = c.cemetery_id
       WHERE dc.deceased_name ILIKE $1
          OR dc.next_of_kin_name ILIKE $1
       ORDER BY br.date_of_service DESC`,
      [`%${surname}%`]
    );

    res.json({
      surname,
      total_records: result.rows.length,
      records: result.rows
    });
  } catch (error) {
    console.error('Get family burial history error:', error);
    res.status(500).json({ error: 'Failed to fetch family burial history' });
  }
};

module.exports = {
  createBurialRecord,
  getBurialRecordById,
  getBurialRecordByCaseId,
  updateBurialRecord,
  getFamilyBurialHistory
};
