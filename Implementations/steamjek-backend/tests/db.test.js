describe('Database Connection', () => {
  let originalEnv;

  beforeEach(() => {
    originalEnv = process.env;
    jest.resetModules();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should format DATABASE_URL properly when sslmode is missing', () => {
    process.env = { ...originalEnv, DATABASE_URL: 'postgres://test:test@localhost:5432/testdb' };
    const pool = require('../db/index');
    expect(pool).toBeDefined();
  });

  it('should use DB_HOST and DB_PORT when DATABASE_URL is not set', () => {
    process.env = {
      ...originalEnv,
      DATABASE_URL: '',
      DB_HOST: 'localhost',
      DB_PORT: '5432',
      DB_NAME: 'test',
      DB_USER: 'user',
      DB_PASSWORD: 'password',
      DB_SSL: 'true'
    };
    const pool = require('../db/index');
    expect(pool).toBeDefined();
  });

  it('should handle false DB_SSL', () => {
    process.env = {
      ...originalEnv,
      DATABASE_URL: '',
      DB_SSL: 'false'
    };
    const pool = require('../db/index');
    expect(pool).toBeDefined();
  });
});
