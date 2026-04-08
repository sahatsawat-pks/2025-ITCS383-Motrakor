const request = require('supertest');
const app = require('../server');
const pool = require('../db');
const { mintJwt, expectAuthRequired, authGet, authPost } = require('./testHelpers');

let token;
let mockUserId;
let rewardId;
let lowCostRewardId;

beforeAll(async () => {
  const res = await pool.query(
    "INSERT INTO users (name, email, password, address, balance, points) VALUES ('Point Test', 'point@test.com', 'hash', 'Addr', 100, 500) RETURNING id"
  );
  mockUserId = res.rows[0].id;
  token = mintJwt(mockUserId, 'point@test.com', 'user');

  const rewardRes = await pool.query(
    "INSERT INTO point_rewards (name, description, cost, type, image_url) VALUES ('Test Badge', 'A badge', 50, 'badge', '/test.png') RETURNING id"
  );
  rewardId = rewardRes.rows[0].id;

  const expensiveRes = await pool.query(
    "INSERT INTO point_rewards (name, description, cost, type, image_url) VALUES ('Expensive Reward', 'Too pricey', 99999, 'badge', '/exp.png') RETURNING id"
  );
  lowCostRewardId = expensiveRes.rows[0].id;
});

afterAll(async () => {
  await pool.query("DELETE FROM user_rewards WHERE user_id=$1", [mockUserId]);
  await pool.query("DELETE FROM point_rewards WHERE id IN ($1, $2)", [rewardId, lowCostRewardId]);
  await pool.query("DELETE FROM users WHERE email='point@test.com'");
});

describe('Point Shop Endpoints', () => {

  // ── GET /api/points ──────────────────────────────────────────────────────────

  it('GET /api/points should return 401 without auth', async () => {
    const res = await request(app).get('/api/points');
    expectAuthRequired(res);
  });

  it('GET /api/points should return user points', async () => {
    const res = await authGet(app, '/api/points', token);
    expect(res.statusCode).toBe(200);
    expect(res.body.points).toBe(500);
  });

  // ── GET /api/points/rewards ──────────────────────────────────────────────────

  it('GET /api/points/rewards should require auth', async () => {
    const res = await request(app).get('/api/points/rewards');
    expectAuthRequired(res);
  });

  it('GET /api/points/rewards should list all rewards', async () => {
    const res = await authGet(app, '/api/points/rewards', token);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some(r => r.id === rewardId)).toBe(true);
  });

  // ── GET /api/points/my-rewards ───────────────────────────────────────────────

  it('GET /api/points/my-rewards should require auth', async () => {
    const res = await request(app).get('/api/points/my-rewards');
    expectAuthRequired(res);
  });

  it('GET /api/points/my-rewards should return empty before redemption', async () => {
    const res = await authGet(app, '/api/points/my-rewards', token);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  // ── POST /api/points/redeem/:rewardId ───────────────────────────────────────

  it('POST /api/points/redeem should return 404 for non-existent reward', async () => {
    const res = await authPost(app, '/api/points/redeem/99999999', token);
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Reward not found');
  });

  it('POST /api/points/redeem should return 400 for insufficient points', async () => {
    const res = await authPost(app, `/api/points/redeem/${lowCostRewardId}`, token);
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Insufficient points');
  });

  it('POST /api/points/redeem should redeem reward successfully', async () => {
    const res = await authPost(app, `/api/points/redeem/${rewardId}`, token);
    expect(res.statusCode).toBe(201);
    expect(res.body.message).toMatch(/redeemed/i);
    expect(res.body.points_spent).toBe(50);
  });

  it('POST /api/points/redeem should return 409 for duplicate redemption', async () => {
    const res = await authPost(app, `/api/points/redeem/${rewardId}`, token);
    expect(res.statusCode).toBe(409);
    expect(res.body.message).toBe('Already redeemed');
  });

  it('GET /api/points/my-rewards should list redeemed rewards', async () => {
    const res = await authGet(app, '/api/points/my-rewards', token);
    expect(res.statusCode).toBe(200);
    expect(res.body.some(r => r.id === rewardId)).toBe(true);
  });

  // ── POST /api/points/equip/:rewardId ────────────────────────────────────────

  it('POST /api/points/equip should require auth', async () => {
    const res = await request(app).post(`/api/points/equip/${rewardId}`);
    expectAuthRequired(res);
  });

  it('POST /api/points/equip should return 404 if reward not redeemed', async () => {
    const res = await authPost(app, `/api/points/equip/${lowCostRewardId}`, token);
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('You have not redeemed this reward');
  });

  it('POST /api/points/equip should equip reward', async () => {
    const res = await authPost(app, `/api/points/equip/${rewardId}`, token);
    expect(res.statusCode).toBe(200);
    expect(res.body.is_equipped).toBe(true);
    expect(res.body.message).toMatch(/equipped/i);
  });

  it('POST /api/points/equip should unequip if already equipped', async () => {
    const res = await authPost(app, `/api/points/equip/${rewardId}`, token);
    expect(res.statusCode).toBe(200);
    expect(res.body.is_equipped).toBe(false);
    expect(res.body.message).toMatch(/unequipped/i);
  });
});
