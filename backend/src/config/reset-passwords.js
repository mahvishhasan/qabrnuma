const { pool } = require('./db');
const bcrypt = require('bcryptjs');

async function resetPasswords() {
  const password = 'Demo1234!';
  const hash = await bcrypt.hash(password, 10);

  const emails = [
    'admin@qabrnuma.pk',
    'staff@qabrnuma.pk',
    'manager@qabrnuma.pk',
    'user@qabrnuma.pk',
    'test2@example.com'
  ];

  for (const email of emails) {
    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE email = $2',
      [hash, email]
    );
    console.log(`Reset password for ${email}`);
  }

  console.log('All passwords reset to: Demo1234!');
  await pool.end();
}

resetPasswords().catch(console.error);
