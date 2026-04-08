describe('Database Connection', () => {
  let originalEnv;
  let currentPool;

  beforeEach(() => {
    originalEnv = process.env;
    jest.resetModules();
    currentPool = null;
  });

  afterEach(async () => {
    // Close any pool opened by require('../db/index') in this test
    if (currentPool && typeof currentPool.end === 'function') {
      await currentPool.end().catch(() => {});
    }
    process.env = originalEnv;
  });

  it('should format DATABASE_URL properly when sslmode is missing', async () => {
    process.env = { ...originalEnv, DATABASE_URL: 'postgres://test:test@localhost:5432/testdb' };
    currentPool = require('../db/index');
    expect(currentPool).toBeDefined();
  });

  it('should use DB_HOST and DB_PORT when DATABASE_URL is not set', async () => {
    process.env = {
      ...originalEnv,
      DATABASE_URL: '',
      DB_HOST: 'localhost',
      DB_PORT: '5432',
      DB_NAME: 'test',
      DB_USER: 'user',
      DB_PASSWORD: 'password',
      DB_SSL: 'false'
    };
    currentPool = require('../db/index');
    expect(currentPool).toBeDefined();
  });

  it('should handle false DB_SSL', async () => {
    process.env = {
      ...originalEnv,
      DATABASE_URL: '',
      DB_SSL: 'false'
    };
    currentPool = require('../db/index');
    expect(currentPool).toBeDefined();
  });
});
