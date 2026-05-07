const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const runMigration = async () => {
  if (!process.env.DATABASE_URL) {
    console.error('ERROR: DATABASE_URL not found in environment variables');
    console.log('Please create a .env file with your Neon connection string');
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    console.log('Connecting to Neon database...');
    await sql`SELECT 1`;
    console.log('Database connected\n');

    // Run schema
    console.log('Running schema.sql...');
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    const schemaStatements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of schemaStatements) {
      if (statement.length > 0) {
        await sql(statement);
      }
    }
    console.log('Schema created successfully\n');

    // Run seed
    console.log('Running seed.sql...');
    const seedPath = path.join(__dirname, 'seed.sql');
    const seed = fs.readFileSync(seedPath, 'utf8');

    const seedStatements = seed
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of seedStatements) {
      if (statement.length > 0) {
        await sql(statement);
      }
    }
    console.log('Seed data inserted successfully\n');

    console.log('Migration completed successfully!');
    console.log('\nDatabase tables created:');
    console.log('  - users');
    console.log('  - cemeteries');
    console.log('  - sections');
    console.log('  - graves');
    console.log('  - death_cases');
    console.log('  - burial_records');
    console.log('  - reservations');
    console.log('  - family_plot_groups');
    console.log('  - family_plot_members');
    console.log('  - funeral_services');
    console.log('  - case_status_history');

  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  }
};

runMigration();
