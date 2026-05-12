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
            state = $3,
            country = $4,
            postal_code = $5,
            total_capacity = $6,
            contact_phone = $7,
            contact_email = $8,
            type = $9,
            description = $10,
            image_url = $11
          WHERE cemetery_id = $12`,
          [
            cemetery.address,
            cemetery.city,
            cemetery.state,
            cemetery.country,
            cemetery.postal_code,
            cemetery.total_capacity,
            cemetery.contact_phone,
            cemetery.contact_email,
            cemetery.type,
            cemetery.description,
            cemetery.image_url,
            id
          ]
        );
        console.log(`Updated: ${cemetery.name}`);
      } else {
        await client.query(
          `INSERT INTO cemeteries (
            name, address, city, state, country, postal_code,
            total_capacity, current_occupancy, contact_phone, contact_email,
            is_active, type, description, image_url
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, 0, $8, $9, true, $10, $11, $12)`,
          [
            cemetery.name,
            cemetery.address,
            cemetery.city,
            cemetery.state,
            cemetery.country,
            cemetery.postal_code,
            cemetery.total_capacity,
            cemetery.contact_phone,
            cemetery.contact_email,
            cemetery.type,
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
