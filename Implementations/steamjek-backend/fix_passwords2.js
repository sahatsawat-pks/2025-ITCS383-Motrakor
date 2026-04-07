const pool = require('./db/index');
const bcrypt = require('bcryptjs');

async function fix() {
  try {
    const rawPass = 'password123';
    const newHash = bcrypt.hashSync(rawPass, 10);
    console.log("Newly generated hash:", newHash);
    
    await pool.query('UPDATE users SET password = $1 WHERE email IN ($2, $3, $4)', 
      [newHash, 'alice@example.com', 'bob@example.com', 'charlie@example.com']);
      
    const check = await pool.query('SELECT email, password FROM users LIMIT 1');
    console.log("Verification checks out?", bcrypt.compareSync(rawPass, check.rows[0].password));
    console.log('Fixed passwords (for real this time)!');
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
fix();
