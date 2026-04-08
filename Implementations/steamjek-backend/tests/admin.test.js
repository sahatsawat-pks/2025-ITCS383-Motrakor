const request = require('supertest');
const app = require('../server');
const pool = require('../db');
const { registerUser, loginUser, expectAuthRequired, authGet, authPost, authPut, authDelete } = require('./testHelpers');

let adminToken;
let adminId;
let userToken;
let userId;
let gameId;
let pendingGameId;

beforeAll(async () => {
  await pool.query(
    'UPDATE users SET role = $1 WHERE email = $2',
    ['admin', 'test@example.com']
  );
  ({ token: adminToken, userId: adminId } = await loginUser(app, 'test@example.com', 'password123'));

  await registerUser(app, 'Test User 2', 'test2@example.com', 'password123', '456 Test Street');
  ({ token: userToken, userId } = await loginUser(app, 'test2@example.com', 'password123'));

  const games = await pool.query('SELECT id FROM games WHERE is_approved = true LIMIT 1');
  gameId = games.rows[0]?.id;

  const pendRes = await pool.query(
    "INSERT INTO games (title, description, genre, price, creator_id, is_approved) VALUES ('Pending Game','Desc','Action',0,$1,false) RETURNING id",
    [adminId]
  );
  pendingGameId = pendRes.rows[0].id;
});

afterAll(async () => {
  await pool.query('DELETE FROM games WHERE id = $1', [pendingGameId]).catch(() => {});
});

describe('Admin API', () => {

  // ── GET /api/admin/users ─────────────────────────────────────────────────────

  describe('GET /api/admin/users', () => {
    it('should get all users as admin', async () => {
      const res = await authGet(app, '/api/admin/users', adminToken);
      expect(res.statusCode).toBe(200);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('should fail for non-admin user', async () => {
      const res = await authGet(app, '/api/admin/users', userToken);
      expect(res.statusCode).toBe(403);
      expect(res.body.message).toBe('Access denied. Admins only.');
    });

    it('should fail without token', async () => {
      const res = await request(app).get('/api/admin/users');
      expectAuthRequired(res);
    });
  });

  // ── DELETE /api/admin/users/:id ──────────────────────────────────────────────

  describe('DELETE /api/admin/users/:id', () => {
    it('should return 400 when admin tries to delete themselves', async () => {
      const res = await authDelete(app, `/api/admin/users/${adminId}`, adminToken);
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('You cannot delete your own account');
    });

    it('should delete a user successfully', async () => {
      const tmpRes = await pool.query(
        "INSERT INTO users (name, email, password, address) VALUES ('TmpUser','tmp@del.com','hash','X') RETURNING id"
      );
      const tmpId = tmpRes.rows[0].id;
      const res = await authDelete(app, `/api/admin/users/${tmpId}`, adminToken);
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('User deleted successfully');
    });
  });

  // ── GET /api/admin/games/pending ────────────────────────────────────────────

  describe('GET /api/admin/games/pending', () => {
    it('should get pending games', async () => {
      const res = await authGet(app, '/api/admin/games/pending', adminToken);
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // ── PUT /api/admin/games/:id/approve ────────────────────────────────────────

  describe('PUT /api/admin/games/:id/approve', () => {
    it('should approve a pending game', async () => {
      const res = await authPut(app, `/api/admin/games/${pendingGameId}/approve`, adminToken);
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Game approved successfully');
      expect(res.body.game.is_approved).toBe(true);
    });

    it('should return 404 when game not found', async () => {
      const res = await authPut(app, '/api/admin/games/99999999/approve', adminToken);
      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('Game not found');
    });
  });

  // ── DELETE /api/admin/games/:id/reject ──────────────────────────────────────

  describe('DELETE /api/admin/games/:id/reject', () => {
    it('should reject (delete) a game successfully', async () => {
      const rejRes = await pool.query(
        "INSERT INTO games (title, description, genre, price, creator_id, is_approved) VALUES ('Reject Me','Desc','Action',0,$1,false) RETURNING id",
        [adminId]
      );
      const rejId = rejRes.rows[0].id;
      const res = await authDelete(app, `/api/admin/games/${rejId}/reject`, adminToken);
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Game rejected and removed successfully');
    });
  });

  // ── GET /api/admin/purchases ─────────────────────────────────────────────────

  describe('GET /api/admin/purchases', () => {
    it('should get all purchases as admin', async () => {
      const res = await authGet(app, '/api/admin/purchases', adminToken);
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should fail for non-admin', async () => {
      const res = await authGet(app, '/api/admin/purchases', userToken);
      expect(res.statusCode).toBe(403);
    });
  });
});