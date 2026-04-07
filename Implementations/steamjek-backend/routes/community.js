const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const {
  getThreads,
  getThread,
  createThread,
  getReplies,
  createReply,
  likeThread
} = require('../controllers/communityController');

router.get('/threads',                  getThreads);
router.get('/threads/:id',              getThread);
router.post('/threads',                 authenticateToken, createThread);
router.get('/threads/:id/replies',      getReplies);
router.post('/threads/:id/replies',     authenticateToken, createReply);
router.post('/threads/:id/like',        authenticateToken, likeThread);

module.exports = router;
