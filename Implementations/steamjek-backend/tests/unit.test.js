/**
 * unit.test.js
 * Unit tests for infrastructure modules:
 *   - server.js (root route)
 *   - middleware/auth.js
 *   - middleware/isAdmin.js
 *   - config/stripe.js
 *   - db/index.js
 */
const request = require('supertest');
const app = require('../server');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'test_secret_123';

function makeReqRes(token) {
  const req = { headers: { authorization: token ? `Bearer ${token}` : undefined } };
  const res = {
    statusCode: 200,
    _json: null,
    status(code) { this.statusCode = code; return this; },
    json(data) { this._json = data; return this; }
  };
  return { req, res };
}

function makeAdminReqRes(role) {
  const req = { user: { role } };
  const res = {
    statusCode: 200,
    _json: null,
    status(code) { this.statusCode = code; return this; },
    json(data) { this._json = data; return this; }
  };
  return { req, res };
}

// ── server.js: root route ────────────────────────────────────────────────────

describe('Server Root Route', () => {
  it('GET / should return API running message', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('SteamJek API is running!');
  });
});

// ── middleware/auth.js ────────────────────────────────────────────────────────

describe('Auth Middleware', () => {
  const authenticateToken = require('../middleware/auth');

  it('should call next() with valid token', () => {
    const token = jwt.sign({ id: 1, role: 'user' }, JWT_SECRET);
    const { req, res } = makeReqRes(token);
    const next = jest.fn();
    authenticateToken(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toHaveProperty('id', 1);
  });

  it('should return 401 when no token provided', () => {
    const { req, res } = makeReqRes(null);
    const next = jest.fn();
    authenticateToken(req, res, next);
    expect(res.statusCode).toBe(401);
    expect(res._json.message).toBe('Access denied. No token provided.');
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 403 for invalid token', () => {
    const { req, res } = makeReqRes('invalid.token.here');
    const next = jest.fn();
    authenticateToken(req, res, next);
    expect(res.statusCode).toBe(403);
    expect(res._json.message).toBe('Invalid or expired token');
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 403 for expired token', () => {
    const token = jwt.sign({ id: 1 }, JWT_SECRET, { expiresIn: '0s' });
    const { req, res } = makeReqRes(token);
    const next = jest.fn();
    // Wait tiny bit to ensure expiry
    authenticateToken(req, res, next);
    expect(res.statusCode).toBe(403);
    expect(next).not.toHaveBeenCalled();
  });
});

// ── middleware/isAdmin.js ─────────────────────────────────────────────────────

describe('isAdmin Middleware', () => {
  const isAdmin = require('../middleware/isAdmin');

  it('should call next() for admin user', () => {
    const { req, res } = makeAdminReqRes('admin');
    const next = jest.fn();
    isAdmin(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should return 403 for non-admin user', () => {
    const { req, res } = makeAdminReqRes('user');
    const next = jest.fn();
    isAdmin(req, res, next);
    expect(res.statusCode).toBe(403);
    expect(res._json.message).toBe('Access denied. Admins only.');
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 403 for undefined role', () => {
    const { req, res } = makeAdminReqRes(undefined);
    const next = jest.fn();
    isAdmin(req, res, next);
    expect(res.statusCode).toBe(403);
    expect(next).not.toHaveBeenCalled();
  });
});

// ── config/stripe.js ─────────────────────────────────────────────────────────

describe('Stripe Config', () => {
  it('should export a Stripe instance', () => {
    const stripe = require('../config/stripe');
    expect(stripe).toBeDefined();
    // Stripe instance has a paymentIntents property
    expect(typeof stripe.paymentIntents).toBe('object');
  });
});

// ── db/index.js ───────────────────────────────────────────────────────────────

describe('DB Pool', () => {
  it('should export a pool object with query method', () => {
    const pool = require('../db');
    expect(pool).toBeDefined();
    expect(typeof pool.query).toBe('function');
  });
});
