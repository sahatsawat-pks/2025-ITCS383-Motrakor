const request = require('supertest');
const app = require('../server');
const pool = require('../db');
const { mintJwt, expectAuthRequired, authGet, authPost } = require('./testHelpers');

let token;
let mockUserId;
let gameId;
let threadId;

beforeAll(async () => {
  const existing = await pool.query("SELECT id FROM users WHERE email = 'com@test.com'");
  if (existing.rows.length > 0) {
    const prevId = existing.rows[0].id;
    await pool.query("DELETE FROM thread_likes WHERE thread_id IN (SELECT id FROM threads WHERE user_id=$1)", [prevId]);
    await pool.query("DELETE FROM thread_replies WHERE user_id=$1", [prevId]);
    await pool.query("DELETE FROM threads WHERE user_id=$1", [prevId]);
    await pool.query("DELETE FROM users WHERE id=$1", [prevId]);
  }

  const userRes = await pool.query(
    "INSERT INTO users (name, email, password, address, balance) VALUES ('Com Test', 'com@test.com', 'hash', 'Addr', 100) RETURNING id"
  );
  mockUserId = userRes.rows[0].id;
  token = mintJwt(mockUserId, 'com@test.com', 'user');

  const gameRes = await pool.query(
    "INSERT INTO games (title, description, genre, price, is_approved) VALUES ('Community Test Game','Desc','Action',0,true) RETURNING id"
  );
  gameId = gameRes.rows[0].id;
});

afterAll(async () => {
  await pool.query("DELETE FROM thread_likes WHERE thread_id IN (SELECT id FROM threads WHERE user_id=$1)", [mockUserId]);
  await pool.query("DELETE FROM thread_replies WHERE user_id=$1", [mockUserId]);
  await pool.query("DELETE FROM threads WHERE user_id=$1", [mockUserId]);
  await pool.query("DELETE FROM games WHERE id=$1", [gameId]);
  await pool.query("DELETE FROM users WHERE email='com@test.com'");
});

describe('Community Endpoints', () => {

  // ── GET /threads ────────────────────────────────────────────────────────────

  it('GET /api/community/threads should return 400 when game_id missing', async () => {
    const res = await request(app).get('/api/community/threads');
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('game_id is required');
  });

  it('GET /api/community/threads should return threads array for valid game_id', async () => {
    const res = await request(app).get(`/api/community/threads?game_id=${gameId}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/community/threads should filter by tag', async () => {
    const res = await request(app).get(`/api/community/threads?game_id=${gameId}&tag=Discussion`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/community/threads should filter by search query', async () => {
    const res = await request(app).get(`/api/community/threads?game_id=${gameId}&q=test`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/community/threads should filter by tag AND query', async () => {
    const res = await request(app).get(`/api/community/threads?game_id=${gameId}&tag=Discussion&q=hello`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  // ── POST /threads ───────────────────────────────────────────────────────────

  it('POST /api/community/threads should require auth', async () => {
    const res = await request(app)
      .post('/api/community/threads')
      .send({ game_id: gameId, title: 'A', content: 'B', tag: 'Discussion' });
    expectAuthRequired(res);
  });

  it('POST /api/community/threads should return 400 when field missing', async () => {
    const res = await authPost(app, '/api/community/threads', token, { game_id: gameId, title: 'Only title' });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/required/i);
  });

  it('POST /api/community/threads should create thread with valid tag', async () => {
    const res = await authPost(app, '/api/community/threads', token, { game_id: gameId, title: 'Test Thread', content: 'Content', tag: 'Discussion' });
    expect(res.statusCode).toBe(201);
    expect(res.body.title).toBe('Test Thread');
    threadId = res.body.id;
  });

  it('POST /api/community/threads should default invalid tag to Discussion', async () => {
    const res = await authPost(app, '/api/community/threads', token, { game_id: gameId, title: 'Invalid Tag Thread', content: 'Content', tag: 'InvalidTag' });
    expect(res.statusCode).toBe(201);
    expect(res.body.tag).toBe('Discussion');
  });

  it('POST /api/community/threads with Guide tag', async () => {
    const res = await authPost(app, '/api/community/threads', token, { game_id: gameId, title: 'Guide Thread', content: 'Guide content', tag: 'Guide' });
    expect(res.statusCode).toBe(201);
    expect(res.body.tag).toBe('Guide');
  });

  it('POST /api/community/threads with Bug Report tag', async () => {
    const res = await authPost(app, '/api/community/threads', token, { game_id: gameId, title: 'Bug Thread', content: 'Bug content', tag: 'Bug Report' });
    expect(res.statusCode).toBe(201);
    expect(res.body.tag).toBe('Bug Report');
  });

  // ── GET /threads/:id ────────────────────────────────────────────────────────

  it('GET /api/community/threads/:id should return a single thread', async () => {
    const res = await request(app).get('/api/community/threads/' + threadId);
    expect(res.statusCode).toBe(200);
    expect(res.body.id).toBe(threadId);
  });

  it('GET /api/community/threads/:id should return 404 for non-existent thread', async () => {
    const res = await request(app).get('/api/community/threads/99999999');
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Thread not found');
  });

  // ── POST /threads/:id/like ──────────────────────────────────────────────────

  it('POST /api/community/threads/:id/like should like a thread', async () => {
    const res = await authPost(app, '/api/community/threads/' + threadId + '/like', token);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/liked/i);
    expect(res.body.liked).toBe(true);
  });

  it('POST /api/community/threads/:id/like should toggle unlike', async () => {
    const res = await authPost(app, '/api/community/threads/' + threadId + '/like', token);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/unliked/i);
    expect(res.body.liked).toBe(false);
  });

  it('POST /api/community/threads/:id/like should require auth', async () => {
    const res = await request(app).post('/api/community/threads/' + threadId + '/like');
    expectAuthRequired(res);
  });

  // ── POST /threads/:id/replies ───────────────────────────────────────────────

  it('POST /api/community/threads/:id/replies should require auth', async () => {
    const res = await request(app)
      .post('/api/community/threads/' + threadId + '/replies')
      .send({ content: 'A reply' });
    expectAuthRequired(res);
  });

  it('POST /api/community/threads/:id/replies should return 400 when content missing', async () => {
    const res = await authPost(app, '/api/community/threads/' + threadId + '/replies', token, {});
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('content is required');
  });

  it('POST /api/community/threads/:id/replies should return 404 for non-existent thread', async () => {
    const res = await authPost(app, '/api/community/threads/99999999/replies', token, { content: 'Reply to nowhere' });
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Thread not found');
  });

  it('POST /api/community/threads/:id/replies should add a reply', async () => {
    const res = await authPost(app, '/api/community/threads/' + threadId + '/replies', token, { content: 'Test reply' });
    expect(res.statusCode).toBe(201);
    expect(res.body.content).toBe('Test reply');
  });

  // ── GET /threads/:id/replies ────────────────────────────────────────────────

  it('GET /api/community/threads/:id/replies should get replies', async () => {
    const res = await request(app).get('/api/community/threads/' + threadId + '/replies');
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });
});
