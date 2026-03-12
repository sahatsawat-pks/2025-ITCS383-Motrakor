const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const {
  getPurchases,
  createPaymentIntent,
  confirmPurchase,
  removePurchase
} = require('../controllers/purchasesController');

router.get('/', authenticateToken, getPurchases);
router.post('/create-payment-intent', authenticateToken, createPaymentIntent);
router.post('/confirm', authenticateToken, confirmPurchase);
router.delete('/:gameId', authenticateToken, removePurchase);

module.exports = router;
