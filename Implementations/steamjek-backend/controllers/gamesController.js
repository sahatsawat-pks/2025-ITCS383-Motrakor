const pool = require('../db');

// GET ALL GAMES
const getAllGames = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM games WHERE is_approved = true ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET SINGLE GAME
const getGameById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM games WHERE id = $1', [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Game not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// SEARCH GAMES
const searchGames = async (req, res) => {
  const { query, genre } = req.query;
  try {
    let sql = 'SELECT * FROM games WHERE is_approved = true';
    let params = [];

    if (query) {
      params.push(`%${query}%`);
      sql += ` AND title ILIKE $${params.length}`;
    }
    if (genre) {
      params.push(genre);
      sql += ` AND genre = $${params.length}`;
    }

    const result = await pool.query(sql, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// CREATE GAME (Game Creator only)
const createGame = async (req, res) => {
  const { title, description, genre, price, age_rating, system_requirements } = req.body;
  const creator_id = req.user.id;
  try {
    const newGame = await pool.query(
      `INSERT INTO games 
        (title, description, genre, price, age_rating, creator_id, system_requirements) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [title, description, genre, price, age_rating, creator_id, system_requirements]
    );
    res.status(201).json({
      message: 'Game created successfully',
      game: newGame.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// DOWNLOAD GAME
const downloadGame = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT title FROM games WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Game not found' });
    }
    const game = result.rows[0];
    res.setHeader('Content-Disposition', `attachment; filename="${game.title.replace(/\s+/g, '_')}.txt"`);
    res.setHeader('Content-Type', 'text/plain');
    res.send(game.title);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getAllGames, getGameById, searchGames, createGame, downloadGame };