/**
 * setup.js — Jest setup file (setupFilesAfterFramework / setupFilesAfterFramework).
 * Closes the pool after each test suite to prevent open handle warnings.
 */
const pool = require('../db');

afterAll(async () => {
  await pool.end().catch(() => {});
});