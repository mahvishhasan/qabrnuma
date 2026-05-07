const { pool } = require('./db');
const fs = require('fs');
const path = require('path');

async function migrate() {
  try {
    console.log('Running schema.sql...');
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await pool.query(schema);
    console.log('Schema applied successfully');

    console.log('Running seed.sql...');
    const seed = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');
    await pool.query(seed);
    console.log('Seed data inserted successfully');

    console.log('Migration complete!');
  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    await pool.end();
  }
}

migrate();
