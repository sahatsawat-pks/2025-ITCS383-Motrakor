const pool = require('../db');

// GET ALL USERS
const getAllUsers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, role, address, created_at 
       FROM users 
       ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE USER
const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    // Prevent admin from deleting themselves
    if (Number.parseInt(id) === req.user.id) {
      return res.status(400).json({ 
        message: 'You cannot delete your own account' 
      });
    }
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET PENDING GAMES
const getPendingGames = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT games.*, users.name as creator_name
       FROM games
       JOIN users ON games.creator_id = users.id
       WHERE games.is_approved = false
       ORDER BY games.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// APPROVE GAME
const approveGame = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `UPDATE games SET is_approved = true 
       WHERE id = $1 RETURNING *`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Game not found' });
    }
    res.json({ 
      message: 'Game approved successfully',
      game: result.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// REJECT/DELETE GAME
const rejectGame = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM games WHERE id = $1', [id]);
    res.json({ message: 'Game rejected and removed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET ALL PURCHASES
const getAllPurchases = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT purchases.id, users.name as buyer_name,
              games.title as game_title, purchases.amount,
              purchases.purchased_at
       FROM purchases
       JOIN users ON purchases.user_id = users.id
       JOIN games ON purchases.game_id = games.id
       ORDER BY purchases.purchased_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { 
  getAllUsers, 
  deleteUser, 
  getPendingGames, 
  approveGame, 
  rejectGame,
  getAllPurchases
};