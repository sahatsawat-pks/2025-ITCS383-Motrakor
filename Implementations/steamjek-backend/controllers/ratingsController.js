const pool = require('../db');

// GET RATINGS FOR A GAME
const getGameRatings = async (req, res) => {
  const { gameId } = req.params;
  try {
    const result = await pool.query(
      `SELECT ratings.id, users.name, ratings.rating, 
              ratings.comment as review, ratings.created_at
       FROM ratings
       JOIN users ON ratings.user_id = users.id
       WHERE ratings.game_id = $1
       ORDER BY ratings.created_at DESC`,
      [gameId]
    );

    // Calculate average rating
    const avgResult = await pool.query(
      'SELECT AVG(rating)::NUMERIC(10,1) as average FROM ratings WHERE game_id = $1',
      [gameId]
    );

    res.json({
      average_rating: avgResult.rows[0].average || 0,
      total_reviews: result.rows.length,
      reviews: result.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// RATE A GAME
const rateGame = async (req, res) => {
  const user_id = req.user.id;
  const { gameId } = req.params;
  const { rating, review } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'Rating must be between 1 and 5' });
  }

  try {
    // Check if user purchased the game
    const purchased = await pool.query(
      'SELECT * FROM purchases WHERE user_id = $1 AND game_id = $2',
      [user_id, gameId]
    );
    if (purchased.rows.length === 0) {
      return res.status(403).json({ 
        message: 'You can only rate games you have purchased' 
      });
    }

    // Check if already rated
    const existing = await pool.query(
      'SELECT * FROM ratings WHERE user_id = $1 AND game_id = $2',
      [user_id, gameId]
    );

    if (existing.rows.length > 0) {
      // Update existing rating
      const updated = await pool.query(
        `UPDATE ratings SET rating = $1, comment = $2 
         WHERE user_id = $3 AND game_id = $4 RETURNING *`,
        [rating, review, user_id, gameId]
      );
      return res.json({
        message: 'Rating updated successfully',
        rating: updated.rows[0]
      });
    }

    // Insert new rating
    const newRating = await pool.query(
      `INSERT INTO ratings (user_id, game_id, rating, comment) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [user_id, gameId, rating, review]
    );
    res.status(201).json({
      message: 'Game rated successfully',
      rating: newRating.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getGameRatings, rateGame };