const Stripe = require('stripe');

// Use a fallback empty string to prevent the entire Vercel server from crashing 
// if the environment variable hasn't been loaded by the deployment yet.
const stripeKey = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder';
const stripe = Stripe(stripeKey);

module.exports = stripe;