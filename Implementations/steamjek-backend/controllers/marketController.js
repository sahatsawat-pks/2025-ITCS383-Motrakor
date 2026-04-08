const pool = require('../db');

// GET ALL ACTIVE LISTINGS
const getListings = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ml.id, it.name, it.description, it.image_url, 
              it.rarity, ml.price, ml.quantity,
              u.name as seller_name, g.title as game_title,
              ml.listed_at
       FROM market_listings ml
       JOIN item_types it ON ml.item_type_id = it.id
       JOIN users u ON ml.seller_id = u.id
       JOIN games g ON it.game_id = g.id
       WHERE ml.is_sold = false
       ORDER BY ml.listed_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET MY ITEMS (inventory)
const getMyItems = async (req, res) => {
  const owner_id = req.user.id;
  try {
    const result = await pool.query(
      `SELECT ui.id, it.id as item_type_id, it.name, it.description, it.image_url,
              it.rarity, ui.quantity, g.title as game_title
       FROM user_items ui
       JOIN item_types it ON ui.item_type_id = it.id
       JOIN games g ON it.game_id = g.id
       WHERE ui.owner_id = $1 AND ui.quantity > 0`,
      [owner_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET MY LISTINGS
const getMyListings = async (req, res) => {
  const seller_id = req.user.id;
  try {
    const result = await pool.query(
      `SELECT ml.*, it.name as item_name, it.image_url, it.rarity
       FROM market_listings ml
       JOIN item_types it ON ml.item_type_id = it.id
       WHERE ml.seller_id = $1 AND ml.is_sold = false
       ORDER BY ml.listed_at DESC`,
      [seller_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// CREATE LISTING (sell an item)
const createListing = async (req, res) => {
  const seller_id = req.user.id;
  const { item_type_id, quantity = 1, price } = req.body;

  if (!item_type_id || !price) {
    return res.status(400).json({ 
      message: 'item_type_id and price are required' 
    });
  }

  try {
    const userItem = await pool.query(
      'SELECT * FROM user_items WHERE owner_id = $1 AND item_type_id = $2',
      [seller_id, item_type_id]
    );
    if (userItem.rows.length === 0 || userItem.rows[0].quantity < quantity) {
      return res.status(403).json({ 
        message: 'You do not have enough of this item' 
      });
    }

    await pool.query(
      'UPDATE user_items SET quantity = quantity - $1 WHERE owner_id = $2 AND item_type_id = $3',
      [quantity, seller_id, item_type_id]
    );

    const listing = await pool.query(
      `INSERT INTO market_listings (item_type_id, seller_id, quantity, price)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [item_type_id, seller_id, quantity, price]
    );
    res.status(201).json({
      message: 'Item listed successfully',
      listing: listing.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// BUY ITEM
const buyItem = async (req, res) => {
  const buyer_id = req.user.id;
  const { listingId } = req.params;

  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');

    const listing = await client.query(
      'SELECT * FROM market_listings WHERE id = $1 AND is_sold = false FOR UPDATE',
      [listingId]
    );

    if (listing.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ 
        message: 'Listing not found or already sold' 
      });
    }

    const { item_type_id, seller_id, quantity, price } = listing.rows[0];

    if (seller_id === buyer_id) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        message: 'You cannot buy your own item' 
      });
    }

    // Check buyer balance
    const buyerResult = await client.query('SELECT balance FROM users WHERE id = $1', [buyer_id]);
    const buyerBalance = Number.parseFloat(buyerResult.rows[0].balance);
    const itemPrice = Number.parseFloat(price);

    if (buyerBalance < itemPrice) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // Deduct from buyer
    await client.query('UPDATE users SET balance = balance - $1 WHERE id = $2', [itemPrice, buyer_id]);

    // Add to seller
    await client.query('UPDATE users SET balance = balance + $1 WHERE id = $2', [itemPrice, seller_id]);

    // Transfer item to buyer
    await client.query(
      `INSERT INTO user_items (owner_id, item_type_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (owner_id, item_type_id) 
       DO UPDATE SET quantity = user_items.quantity + $3`,
      [buyer_id, item_type_id, quantity]
    );

    // Mark listing as sold
    await client.query(
      'UPDATE market_listings SET is_sold = true WHERE id = $1',
      [listingId]
    );

    // Log transaction
    await client.query(
      `INSERT INTO market_transactions 
        (listing_id, buyer_id, seller_id, item_type_id, quantity, price)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [listingId, buyer_id, seller_id, item_type_id, quantity, itemPrice]
    );

    await client.query('COMMIT');

    res.json({
      message: 'Item purchased successfully',
      item_type_id,
      quantity,
      price: itemPrice
    });
  } catch (err) {
    if (client) {
      try { 
        await client.query('ROLLBACK'); 
      } catch (error_) { 
        console.error('Rollback error', error_);
      }
    }
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  } finally {
    if (client) client.release();
  }
};

module.exports = { 
  getListings, 
  createListing, 
  buyItem, 
  getMyItems,
  getMyListings
};