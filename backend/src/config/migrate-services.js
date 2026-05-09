const { pool } = require('./db');

async function migrate() {
  try {
    await pool.query(`
      ALTER TABLE funeral_services
      ADD COLUMN IF NOT EXISTS requested_by_user_id INT REFERENCES users(user_id),
      ADD COLUMN IF NOT EXISTS price NUMERIC(10,2),
      ADD COLUMN IF NOT EXISTS preferred_datetime TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS rejection_reason TEXT
    `);

    await pool.query(`
      ALTER TABLE funeral_services
      DROP CONSTRAINT IF EXISTS funeral_services_status_check
    `);

    await pool.query(`
      ALTER TABLE funeral_services
      ADD CONSTRAINT funeral_services_status_check
      CHECK (status IN ('pending', 'scheduled', 'in_progress', 'completed', 'cancelled'))
    `);

    await pool.query(`
      ALTER TABLE funeral_services
      DROP CONSTRAINT IF EXISTS funeral_services_service_type_check
    `);

    await pool.query(`
      ALTER TABLE funeral_services
      ADD CONSTRAINT funeral_services_service_type_check
      CHECK (service_type IN ('ghusl', 'kafan', 'janaza', 'transport', 'grave_prep', 'headstone', 'cleaning', 'perpetual', 'other'))
    `);

    console.log('Services migration done');
  } catch (error) {
    console.error('Migration error:', error.message);
  } finally {
    await pool.end();
  }
}

migrate();
