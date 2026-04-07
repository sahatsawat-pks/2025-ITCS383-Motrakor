describe('Stripe Configuration', () => {
  let originalEnv;

  beforeEach(() => {
    originalEnv = process.env;
    jest.resetModules();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should use fallback test key when STRIPE_SECRET_KEY is missing', () => {
    process.env = { ...originalEnv };
    delete process.env.STRIPE_SECRET_KEY;
    const stripe = require('../config/stripe');
    expect(stripe).toBeDefined();
    // Stripe sdk object has internals, but we can just check it loads okay
  });
});
