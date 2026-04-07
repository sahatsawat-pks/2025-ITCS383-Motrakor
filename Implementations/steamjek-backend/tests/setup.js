/**
 * Global test setup.
 * Seeds the minimum required test data and tears down DB pool after all tests.
 *
 * NOTE: Individual test files handle their own setup/teardown for isolation.
 *       We only register the pool.end() here globally so it runs once.
 */
const pool = require('../db');
const bcrypt = require('bcryptjs');

beforeAll(async () => {
  // Ensure a baseline test user exists for tests that depend on test@example.com
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Insert user 1 (test@example.com)
  await pool.query(`
    INSERT INTO users (name, email, password, address, balance, points)
    VALUES ('Test User', 'test@example.com', $1, '123 Test St', 1000.00, 200)
    ON CONFLICT (email) DO UPDATE
      SET name = EXCLUDED.name,
          password = EXCLUDED.password,
          address = EXCLUDED.address,
          balance = 1000.00,
          role = 'user'
  `, [hashedPassword]);

  // Insert user 2 (test2@example.com)
  await pool.query(`
    INSERT INTO users (name, email, password, address, balance, points)
    VALUES ('Test User 2', 'test2@example.com', $1, '456 Test Ave', 1000.00, 0)
    ON CONFLICT (email) DO UPDATE
      SET name = EXCLUDED.name,
          password = EXCLUDED.password,
          address = EXCLUDED.address,
          balance = 1000.00,
          role = 'user'
  `, [hashedPassword]);

  // Ensure at least one approved game exists
  await pool.query(`
    INSERT INTO games (title, description, genre, price, is_approved)
    VALUES ('Seed Game', 'A seeded game for testing', 'Action', 9.99, true)
    ON CONFLICT DO NOTHING
  `);
});

afterAll(async () => {
  await pool.end();
});