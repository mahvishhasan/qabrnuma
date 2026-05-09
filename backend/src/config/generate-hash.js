const bcrypt = require('bcryptjs');

const password = 'Demo1234!';
const hash = bcrypt.hashSync(password, 10);

console.log('Password:', password);
console.log('Hash:', hash);
console.log('\nUse this hash in your SQL INSERT statements');
