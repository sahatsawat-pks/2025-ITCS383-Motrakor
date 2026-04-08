const request = require('supertest');
const app = require('../server');
const pool = require('../db');
const { loginUser, expectAuthRequired, authPost, authGet } = require('./testHelpers');

let token;
let userId;
let gameId;

beforeAll(async () => {
  ({ token, userId } = await loginUser(app, 'test@example.com', 'password123'));

  const games = await pool.query('SELECT id FROM games WHERE is_approved = true LIMIT 1');
  gameId = games.rows[0].id;

  await pool.query('DELETE FROM ratings WHERE user_id = $1 AND game_id = $2', [userId, gameId]);
  await pool.query(
    'INSERT INTO purchases (user_id, game_id, amount) VALUES ($1, $2, 0) ON CONFLICT DO NOTHING',
    [userId, gameId]
  );
});

afterAll(async () => {
  await pool.query('DELETE FROM ratings WHERE user_id = $1 AND game_id = $2', [userId, gameId]);
});

describe('Ratings API', () => {

  // ── GET /api/ratings/:gameId ─────────────────────────────────────────────────

  describe('GET /api/ratings/:gameId', () => {
    it('should get game ratings (no auth needed)', async () => {
      const res = await request(app).get(`/api/ratings/${gameId}`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('average_rating');
      expect(res.body).toHaveProperty('total_reviews');
      expect(res.body).toHaveProperty('reviews');
    });

    it('should return empty reviews for unknown game', async () => {
      const res = await request(app).get('/api/ratings/99999999');
      expect(res.statusCode).toBe(200);
      expect(res.body.total_reviews).toBe(0);
    });
  });

  // ── POST /api/ratings/:gameId ────────────────────────────────────────────────

  describe('POST /api/ratings/:gameId', () => {
    it('should require auth', async () => {
      const res = await request(app).post(`/api/ratings/${gameId}`).send({ rating: 5, review: 'Great!' });
      expectAuthRequired(res);
    });

    it('should return 400 for invalid rating (0)', async () => {
      const res = await authPost(app, `/api/ratings/${gameId}`, token, { rating: 0, review: 'Bad rating value' });
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Rating must be between 1 and 5');
    });

    it('should return 400 for invalid rating (6)', async () => {
      const res = await authPost(app, `/api/ratings/${gameId}`, token, { rating: 6, review: 'Too high' });
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Rating must be between 1 and 5');
    });

    it('should return 403 if game not purchased', async () => {
      const notBoughtRes = await pool.query(
        "INSERT INTO games (title, description, genre, price, is_approved) VALUES ('Not Bought','Desc','puzzle',1,true) RETURNING id"
      );
      const notBoughtId = notBoughtRes.rows[0].id;
      const res = await authPost(app, `/api/ratings/${notBoughtId}`, token, { rating: 3, review: 'Tried to rate' });
      expect(res.statusCode).toBe(403);
      expect(res.body.message).toBe('You can only rate games you have purchased');
      await pool.query('DELETE FROM games WHERE id=$1', [notBoughtId]);
    });

    it('should rate a game successfully', async () => {
      const res = await authPost(app, `/api/ratings/${gameId}`, token, { rating: 5, review: 'Amazing!' });
      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe('Game rated successfully');
      expect(res.body.rating).toHaveProperty('id');
    });

    it('should update existing rating', async () => {
      const res = await authPost(app, `/api/ratings/${gameId}`, token, { rating: 4, review: 'Updated review' });
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Rating updated successfully');
    });

    it('should also work without a review text', async () => {
      const res = await authPost(app, `/api/ratings/${gameId}`, token, { rating: 3 });
      expect([200, 201]).toContain(res.statusCode);
    });
  });
});