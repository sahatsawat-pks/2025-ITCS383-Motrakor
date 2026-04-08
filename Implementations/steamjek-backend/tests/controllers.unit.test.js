/**
 * controllers.unit.test.js
 *
 * Unit-tests controller error (catch) branches by providing a factory-mock
 * of the db pool via jest.mock with a manual factory — so Jest never tries
 * to open a real Postgres connection.
 */

// Manual mock: export a plain object with jest.fn() for query and connect
jest.mock('../db', () => {
  const mockClient = {
    query: jest.fn(),
    release: jest.fn()
  };
  const pool = {
    query: jest.fn(),
    connect: jest.fn().mockResolvedValue(mockClient),
    _mockClient: mockClient
  };
  return pool;
});

const pool = require('../db');

// ─── helpers ──────────────────────────────────────────────────────────────────

function mockRes() {
  const res = { statusCode: 200, _body: null };
  res.status    = function(c) { this.statusCode = c; return this; };
  res.json      = function(d) { this._body = d; return this; };
  res.send      = function(d) { this._body = d; return this; };
  res.setHeader = function()  { return this; };
  return res;
}

const DB_ERROR = new Error('DB exploded');

function poolThrows() {
  pool.query.mockRejectedValue(DB_ERROR);
  if (pool._mockClient) {
    pool._mockClient.query.mockRejectedValue(DB_ERROR);
  }
}

afterEach(() => jest.clearAllMocks());

