const express = require('express');
const PaymentController = require('./paymentController');
const { authenticateToken } = require('../auth/middleware/authMiddleware');

const router = express.Router();

// Checkout Form ödeme başlatma - Iyzico'nun hosted formunu kullanır
router.post('/checkout-form', authenticateToken, PaymentController.initializeCheckoutForm);

// Checkout Form callback - Iyzico'dan gelen sonuç
router.post('/callback', PaymentController.handleCheckoutCallback);

// Protected routes - authentication gerektirir
router.get('/history/:userId', authenticateToken, PaymentController.getPaymentHistory);
router.get('/cards/check/:userId', authenticateToken, PaymentController.getCardUserKeyOrNull);
router.get('/cards/:userId', authenticateToken, PaymentController.getUserCards);
router.post('/cards/save', authenticateToken, PaymentController.saveUserCard);

module.exports = router; 