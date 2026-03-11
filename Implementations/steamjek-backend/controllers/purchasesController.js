const pool = require('../db');
const stripe = require('../config/stripe');

// GET USER PURCHASES
const getPurchases = async (req, res) => {
  const user_id = req.user.id;
  try {
    const result = await pool.query(
      `SELECT purchases.id, purchases.game_id, games.title, games.cover_image,
              purchases.amount, purchases.purchased_at
       FROM purchases
       JOIN games ON purchases.game_id = games.id
       WHERE purchases.user_id = $1
       ORDER BY purchases.purchased_at DESC`,
      [user_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// CREATE PAYMENT INTENT (Step 1 of checkout)
const createPaymentIntent = async (req, res) => {
  const user_id = req.user.id;
  try {
    const cartItems = await pool.query(
      `SELECT cart.game_id, games.price, games.title
       FROM cart
       JOIN games ON cart.game_id = games.id
       WHERE cart.user_id = $1`,
      [user_id]
    );

    if (cartItems.rows.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    const total = cartItems.rows.reduce(
      (sum, item) => sum + parseFloat(item.price), 0
    );
    const totalCents = Math.round(total * 100);

    if (totalCents === 0) {
      // Free purchase
      return res.json({
        isFree: true,
        amount: "0.00",
        items: cartItems.rows
      });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalCents,
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never'
      },
      metadata: {
        user_id: user_id.toString(),
        items: cartItems.rows.map(i => i.title).join(', ')
      }
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      amount: total.toFixed(2),
      items: cartItems.rows
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const confirmPurchase = async (req, res) => {
  const user_id = req.user.id;
  const { payment_intent_id } = req.body;

  try {
    let total = 0;
    const cartItems = await pool.query(
      `SELECT cart.game_id, games.price
       FROM cart
       JOIN games ON cart.game_id = games.id
       WHERE cart.user_id = $1`,
      [user_id]
    );

    if (cartItems.rows.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    total = cartItems.rows.reduce(
      (sum, item) => sum + parseFloat(item.price), 0
    );

    if (payment_intent_id === 'free_purchase') {
      if (Math.round(total * 100) !== 0) {
        return res.status(400).json({ message: 'Payment intent mismatch' });
      }
    } else {
      const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);
      if (paymentIntent.status !== 'succeeded') {
        return res.status(400).json({ message: `Payment status: ${paymentIntent.status}` });
      }
      if (paymentIntent.metadata.user_id !== user_id.toString()) {
        return res.status(403).json({ message: 'Unauthorized payment' });
      }
    }

    // Insert purchases
    for (const item of cartItems.rows) {
      await pool.query(
        'INSERT INTO purchases (user_id, game_id, amount) VALUES ($1, $2, $3)',
        [user_id, item.game_id, item.price]
      );
    }

    // Clear cart
    await pool.query('DELETE FROM cart WHERE user_id = $1', [user_id]);

    res.status(201).json({
      message: 'Purchase successful',
      items_purchased: cartItems.rows.length,
      total_amount: total.toFixed(2),
      payment_intent_id
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getPurchases, createPaymentIntent, confirmPurchase };