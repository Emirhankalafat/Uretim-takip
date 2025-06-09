const express = require('express');
const PaymentController = require('./paymentController');
const { authenticateToken, authenticateSystemAdmin } = require('../auth/middleware/authMiddleware');
const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const { redisClient } = require('../config/redis');

const router = express.Router();

// Payment işlemleri için rate limit (sadece hassas endpoint'ler)
const paymentActionRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 dakika
  max: process.env.NODE_ENV === 'production' ? 15 : 100, // Production'da 15, Development'ta 100
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    message: 'Çok fazla ödeme isteği. Lütfen daha sonra tekrar deneyin.'
  },
  store: new RedisStore({
    sendCommand: async (...args) => redisClient.sendCommand(args)
  })
});

// Checkout Form ödeme başlatma - Iyzico'nun hosted formunu kullanır (Rate limit uygulanır)
router.post('/checkout-form', paymentActionRateLimit, authenticateToken, PaymentController.initializeCheckoutForm);

// Checkout Form callback - Iyzico'dan gelen sonuç
router.post('/callback', PaymentController.handleCheckoutCallback);

// Protected routes - authentication gerektirir
router.get('/history/:userId', authenticateToken, PaymentController.getPaymentHistory);
router.get('/cards/check/:userId', authenticateToken, PaymentController.getCardUserKeyOrNull);
router.get('/cards/:userId', authenticateToken, PaymentController.getUserCards);
router.post('/cards/save', paymentActionRateLimit, authenticateToken, PaymentController.saveUserCard);

// Admin için tüm ödemeleri getirir
router.get('/admin/all-payments', authenticateSystemAdmin, PaymentController.getAllPayments);

module.exports = router; 