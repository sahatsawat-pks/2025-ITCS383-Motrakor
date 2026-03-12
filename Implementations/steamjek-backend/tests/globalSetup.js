/**
 * globalSetup.js — Runs ONCE before all Jest test suites.
 * Creates the test DB users and seed game used by every test suite.
 * NOTE: jest globals (describe, it, expect, beforeAll) are NOT available here.
 */
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

module.exports = async () => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    // ── Clean all tables in FK-safe order ───────────────────────────────────
    await pool.query('DELETE FROM market_transactions');
    await pool.query('DELETE FROM market_listings');
    await pool.query('DELETE FROM user_items');
    await pool.query('DELETE FROM item_types');
    await pool.query('DELETE FROM ratings');
    await pool.query('DELETE FROM wishlist');
    await pool.query('DELETE FROM cart');
    await pool.query('DELETE FROM purchases');
    await pool.query('DELETE FROM games');
    await pool.query('DELETE FROM users');

    // ── Seed test users ─────────────────────────────────────────────────────
    const hash = await bcrypt.hash('password123', 10);

    await pool.query(
      `INSERT INTO users (name, email, password, address, balance)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO NOTHING`,
      ['Test User', 'test@example.com', hash, '123 Test Street', 1000.00]
    );
    await pool.query(
      `INSERT INTO users (name, email, password, address, balance)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO NOTHING`,
      ['Test User 2', 'test2@example.com', hash, '456 Test Street', 1000.00]
    );

    // ── Seed an approved test game ──────────────────────────────────────────
    await pool.query(
      `INSERT INTO games (title, description, genre, price, cover_image, is_approved)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      ['Seed Game', 'A seeded game for tests', 'Action', 9.99, 'https://example.com/seed.jpg', true]
    );

    console.log('\n✅ Test database seeded (globalSetup)\n');
  } finally {
    await pool.end();
  }
};
