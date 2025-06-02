const express = require('express');
const PaymentController = require('./paymentController');
const { authenticateToken } = require('../auth/middleware/authMiddleware');

const router = express.Router();

// 3D Secure ödeme başlatma - özel authentication (form data'dan token okur)
router.post('/3dsecure', (req, res, next) => {
  // Debug: Request bilgilerini logla
  console.log('=== 3D Secure Authentication Debug ===');
  console.log('Headers:', {
    authorization: req.headers.authorization ? `Bearer ${req.headers.authorization.substring(7, 20)}...` : 'NONE',
    'content-type': req.headers['content-type'],
    origin: req.headers.origin,
    referer: req.headers.referer
  });
  console.log('Cookies:', {
    accessToken: req.cookies.accessToken ? `Token exists (${req.cookies.accessToken.substring(0, 20)}...)` : 'NONE'
  });
  console.log('Body keys:', Object.keys(req.body));
  console.log('Body authorization:', req.body.authorization ? `Bearer ${req.body.authorization.substring(7, 20)}...` : 'NONE');
  
  // Token'ı önce cookie'den, sonra header'dan, son olarak form data'dan oku
  let token = null;
  
  // Önce cookie'den dene (normal authentication)
  if (req.cookies.accessToken) {
    token = req.cookies.accessToken;
    console.log('Token found in cookies');
  }
  
  // Cookie'de yoksa header'dan dene
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
      console.log('Token found in header');
    }
  }
  
  // Header'da da yoksa form data'dan dene
  if (!token && req.body.authorization) {
    const formAuth = req.body.authorization;
    if (formAuth.startsWith('Bearer ')) {
      token = formAuth.substring(7);
      console.log('Token found in form data');
    }
  }
  
  if (!token) {
    console.log('❌ No token found in request');
    console.log('Available headers:', Object.keys(req.headers));
    console.log('Available cookies:', Object.keys(req.cookies));
    console.log('Available body fields:', Object.keys(req.body));
    return res.status(401).send('<html><body><h1>Unauthorized - Token required</h1><p>Debug: No token found in cookies, headers or form data</p></body></html>');
  }
  
  console.log('✅ Token found, length:', token.length);
  
  // Token'ı cookie'ye ve header'a koy ki authenticateToken middleware'i çalışsın
  req.cookies.accessToken = token;
  req.headers.authorization = `Bearer ${token}`;
  
  // Authentication middleware'ini çağır
  authenticateToken(req, res, (err) => {
    if (err) {
      console.log('❌ Authentication failed:', err.message);
      return res.status(401).send('<html><body><h1>Unauthorized - Invalid token</h1><p>Debug: Token validation failed</p></body></html>');
    }
    
    console.log('✅ Authentication successful for user:', req.user?.id);
    
    // PaymentController.start3DSecurePayment'ı direkt çağır
    PaymentController.start3DSecurePayment(req, res);
  });
});

// Ödeme başlatma (deprecated - 3dsecure kullanın)
router.post('/initiate', authenticateToken, PaymentController.initiatePayment);

// Protected routes - authentication gerektirir
router.get('/history/:userId', authenticateToken, PaymentController.getPaymentHistory);
router.get('/cards/check/:userId', authenticateToken, PaymentController.getCardUserKeyOrNull);
router.get('/cards/:userId', authenticateToken, PaymentController.getUserCards);
router.post('/cards/save', authenticateToken, PaymentController.saveUserCard);

module.exports = router; 