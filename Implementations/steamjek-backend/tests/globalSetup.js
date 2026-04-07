/**
 * globalSetup.js — runs ONCE in the main Node process before any test suite.
 * Seeds the minimum data required by all tests:
 *   - test@example.com  (role: user, balance: 1000)
 *   - test2@example.com (role: user, balance: 1000)
 *   - At least one approved game
 *
 * Uses its own pool that is closed after seeding.
 */

const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

module.exports = async () => {
  const { Pool, neonConfig } = require('@neondatabase/serverless');
  const ws = require('ws');
  neonConfig.webSocketConstructor = ws;
  
  const bcrypt = require('bcryptjs');

  let connStr = process.env.DATABASE_URL || '';
  if (connStr && !connStr.includes('sslmode=require')) {
    connStr += connStr.includes('?') ? '&sslmode=require' : '?sslmode=require';
  }
  const pool = new Pool(
    connStr
      ? { connectionString: connStr, ssl: { rejectUnauthorized: false } }
      : {
          host: process.env.DB_HOST,
          port: process.env.DB_PORT,
          database: process.env.DB_NAME,
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
        }
  );

  try {
    const hash = await bcrypt.hash('password123', 10);

    // Upsert test user 1
    await pool.query(
      `INSERT INTO users (name, email, password, address, balance, points, role)
       VALUES ('Test User', 'test@example.com', $1, '123 Test St', 1000.00, 200, 'user')
       ON CONFLICT (email) DO UPDATE
         SET password = EXCLUDED.password,
             balance  = 1000.00,
             points   = 200,
             role     = 'user'`,
      [hash]
    );

    // Upsert test user 2
    await pool.query(
      `INSERT INTO users (name, email, password, address, balance, points, role)
       VALUES ('Test User 2', 'test2@example.com', $1, '456 Test Ave', 1000.00, 0, 'user')
       ON CONFLICT (email) DO UPDATE
         SET password = EXCLUDED.password,
             balance  = 1000.00,
             points   = 0,
             role     = 'user'`,
      [hash]
    );

    // Ensure at least one approved game exists
    const existing = await pool.query(
      "SELECT id FROM games WHERE is_approved = true LIMIT 1"
    );
    if (existing.rows.length === 0) {
      await pool.query(
        `INSERT INTO games (title, description, genre, price, is_approved)
         VALUES ('Seed Game', 'Baseline game for tests', 'Action', 9.99, true)`
      );
    }

    console.log('✅ [globalSetup] Test data seeded successfully.');
  } catch (err) {
    console.error('❌ [globalSetup] Failed to seed test data:', err.message);
    throw err;
  } finally {
    await pool.end();
  }
};
