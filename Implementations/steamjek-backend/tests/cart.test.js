const request = require('supertest');
const app = require('../server');
const pool = require('../db');

let token;
let userId;
let gameId;
let purchasedGameId;

beforeAll(async () => {
  await request(app)
    .post('/api/auth/register')
    .send({ name: 'Cart Tester', email: 'cart.tester@example.com', password: 'password123', address: '123 Test St' })
    .catch(() => {});

  const login = await request(app)
    .post('/api/auth/login')
    .send({ email: 'cart.tester@example.com', password: 'password123' });
  token = login.body.token;
  userId = login.body.user.id;

  const freshGameRes = await pool.query(
    "INSERT INTO games (title, description, genre, price, is_approved) VALUES ('Cart Game','Desc','Action',0,true) RETURNING id"
  );
  gameId = freshGameRes.rows[0].id;

  // Clear cart to start fresh
  await pool.query('DELETE FROM cart WHERE user_id = $1', [userId]);

  // Create a separate game for already-purchased test
  const pRes = await pool.query(
    "INSERT INTO games (title, description, genre, price, is_approved) VALUES ('Already Bought','Desc','Action',0,true) RETURNING id"
  );
  purchasedGameId = pRes.rows[0].id;

  // Record purchase of purchasedGameId
  await pool.query(
    'INSERT INTO purchases (user_id, game_id, amount) VALUES ($1,$2,0) ON CONFLICT DO NOTHING',
    [userId, purchasedGameId]
  );
});

afterAll(async () => {
  await pool.query('DELETE FROM cart WHERE user_id = $1', [userId]);
  await pool.query('DELETE FROM purchases WHERE user_id=$1 AND game_id=$2', [userId, purchasedGameId]);
  await pool.query('DELETE FROM games WHERE id IN ($1, $2)', [purchasedGameId, gameId]);
});

describe('Cart API', () => {

  // ── POST /api/cart ───────────────────────────────────────────────────────────

  describe('POST /api/cart', () => {
    it('should fail without auth', async () => {
      const res = await request(app).post('/api/cart').send({ game_id: gameId });
      expect([401, 403]).toContain(res.statusCode);
    });

    it('should return 404 for non-existent game', async () => {
      const res = await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${token}`)
        .send({ game_id: 99999999 });
      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('Game not found');
    });

    it('should return 400 for already purchased game', async () => {
      const res = await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${token}`)
        .send({ game_id: purchasedGameId });
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Game already purchased');
    });

    it('should add game to cart', async () => {
      const res = await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${token}`)
        .send({ game_id: gameId });
      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe('Game added to cart');
    });

    it('should fail adding duplicate game to cart', async () => {
      const res = await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${token}`)
        .send({ game_id: gameId });
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Game already in cart');
    });
  });

  // ── GET /api/cart ────────────────────────────────────────────────────────────

  describe('GET /api/cart', () => {
    it('should require auth', async () => {
      const res = await request(app).get('/api/cart');
      expect([401, 403]).toContain(res.statusCode);
    });

    it('should get cart items', async () => {
      const res = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });
  });

  // ── DELETE /api/cart/:gameId ──────────────────────────────────────────────────

  describe('DELETE /api/cart/:gameId', () => {
    it('should require auth', async () => {
      const res = await request(app).delete(`/api/cart/${gameId}`);
      expect([401, 403]).toContain(res.statusCode);
    });

    it('should remove game from cart', async () => {
      const res = await request(app)
        .delete(`/api/cart/${gameId}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Game removed from cart');
    });

    it('should silently succeed removing non-existent cart item', async () => {
      const res = await request(app)
        .delete(`/api/cart/${gameId}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(200);
    });
  });
});