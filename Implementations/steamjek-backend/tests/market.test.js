const request = require('supertest');
const app = require('../server');
const pool = require('../db');
const { registerUser, loginUser, mintJwt, expectAuthRequired, authGet, authPost, authDelete } = require('./testHelpers');

let token;    // user1 (seller)
let token2;   // user2 (buyer)
let user1Id;
let user2Id;
let itemTypeId;
let listingId;

beforeAll(async () => {
  await registerUser(app, 'Market User 1', 'test@example.com', 'password123');
  ({ token, userId: user1Id } = await loginUser(app, 'test@example.com', 'password123'));

  await registerUser(app, 'Market User 2', 'test2@example.com', 'password123', '456 Test St');
  ({ token: token2, userId: user2Id } = await loginUser(app, 'test2@example.com', 'password123'));

  await pool.query('UPDATE users SET balance = 1000 WHERE id = $1', [user1Id]);
  await pool.query('UPDATE users SET balance = 1000 WHERE id = $1', [user2Id]);

  const games = await pool.query('SELECT id FROM games LIMIT 1');
  const itemType = await pool.query(
    "INSERT INTO item_types (name, description, game_id, rarity) VALUES ('Test Sword','A test sword',$1,'rare') RETURNING id",
    [games.rows[0].id]
  );
  itemTypeId = itemType.rows[0].id;

  await pool.query(
    "INSERT INTO user_items (owner_id, item_type_id, quantity) VALUES ($1, $2, 3) ON CONFLICT (owner_id, item_type_id) DO UPDATE SET quantity = 3",
    [user1Id, itemTypeId]
  );
});

afterAll(async () => {
  await pool.query('DELETE FROM market_transactions WHERE item_type_id = $1', [itemTypeId]);
  await pool.query('DELETE FROM market_listings WHERE item_type_id = $1', [itemTypeId]);
  await pool.query('DELETE FROM user_items WHERE item_type_id = $1', [itemTypeId]);
  await pool.query('DELETE FROM item_types WHERE id = $1', [itemTypeId]);
});

describe('Marketplace API', () => {

  // ── GET /api/market/listings ─────────────────────────────────────────────────

  describe('GET /api/market/listings', () => {
    it('should get all active listings', async () => {
      const res = await request(app).get('/api/market/listings');
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // ── GET /api/market/my-items ─────────────────────────────────────────────────

  describe('GET /api/market/my-items', () => {
    it('should return 401 without auth', async () => {
      const res = await request(app).get('/api/market/my-items');
      expectAuthRequired(res);
    });

    it('should get user inventory', async () => {
      const res = await authGet(app, '/api/market/my-items', token);
      expect(res.statusCode).toBe(200);
      expect(res.body.length).toBeGreaterThan(0);
    });
  });

  // ── GET /api/market/my-listings ──────────────────────────────────────────────

  describe('GET /api/market/my-listings', () => {
    it('should require auth', async () => {
      const res = await request(app).get('/api/market/my-listings');
      expectAuthRequired(res);
    });

    it('should get user listings', async () => {
      const res = await authGet(app, '/api/market/my-listings', token);
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // ── POST /api/market/listings ─────────────────────────────────────────────────

  describe('POST /api/market/listings', () => {
    it('should return 400 when required fields missing', async () => {
      const res = await authPost(app, '/api/market/listings', token, { quantity: 1 });
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/required/i);
    });

    it('should fail listing more items than owned', async () => {
      const res = await authPost(app, '/api/market/listings', token, { item_type_id: itemTypeId, quantity: 999, price: 4.99 });
      expect(res.statusCode).toBe(403);
      expect(res.body.message).toBe('You do not have enough of this item');
    });

    it('should fail listing item user does not own', async () => {
      const res = await authPost(app, '/api/market/listings', token2, { item_type_id: itemTypeId, quantity: 1, price: 4.99 });
      expect(res.statusCode).toBe(403);
    });

    it('should list item for sale', async () => {
      const res = await authPost(app, '/api/market/listings', token, { item_type_id: itemTypeId, quantity: 1, price: 4.99 });
      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe('Item listed successfully');
      listingId = res.body.listing.id;
    });
  });

  // ── POST /api/market/buy/:listingId ──────────────────────────────────────────

  describe('POST /api/market/buy/:listingId', () => {
    it('should return 401 without auth', async () => {
      const res = await request(app).post(`/api/market/buy/${listingId}`);
      expectAuthRequired(res);
    });

    it('should fail buying own item', async () => {
      const res = await authPost(app, `/api/market/buy/${listingId}`, token);
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('You cannot buy your own item');
    });

    it('should fail buying with insufficient balance', async () => {
      await pool.query('UPDATE users SET balance = 0 WHERE id = $1', [user2Id]);
      const res = await authPost(app, `/api/market/buy/${listingId}`, token2);
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Insufficient balance');
      await pool.query('UPDATE users SET balance = 1000 WHERE id = $1', [user2Id]);
    });

    it('should buy item successfully', async () => {
      const res = await authPost(app, `/api/market/buy/${listingId}`, token2);
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Item purchased successfully');
    });

    it('should fail buying already-sold listing', async () => {
      const res = await authPost(app, `/api/market/buy/${listingId}`, token2);
      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('Listing not found or already sold');
    });

    it('should return 404 for completely non-existent listing', async () => {
      const res = await authPost(app, '/api/market/buy/99999999', token2);
      expect(res.statusCode).toBe(404);
    });
  });
});