const request = require('supertest');
const app = require('../server');
const pool = require('../db');
const { loginUser, expectAuthRequired, authGet, authPost, authDelete } = require('./testHelpers');

let token;
let userId;
let gameId;

beforeAll(async () => {
  ({ token, userId } = await loginUser(app, 'test@example.com', 'password123'));

  const games = await pool.query('SELECT id FROM games WHERE is_approved = true LIMIT 1');
  gameId = games.rows[0].id;

  await pool.query('DELETE FROM wishlist WHERE user_id = $1', [userId]);
});

afterAll(async () => {
  await pool.query('DELETE FROM wishlist WHERE user_id = $1', [userId]);
});

describe('Wishlist API', () => {

  // ── POST /api/wishlist ────────────────────────────────────────────────────────

  describe('POST /api/wishlist', () => {
    it('should require auth', async () => {
      const res = await request(app).post('/api/wishlist').send({ game_id: gameId });
      expectAuthRequired(res);
    });

    it('should return 404 for non-existent game', async () => {
      const res = await authPost(app, '/api/wishlist', token, { game_id: 99999999 });
      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('Game not found');
    });

    it('should add game to wishlist', async () => {
      const res = await authPost(app, '/api/wishlist', token, { game_id: gameId });
      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe('Game added to wishlist');
    });

    it('should fail adding duplicate game', async () => {
      const res = await authPost(app, '/api/wishlist', token, { game_id: gameId });
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Game already in wishlist');
    });
  });

  // ── GET /api/wishlist ─────────────────────────────────────────────────────────

  describe('GET /api/wishlist', () => {
    it('should require auth', async () => {
      const res = await request(app).get('/api/wishlist');
      expectAuthRequired(res);
    });

    it('should get wishlist', async () => {
      const res = await authGet(app, '/api/wishlist', token);
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });
  });

  // ── DELETE /api/wishlist/:gameId ──────────────────────────────────────────────

  describe('DELETE /api/wishlist/:gameId', () => {
    it('should require auth', async () => {
      const res = await request(app).delete(`/api/wishlist/${gameId}`);
      expectAuthRequired(res);
    });

    it('should remove game from wishlist', async () => {
      const res = await authDelete(app, `/api/wishlist/${gameId}`, token);
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Game removed from wishlist');
    });

    it('should silently succeed when item not in wishlist', async () => {
      const res = await authDelete(app, `/api/wishlist/${gameId}`, token);
      expect(res.statusCode).toBe(200);
    });
  });
});