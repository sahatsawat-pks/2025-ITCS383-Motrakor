require('dotenv').config();
const { Pool } = require('@neondatabase/serverless');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function fix() {
  const newHash = '$2a$10$7cI7CtzB.W4vN30a.2KOfOSqO0zL3A8K./pA.y.kQ9tV8q7d2r78q';
  await pool.query('UPDATE users SET password = $1 WHERE email IN ($2, $3, $4)', 
    [newHash, 'alice@example.com', 'bob@example.com', 'charlie@example.com']);
  console.log('Fixed passwords!');
  process.exit(0);
}
fix();
