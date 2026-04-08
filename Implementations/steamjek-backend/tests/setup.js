/**
 * setup.js — runs before each test FILE (via setupFilesAfterEnv).
 */

const pool = require('../db/index');

afterAll(async () => {
  await pool.end();
});