/**
 * smoke.test.js - Very basic smoke test for the SteamJek API.
 * 
 * These tests do NOT require a real database connection.
 * The `pg` pool is mocked so the CI workflow can run without Postgres.
 */

// --- Mock pg pool before any app code loads ---
jest.mock('../db', () => ({
  query: jest.fn(),
  connect: jest.fn(),
}));

const request = require('supertest');
const app = require('../server');

// ── Health / root ──────────────────────────────────────────────────────────
describe('Smoke tests', () => {

  it('GET / returns 200', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
  });

  // ── Games ──────────────────────────────────────────────────────────────────
  it('GET /api/games returns 200 with empty array when DB is empty', async () => {
    const pool = require('../db');
    pool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get('/api/games');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  // ── Market listings ────────────────────────────────────────────────────────
  it('GET /api/market/listings returns 200 with empty array when DB is empty', async () => {
    const pool = require('../db');
    pool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get('/api/market/listings');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  // ── Auth guard ─────────────────────────────────────────────────────────────
  it('GET /api/purchases requires auth (returns 401 or 403)', async () => {
    const res = await request(app).get('/api/purchases');
    expect([401, 403]).toContain(res.status);
  });

  it('GET /api/cart requires auth (returns 401 or 403)', async () => {
    const res = await request(app).get('/api/cart');
    expect([401, 403]).toContain(res.status);
  });

  it('GET /api/wishlist requires auth (returns 401 or 403)', async () => {
    const res = await request(app).get('/api/wishlist');
    expect([401, 403]).toContain(res.status);
  });

  // ── Register validation ────────────────────────────────────────────────────
  it('POST /api/auth/register with missing fields returns 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({});
    expect(res.status).toBe(400);
  });

  it('POST /api/auth/login with missing fields returns 400', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({});
    expect(res.status).toBe(400);
  });

});
