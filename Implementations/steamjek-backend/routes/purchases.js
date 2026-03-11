const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const {
  getPurchases,
  createPaymentIntent,
  confirmPurchase
} = require('../controllers/purchasesController');

router.get('/', authenticateToken, getPurchases);
router.post('/create-payment-intent', authenticateToken, createPaymentIntent);
router.post('/confirm', authenticateToken, confirmPurchase);

module.exports = router;