// ══════════════════════════════════════════════════════════════════════════════
// adminController
// ══════════════════════════════════════════════════════════════════════════════
describe('adminController – error branches', () => {
  const ctrl = require('../controllers/adminController');

  it('getAllUsers returns 500 on DB error', async () => {
    poolThrows();
    const res = mockRes();
    await ctrl.getAllUsers({}, res);
    expect(res.statusCode).toBe(500);
  });

  it('deleteUser returns 500 on DB error', async () => {
    poolThrows();
    const res = mockRes();
    await ctrl.deleteUser({ params: { id: '2' }, user: { id: 1 } }, res);
    expect(res.statusCode).toBe(500);
  });

  it('getPendingGames returns 500 on DB error', async () => {
    poolThrows();
    const res = mockRes();
    await ctrl.getPendingGames({}, res);
    expect(res.statusCode).toBe(500);
  });

  it('approveGame returns 500 on DB error', async () => {
    poolThrows();
    const res = mockRes();
    await ctrl.approveGame({ params: { id: '1' } }, res);
    expect(res.statusCode).toBe(500);
  });

  it('rejectGame returns 500 on DB error', async () => {
    poolThrows();
    const res = mockRes();
    await ctrl.rejectGame({ params: { id: '1' } }, res);
    expect(res.statusCode).toBe(500);
  });

  it('getAllPurchases returns 500 on DB error', async () => {
    poolThrows();
    const res = mockRes();
    await ctrl.getAllPurchases({}, res);
    expect(res.statusCode).toBe(500);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// gamesController
// ══════════════════════════════════════════════════════════════════════════════
describe('gamesController – error branches', () => {
  const ctrl = require('../controllers/gamesController');

  it('getAllGames returns 500 on DB error', async () => {
    poolThrows();
    const res = mockRes();
    await ctrl.getAllGames({}, res);
    expect(res.statusCode).toBe(500);
  });

  it('getGameById returns 500 on DB error', async () => {
    poolThrows();
    const res = mockRes();
    await ctrl.getGameById({ params: { id: '1' } }, res);
    expect(res.statusCode).toBe(500);
  });

  it('searchGames returns 500 on DB error', async () => {
    poolThrows();
    const res = mockRes();
    await ctrl.searchGames({ query: { query: 'x', genre: 'y' } }, res);
    expect(res.statusCode).toBe(500);
  });

  it('createGame returns 500 on DB error', async () => {
    poolThrows();
    const res = mockRes();
    await ctrl.createGame({ body: { title: 'X', description: 'Y', genre: 'Z', price: 0 }, user: { id: 1 } }, res);
    expect(res.statusCode).toBe(500);
  });

  it('downloadGame returns 500 on DB error', async () => {
    poolThrows();
    const res = mockRes();
    await ctrl.downloadGame({ params: { id: '1' } }, res);
    expect(res.statusCode).toBe(500);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// cartController
// ══════════════════════════════════════════════════════════════════════════════
describe('cartController – error branches', () => {
  const ctrl = require('../controllers/cartController');

  it('getCart returns 500 on DB error', async () => {
    poolThrows();
    const res = mockRes();
    await ctrl.getCart({ user: { id: 1 } }, res);
    expect(res.statusCode).toBe(500);
  });

  it('addToCart returns 500 on DB error', async () => {
    poolThrows();
    const res = mockRes();
    await ctrl.addToCart({ user: { id: 1 }, body: { game_id: 1 } }, res);
    expect(res.statusCode).toBe(500);
  });

  it('removeFromCart returns 500 on DB error', async () => {
    poolThrows();
    const res = mockRes();
    await ctrl.removeFromCart({ user: { id: 1 }, params: { gameId: '1' } }, res);
    expect(res.statusCode).toBe(500);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// wishlistController
// ══════════════════════════════════════════════════════════════════════════════
describe('wishlistController – error branches', () => {
  const ctrl = require('../controllers/wishlistController');

  it('getWishlist returns 500 on DB error', async () => {
    poolThrows();
    const res = mockRes();
    await ctrl.getWishlist({ user: { id: 1 } }, res);
    expect(res.statusCode).toBe(500);
  });

  it('addToWishlist returns 500 on DB error', async () => {
    poolThrows();
    const res = mockRes();
    await ctrl.addToWishlist({ user: { id: 1 }, body: { game_id: 1 } }, res);
    expect(res.statusCode).toBe(500);
  });

  it('removeFromWishlist returns 500 on DB error', async () => {
    poolThrows();
    const res = mockRes();
    await ctrl.removeFromWishlist({ user: { id: 1 }, params: { gameId: '1' } }, res);
    expect(res.statusCode).toBe(500);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// ratingsController
// ══════════════════════════════════════════════════════════════════════════════
describe('ratingsController – error branches', () => {
  const ctrl = require('../controllers/ratingsController');

  it('getGameRatings returns 500 on DB error', async () => {
    poolThrows();
    const res = mockRes();
    await ctrl.getGameRatings({ params: { gameId: '1' } }, res);
    expect(res.statusCode).toBe(500);
  });

  it('rateGame returns 500 on DB error', async () => {
    poolThrows();
    const res = mockRes();
    await ctrl.rateGame({ user: { id: 1 }, params: { gameId: '1' }, body: { rating: 5, review: 'ok' } }, res);
    expect(res.statusCode).toBe(500);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// communityController
// ══════════════════════════════════════════════════════════════════════════════
describe('communityController – error branches', () => {
  const ctrl = require('../controllers/communityController');

  it('getThreads returns 500 on DB error', async () => {
    poolThrows();
    const res = mockRes();
    await ctrl.getThreads({ query: { game_id: '1', tag: 'Discussion', q: 'hi' } }, res);
    expect(res.statusCode).toBe(500);
  });

  it('getThread returns 500 on DB error', async () => {
    poolThrows();
    const res = mockRes();
    await ctrl.getThread({ params: { id: '1' } }, res);
    expect(res.statusCode).toBe(500);
  });

  it('createThread returns 500 on DB error', async () => {
    poolThrows();
    const res = mockRes();
    await ctrl.createThread(
      { user: { id: 1 }, body: { game_id: 1, title: 'T', content: 'C', tag: 'Discussion' } },
      res
    );
    expect(res.statusCode).toBe(500);
  });

  it('getReplies returns 500 on DB error', async () => {
    poolThrows();
    const res = mockRes();
    await ctrl.getReplies({ params: { id: '1' } }, res);
    expect(res.statusCode).toBe(500);
  });

  it('createReply returns 500 on DB error', async () => {
    poolThrows();
    const res = mockRes();
    await ctrl.createReply({ user: { id: 1 }, params: { id: '1' }, body: { content: 'reply' } }, res);
    expect(res.statusCode).toBe(500);
  });

  it('likeThread returns 500 on DB error', async () => {
    poolThrows();
    const res = mockRes();
    await ctrl.likeThread({ user: { id: 1 }, params: { id: '1' } }, res);
    expect(res.statusCode).toBe(500);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// pointShopController
// ══════════════════════════════════════════════════════════════════════════════
describe('pointShopController – error branches', () => {
  const ctrl = require('../controllers/pointShopController');

  it('getPoints returns 500 on DB error', async () => {
    poolThrows();
    const res = mockRes();
    await ctrl.getPoints({ user: { id: 1 } }, res);
    expect(res.statusCode).toBe(500);
  });

  it('getPoints returns 404 if user not found', async () => {
    pool.query.mockResolvedValue({ rows: [] });
    const res = mockRes();
    await ctrl.getPoints({ user: { id: 99 } }, res);
    expect(res.statusCode).toBe(404);
  });

  it('getRewards returns 500 on DB error', async () => {
    poolThrows();
    const res = mockRes();
    await ctrl.getRewards({ user: { id: 1 } }, res);
    expect(res.statusCode).toBe(500);
  });

  it('redeemReward returns 500 on DB error', async () => {
    poolThrows();
    const res = mockRes();
    await ctrl.redeemReward({ user: { id: 1 }, params: { rewardId: '1' } }, res);
    expect(res.statusCode).toBe(500);
  });

  it('equipReward returns 500 on DB error', async () => {
    poolThrows();
    const res = mockRes();
    await ctrl.equipReward({ user: { id: 1 }, params: { rewardId: '1' } }, res);
    expect(res.statusCode).toBe(500);
  });

  it('getMyRewards returns 500 on DB error', async () => {
    poolThrows();
    const res = mockRes();
    await ctrl.getMyRewards({ user: { id: 1 } }, res);
    expect(res.statusCode).toBe(500);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// purchasesController
// ══════════════════════════════════════════════════════════════════════════════
describe('purchasesController – error branches', () => {
  const ctrl = require('../controllers/purchasesController');

  it('getPurchases returns 500 on DB error', async () => {
    poolThrows();
    const res = mockRes();
    await ctrl.getPurchases({ user: { id: 1 } }, res);
    expect(res.statusCode).toBe(500);
  });

  it('createPaymentIntent returns 500 on DB error', async () => {
    poolThrows();
    const res = mockRes();
    await ctrl.createPaymentIntent({ user: { id: 1 } }, res);
    expect(res.statusCode).toBe(500);
  });

  it('confirmPurchase returns 500 on DB error', async () => {
    poolThrows();
    const res = mockRes();
    await ctrl.confirmPurchase({ user: { id: 1 }, body: { payment_intent_id: 'free_purchase' } }, res);
    expect(res.statusCode).toBe(500);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// authController
// ══════════════════════════════════════════════════════════════════════════════
describe('authController – error branches', () => {
  const ctrl = require('../controllers/authController');

  it('getProfile returns 500 on DB error', async () => {
    poolThrows();
    const res = mockRes();
    await ctrl.getProfile({ user: { id: 1 } }, res);
    expect(res.statusCode).toBe(500);
  });

  it('getProfile returns 404 when user not found', async () => {
    pool.query.mockResolvedValue({ rows: [] });
    const res = mockRes();
    await ctrl.getProfile({ user: { id: 99 } }, res);
    expect(res.statusCode).toBe(404);
  });

  it('login returns 500 on DB error', async () => {
    poolThrows();
    const res = mockRes();
    const credentials = { email: 'a@b.com', userPass: 'dummy' }; // not a real credential
    await ctrl.login({ body: credentials }, res);
    expect(res.statusCode).toBe(500);
  });

});

// ══════════════════════════════════════════════════════════════════════════════
// marketController – error branch for buyItem (uses pool.connect)
// ══════════════════════════════════════════════════════════════════════════════
describe('marketController – error branches', () => {
  const ctrl = require('../controllers/marketController');

  it('getListings returns 500 on DB error', async () => {
    poolThrows();
    const res = mockRes();
    await ctrl.getListings({}, res);
    expect(res.statusCode).toBe(500);
  });

  it('getMyItems returns 500 on DB error', async () => {
    poolThrows();
    const res = mockRes();
    await ctrl.getMyItems({ user: { id: 1 } }, res);
    expect(res.statusCode).toBe(500);
  });

  it('getMyListings returns 500 on DB error', async () => {
    poolThrows();
    const res = mockRes();
    await ctrl.getMyListings({ user: { id: 1 } }, res);
    expect(res.statusCode).toBe(500);
  });

  it('createListing returns 500 on DB error', async () => {
    poolThrows();
    const res = mockRes();
    await ctrl.createListing({ user: { id: 1 }, body: { item_type_id: 1, quantity: 1, price: 5 } }, res);
    expect(res.statusCode).toBe(500);
  });

  it('buyItem returns 500 when pool.connect throws', async () => {
    pool.connect.mockRejectedValue(DB_ERROR);
    const res = mockRes();
    await ctrl.buyItem({ user: { id: 2 }, params: { listingId: '1' } }, res);
    expect(res.statusCode).toBe(500);
  });
});
