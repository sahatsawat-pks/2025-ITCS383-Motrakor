const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const {
  getPoints,
  getRewards,
  redeemReward,
  equipReward,
  getMyRewards
} = require('../controllers/pointShopController');

router.get('/',            authenticateToken, getPoints);
router.get('/rewards',     authenticateToken, getRewards);
router.get('/my-rewards',  authenticateToken, getMyRewards);
router.post('/redeem/:rewardId', authenticateToken, redeemReward);
router.post('/equip/:rewardId',  authenticateToken, equipReward);

module.exports = router;
