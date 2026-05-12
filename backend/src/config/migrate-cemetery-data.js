const { pool } = require('./db');

const cemeteryData = [
  {
    name: 'Jannat ul Baqi Memorial Park',
    address: 'Main Boulevard, Gulberg III',
    city: 'Lahore',
    state: 'Punjab',
    country: 'Pakistan',
    postal_code: '54660',
    total_capacity: 2400,
    contact_phone: '042-35761234',
    contact_email: 'info@jannatulbaqi.pk',
    type: 'premium',
    description: 'Lahore\'s premier managed cemetery offering modern facilities, 24/7 security, and perpetual care plans. Located in the heart of Gulberg with easy access from all major areas.',
    image_url: 'https://images.unsplash.com/photo-1586348943529-beaae6c28db9?w=1200'
  },
  {
    name: 'Miani Sahib Graveyard',
    address: 'Mozang Road, Near Data Darbar',
    city: 'Lahore',
    state: 'Punjab',
    country: 'Pakistan',
    postal_code: '54000',
    total_capacity: 5000,
    contact_phone: '042-37234567',
    contact_email: 'contact@mianisahib.pk',
    type: 'historic',
    description: 'One of Lahore\'s oldest and most historic graveyards, resting place of many notable figures including poets, scholars, and freedom fighters. A site of cultural and historical significance.',
    image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200'
  },
  {
    name: 'Bahisht Zawar Cemetery',
    address: 'Ferozepur Road, Near Ichhra',
    city: 'Lahore',
    state: 'Punjab',
    country: 'Pakistan',
    postal_code: '54600',
    total_capacity: 1800,
    contact_phone: '042-35423456',
    contact_email: 'admin@bahistzawar.pk',
    type: 'standard',
    description: 'A well-maintained community cemetery serving the Ichhra and surrounding areas. Offers affordable burial options with basic maintenance services.',
    image_url: 'https://images.unsplash.com/photo-1515191107209-c28698631303?w=1200'
  }
];

async function migrateCemeteryData() {
  const client = await pool.connect();

  try {
    console.log('Starting cemetery data migration...\n');

    const addColumnSafe = async (colName, colType) => {
      try {
        await client.query(`ALTER TABLE cemeteries ADD COLUMN IF NOT EXISTS ${colName} ${colType}`);
        console.log(`Added column: ${colName}`);
      } catch (e) {
        if (!e.message.includes('already exists')) {
          console.log(`Note: ${colName} - ${e.message}`);
        }
      }
    };

    console.log('Ensuring required columns exist...');
    await addColumnSafe('description', 'TEXT');
    await addColumnSafe('image_url', 'TEXT');
    await addColumnSafe('total_capacity', 'INT DEFAULT 0');
    await addColumnSafe('current_occupancy', 'INT DEFAULT 0');
    await addColumnSafe('contact_phone', 'VARCHAR(20)');
    await addColumnSafe('contact_email', 'VARCHAR(255)');
    await addColumnSafe('is_active', 'BOOLEAN DEFAULT true');
    console.log('Column check complete.\n');

    for (const cemetery of cemeteryData) {
      const existingResult = await client.query(
        'SELECT cemetery_id FROM cemeteries WHERE name = $1',
        [cemetery.name]
      );

      if (existingResult.rows.length > 0) {
        const id = existingResult.rows[0].cemetery_id;
        await client.query(
          `UPDATE cemeteries SET
            address = $1,
            city = $2,
            description = $3,
            image_url = $4
          WHERE cemetery_id = $5`,
          [
            cemetery.address,
            cemetery.city,
            cemetery.description,
            cemetery.image_url,
            id
          ]
        );
        console.log(`Updated: ${cemetery.name}`);
      } else {
        await client.query(
          `INSERT INTO cemeteries (name, address, city, description, image_url)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            cemetery.name,
            cemetery.address,
            cemetery.city,
            cemetery.description,
            cemetery.image_url
          ]
        );
        console.log(`Inserted: ${cemetery.name}`);
      }
    }

    console.log('\nCemetery data migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrateCemeteryData().catch(console.error);
