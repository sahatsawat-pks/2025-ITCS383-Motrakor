const pool = require('./db/index');
async function check() {
  try {
    const res = await pool.query('SELECT email, password FROM users WHERE email = $1', ['alice@example.com']);
    console.log("Alice in DB:", res.rows[0]);
    const bcrypt = require('bcryptjs');
    console.log("Matches 'password123'?:", bcrypt.compareSync('password123', res.rows[0].password));
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
check();
