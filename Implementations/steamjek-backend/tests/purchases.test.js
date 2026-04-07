const request = require('supertest');
const app = require('../server');
const pool = require('../db');
const jwt = require('jsonwebtoken');

let token;
let userId;
let freeGameId;
let paidGameId;

beforeAll(async () => {
  await request(app)
    .post('/api/auth/register')
    .send({ name: 'Purchase Tester', email: 'test@example.com', password: 'password123', address: '123 Test St' })
    .catch(() => {});

  const login = await request(app)
    .post('/api/auth/login')
    .send({ email: 'test@example.com', password: 'password123' });
  token = login.body.token;
  userId = login.body.user.id;

  // Clear existing cart and purchases
  await pool.query('DELETE FROM cart WHERE user_id = $1', [userId]);
  await pool.query('DELETE FROM purchases WHERE user_id = $1', [userId]);

  // Create a free game
  const freeRes = await pool.query(
    "INSERT INTO games (title, description, genre, price, is_approved) VALUES ('Free Test Game','Desc','Action',0,true) RETURNING id"
  );
  freeGameId = freeRes.rows[0].id;

  // Create a paid game
  const paidRes = await pool.query(
    "INSERT INTO games (title, description, genre, price, is_approved) VALUES ('Paid Test Game','Desc','RPG',9.99,true) RETURNING id"
  );
  paidGameId = paidRes.rows[0].id;
});

afterAll(async () => {
  await pool.query('DELETE FROM cart WHERE user_id = $1', [userId]);
  await pool.query('DELETE FROM purchases WHERE user_id = $1', [userId]);
  await pool.query('DELETE FROM games WHERE id IN ($1, $2)', [freeGameId, paidGameId]);
});

describe('Purchases API', () => {

  // ── GET /api/purchases ───────────────────────────────────────────────────────

  describe('GET /api/purchases', () => {
    it('should require auth', async () => {
      const res = await request(app).get('/api/purchases');
      expect([401, 403]).toContain(res.statusCode);
    });

    it('should get purchase history', async () => {
      const res = await request(app)
        .get('/api/purchases')
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // ── POST /api/purchases/create-payment-intent ────────────────────────────────

  describe('POST /api/purchases/create-payment-intent', () => {
    it('should require auth', async () => {
      const res = await request(app).post('/api/purchases/create-payment-intent');
      expect([401, 403]).toContain(res.statusCode);
    });

    it('should return 400 when cart is empty', async () => {
      await pool.query('DELETE FROM cart WHERE user_id = $1', [userId]);
      const res = await request(app)
        .post('/api/purchases/create-payment-intent')
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Cart is empty');
    });

    it('should return isFree=true for free items', async () => {
      await pool.query('DELETE FROM cart WHERE user_id = $1', [userId]);
      await pool.query('INSERT INTO cart (user_id, game_id) VALUES ($1, $2)', [userId, freeGameId]);

      const res = await request(app)
        .post('/api/purchases/create-payment-intent')
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.isFree).toBe(true);
      expect(res.body.amount).toBe('0.00');
    });

    it('should create payment intent for paid items', async () => {
      await pool.query('DELETE FROM cart WHERE user_id = $1', [userId]);
      await pool.query('INSERT INTO cart (user_id, game_id) VALUES ($1, $2)', [userId, paidGameId]);

      const res = await request(app)
        .post('/api/purchases/create-payment-intent')
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('clientSecret');
      expect(res.body).toHaveProperty('amount');
      expect(parseFloat(res.body.amount)).toBeGreaterThan(0);
    });
  });

  // ── POST /api/purchases/confirm ──────────────────────────────────────────────

  describe('POST /api/purchases/confirm', () => {
    it('should require auth', async () => {
      const res = await request(app).post('/api/purchases/confirm');
      expect([401, 403]).toContain(res.statusCode);
    });

    it('should return 400 when cart is empty', async () => {
      await pool.query('DELETE FROM cart WHERE user_id = $1', [userId]);
      const res = await request(app)
        .post('/api/purchases/confirm')
        .set('Authorization', `Bearer ${token}`)
        .send({ payment_intent_id: 'free_purchase' });
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Cart is empty');
    });

    it('should return 400 when free_purchase used on paid cart', async () => {
      await pool.query('DELETE FROM cart WHERE user_id = $1', [userId]);
      await pool.query('INSERT INTO cart (user_id, game_id) VALUES ($1, $2)', [userId, paidGameId]);

      const res = await request(app)
        .post('/api/purchases/confirm')
        .set('Authorization', `Bearer ${token}`)
        .send({ payment_intent_id: 'free_purchase' });
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Payment intent mismatch');
    });

    it('should complete free purchase and award points', async () => {
      // Give free game in cart
      await pool.query('DELETE FROM cart WHERE user_id = $1', [userId]);
      await pool.query('INSERT INTO cart (user_id, game_id) VALUES ($1, $2)', [userId, freeGameId]);

      const res = await request(app)
        .post('/api/purchases/confirm')
        .set('Authorization', `Bearer ${token}`)
        .send({ payment_intent_id: 'free_purchase' });
      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe('Purchase successful');
      expect(res.body.items_purchased).toBe(1);
    });

    describe('Paid purchases via Stripe', () => {
      const stripe = require('../config/stripe');
      let retrieveSpy;

      beforeEach(() => {
        retrieveSpy = jest.spyOn(stripe.paymentIntents, 'retrieve');
      });

      afterEach(() => {
        retrieveSpy.mockRestore();
      });

      it('should return 400 for unsuccessful payment status', async () => {
        await pool.query('DELETE FROM cart WHERE user_id = $1', [userId]);
        await pool.query('INSERT INTO cart (user_id, game_id) VALUES ($1, $2)', [userId, paidGameId]);

        retrieveSpy.mockResolvedValue({ status: 'requires_payment_method', metadata: { user_id: userId.toString() } });

        const res = await request(app)
          .post('/api/purchases/confirm')
          .set('Authorization', `Bearer ${token}`)
          .send({ payment_intent_id: 'pi_test_123' });
        expect(res.statusCode).toBe(400);
        expect(res.body.message).toMatch(/Payment status: requires_payment_method/);
      });

      it('should return 403 for unauthorized payment (user mismatch)', async () => {
        await pool.query('DELETE FROM cart WHERE user_id = $1', [userId]);
        await pool.query('INSERT INTO cart (user_id, game_id) VALUES ($1, $2)', [userId, paidGameId]);

        retrieveSpy.mockResolvedValue({ status: 'succeeded', metadata: { user_id: '99999' } });

        const res = await request(app)
          .post('/api/purchases/confirm')
          .set('Authorization', `Bearer ${token}`)
          .send({ payment_intent_id: 'pi_test_123' });
        expect(res.statusCode).toBe(403);
        expect(res.body.message).toBe('Unauthorized payment');
      });

      it('should complete paid purchase and award points', async () => {
        await pool.query('DELETE FROM cart WHERE user_id = $1', [userId]);
        await pool.query('INSERT INTO cart (user_id, game_id) VALUES ($1, $2)', [userId, paidGameId]);

        retrieveSpy.mockResolvedValue({ status: 'succeeded', metadata: { user_id: userId.toString() } });

        const res = await request(app)
          .post('/api/purchases/confirm')
          .set('Authorization', `Bearer ${token}`)
          .send({ payment_intent_id: 'pi_test_123' });
        expect(res.statusCode).toBe(201);
        expect(res.body.message).toBe('Purchase successful');
        expect(res.body.points_earned).toBe(300); // Math.floor(9.99 / 3) * 100 = 300
      });
    });
  });
});
