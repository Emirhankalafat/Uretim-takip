const express = require('express');
const PaymentController = require('./paymentController');

const router = express.Router();

// 3D Secure callback route - CSRF koruması yok, dışarıdan çağrılabilir
router.post('/3dsecure/callback', PaymentController.handle3DSCallback);

// Ödeme başlatma (deprecated - 3dsecure kullanın)
router.post('/initiate', PaymentController.initiatePayment);

// Kullanıcının ödeme geçmişini getir
router.get('/history/:userId', PaymentController.getPaymentHistory);

// Kart işlemleri
router.get('/cards/check/:userId', PaymentController.getCardUserKeyOrNull);
router.get('/cards/:userId', PaymentController.getUserCards);
router.post('/cards/save', PaymentController.saveUserCard);

module.exports = router; 