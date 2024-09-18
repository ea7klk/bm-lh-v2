const bcrypt = require('bcrypt');

if (process.argv.length < 3) {
  console.log('Usage: node generate_password.js <password>');
  process.exit(1);
}

const password = process.argv[2];
const saltRounds = 10;

bcrypt.hash(password, saltRounds, function(err, hash) {
  if (err) {
    console.error('Error generating hash:', err);
  } else {
    console.log('Hashed password:', hash);
    console.log('Add this to your .env file as ADMIN_PASSWORD=', hash);
  }
});