const crypto = require('crypto');

console.log('=== Secrets FoodBack ===\n');

console.log('JWT_SECRET=');
console.log(crypto.randomBytes(64).toString('hex'));
console.log('');

console.log('JWT_REFRESH_SECRET=');
console.log(crypto.randomBytes(64).toString('hex'));
console.log('');

console.log('POSTGRES_PASSWORD=');
console.log(crypto.randomBytes(32).toString('base64').replace(/[/+=]/g, ''));
console.log('');

console.log('\n=== Copier ces valeurs dans Coolify ===');
