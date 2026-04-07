const request = require('supertest');
const app = require('../server');
const pool = require('../db');

let token;
let gameId;

beforeAll(async () => {
  // Ensure test@example.com exists and login
  await request(app)
    .post('/api/auth/register')
    .send({ name: 'Games Tester', email: 'test@example.com', password: 'password123', address: '123 Test St' })
    .catch(() => {}); // may already exist

  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'test@example.com', password: 'password123' });
  token = res.body.token;
});

describe('Games API', () => {

  // ── POST /api/games ──────────────────────────────────────────────────────────

  describe('POST /api/games', () => {
    it('should create a game successfully', async () => {
      const res = await request(app)
        .post('/api/games')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Test Game',
          description: 'A test game',
          genre: 'action',
          price: 9.99,
          age_rating: 'all ages',
          system_requirements: 'Windows 10, 8GB RAM'
        });
      expect(res.statusCode).toBe(201);
      expect(res.body.game.title).toBe('Test Game');
      gameId = res.body.game.id;
    });

    it('should fail without auth token', async () => {
      const res = await request(app)
        .post('/api/games')
        .send({ title: 'No Auth Game', price: 9.99 });
      expect(res.statusCode).toBe(401);
    });

    it('should create game with minimal fields', async () => {
      const res = await request(app)
        .post('/api/games')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Minimal Game', description: 'Min', genre: 'RPG', price: 0 });
      expect(res.statusCode).toBe(201);
    });
  });

  // ── GET /api/games ───────────────────────────────────────────────────────────

  describe('GET /api/games', () => {
    it('should return approved games only', async () => {
      const res = await request(app).get('/api/games');
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      if (res.body.length > 0) {
        expect(res.body[0]).toHaveProperty('is_approved');
        expect(res.body.every(g => g.is_approved === true)).toBe(true);
      }
    });

    it('should return games after approval', async () => {
      await pool.query('UPDATE games SET is_approved = true WHERE id = $1', [gameId]);
      const res = await request(app).get('/api/games');
      expect(res.statusCode).toBe(200);
      expect(res.body.length).toBeGreaterThan(0);
    });
  });

  // ── GET /api/games/:id ───────────────────────────────────────────────────────

  describe('GET /api/games/:id', () => {
    it('should return a single game', async () => {
      const res = await request(app).get(`/api/games/${gameId}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.title).toBe('Test Game');
    });

    it('should return 404 for non-existent game', async () => {
      const res = await request(app).get('/api/games/99999999');
      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('Game not found');
    });
  });

  // ── GET /api/games/search ────────────────────────────────────────────────────

  describe('GET /api/games/search', () => {
    it('should search games by title', async () => {
      const res = await request(app).get('/api/games/search?query=Test');
      expect(res.statusCode).toBe(200);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('should filter games by genre', async () => {
      const res = await request(app).get('/api/games/search?genre=action');
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should filter by both query and genre', async () => {
      const res = await request(app).get('/api/games/search?query=Test&genre=action');
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should return empty array for no matches', async () => {
      const res = await request(app).get('/api/games/search?query=zzznomatch999');
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('should search with no params (return all approved)', async () => {
      const res = await request(app).get('/api/games/search');
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // ── GET /api/games/:id/download ──────────────────────────────────────────────

  describe('GET /api/games/:id/download', () => {
    it('should download game as authenticated user', async () => {
      const res = await request(app)
        .get(`/api/games/${gameId}/download`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(200);
      expect(res.headers['content-disposition']).toMatch(/attachment/);
    });

    it('should return 404 when downloading non-existent game', async () => {
      const res = await request(app)
        .get('/api/games/99999999/download')
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('Game not found');
    });

    it('should require auth for download', async () => {
      const res = await request(app).get(`/api/games/${gameId}/download`);
      expect([401, 403]).toContain(res.statusCode);
    });
  });
});