/**
 * testHelpers.js — shared utilities for all integration test suites.
 *
 * Provides:
 *   registerUser(app, name, email, password, address) → supertest response
 *   loginUser(app, email, password)  → { token, userId }
 *   mintJwt(id, email, role)         → signed JWT string
 *   expectAuthRequired(res)          → asserts 401 or 403
 *   authGet(app, url, token)         → supertest GET with Bearer token
 *   authPost(app, url, token, body)  → supertest POST with Bearer token
 *   authPut(app, url, token, body)   → supertest PUT with Bearer token
 *   authDelete(app, url, token)      → supertest DELETE with Bearer token
 *   expectAuthBlocked(app, checks)   → runs multiple "no-token" checks at once
 */

const request = require('supertest');
const jwt = require('jsonwebtoken');

/** Register a user (silently ignores conflicts). */
function registerUser(app, name, email, password, address = '123 Test St') {
  return request(app)
    .post('/api/auth/register')
    .send({ name, email, password, address })
    .catch(() => {});
}

/**
 * Register (silently ignoring conflicts) then log in via the API.
 * Returns { token, userId }.
 */
async function loginUser(app, email, password) {
  const login = await request(app)
    .post('/api/auth/login')
    .send({ email, password });
  return {
    token: login.body.token,
    userId: login.body.user.id,
  };
}

/**
 * Mint a JWT directly (bypasses HTTP auth flow) — useful when you need a
 * token for a user you inserted directly into the DB.
 */
function mintJwt(id, email, role = 'user') {
  return jwt.sign(
    { id, email, role },
    process.env.JWT_SECRET || 'test_secret_123',
    { expiresIn: '1h' }
  );
}

/** Assert that a response status is 401 or 403 (auth required). */
function expectAuthRequired(res) {
  expect([401, 403]).toContain(res.statusCode);
}

/** Authenticated GET helper. */
function authGet(app, url, token) {
  return request(app).get(url).set('Authorization', `Bearer ${token}`);
}

/** Authenticated POST helper. */
function authPost(app, url, token, body = {}) {
  return request(app).post(url).set('Authorization', `Bearer ${token}`).send(body);
}

/** Authenticated PUT helper. */
function authPut(app, url, token, body = {}) {
  return request(app).put(url).set('Authorization', `Bearer ${token}`).send(body);
}

/** Authenticated DELETE helper. */
function authDelete(app, url, token) {
  return request(app).delete(url).set('Authorization', `Bearer ${token}`);
}

module.exports = {
  registerUser,
  loginUser,
  mintJwt,
  expectAuthRequired,
  authGet,
  authPost,
  authPut,
  authDelete,
};
