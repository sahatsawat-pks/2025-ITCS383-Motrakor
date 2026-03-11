const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const {
  getAllGames,
  getGameById,
  searchGames,
  createGame,
  downloadGame
} = require('../controllers/gamesController');

router.get('/', getAllGames);
router.get('/search', searchGames);
router.get('/:id', getGameById);
router.post('/', authenticateToken, createGame);
router.get('/:id/download', authenticateToken, downloadGame);

module.exports = router;