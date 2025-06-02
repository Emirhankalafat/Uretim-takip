const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const app = express();
const authRoutes = require('./auth/authRoutes');
const permissionRoutes = require('./permission/permissionRoutes');
const userRoutes = require('./user/userRoutes');
const categoryRoutes = require('./category/categoryRoutes');
const productRoutes = require('./product/productRoutes');
const productStepsRoutes = require('./product-steps/productStepsRoutes');
const customerRoutes = require('./customer/customerRoutes');
const orderRoutes = require('./orders/orderRoutes');
const myJobsRoutes = require('./my-jobs/myJobsRoutes');
const paymentRoutes = require('./payment/routes');
const { startTokenCleanupScheduler } = require('./auth/utils/scheduler');
const { authenticateToken } = require('./auth/middleware/authMiddleware');
const { csrfProtection } = require('./auth/middleware/csrfMiddleware');
const { connectRedis } = require('./config/redis');
const { checkInvite, acceptInvite } = require('./user/userController');
require('dotenv').config();

// Production modunu kontrol et
const isProduction = process.env.NODE_ENV === 'production';

// CORS ayarları
if (isProduction) {
  // Production modda sadece aynı origin'den gelen istekleri kabul et
  app.use(cors({
    origin: process.env.FRONTEND_URL || false, // Sadece belirtilen URL'den
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'CSRF-Token']
  }));
} else {
  // Development modda localhost'tan gelen istekleri kabul et
  app.use(cors({
    origin: 'http://localhost:5173', // React app URL'i (Vite default port)
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'CSRF-Token']
  }));
}

app.use(express.json()); // JSON body parse
app.use(express.urlencoded({ extended: true })); // Form data parse
app.use(cookieParser()); // Cookie parse

// Auth routes (CSRF koruması yok)
app.use('/api/auth', authRoutes);

// Public user routes (authentication gerekmez)
app.get('/api/user/check-invite', checkInvite);
app.post('/api/user/accept-invite', acceptInvite);

// Payment routes - özel authentication yapılandırması
// 3dsecure route authentication gerektirir
app.post('/api/payment/3dsecure', (req, res, next) => {
  // Token'ı header'dan veya form data'dan oku
  let token = null;
  
  // Önce header'dan dene
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }
  
  // Header'da yoksa form data'dan dene
  if (!token && req.body.authorization) {
    const formAuth = req.body.authorization;
    if (formAuth.startsWith('Bearer ')) {
      token = formAuth.substring(7);
    }
  }
  
  if (!token) {
    return res.status(401).send('<html><body><h1>Unauthorized - Token required</h1></body></html>');
  }
  
  // Token'ı header'a koy ki authenticateToken middleware'i çalışsın
  req.headers.authorization = `Bearer ${token}`;
  
  // Authentication middleware'ini çağır
  authenticateToken(req, res, (err) => {
    if (err) {
      return res.status(401).send('<html><body><h1>Unauthorized - Invalid token</h1></body></html>');
    }
    
    // PaymentController.start3DSecurePayment'ı direkt çağır
    const PaymentController = require('./payment/paymentController');
    PaymentController.start3DSecurePayment(req, res);
  });
});

// Diğer payment routes - authentication gerekmez (callback için)
app.use('/api/payment', paymentRoutes);

// Diğer tüm route'lar için auth + CSRF koruması
app.use('/api/permissions', authenticateToken, csrfProtection, permissionRoutes);
app.use('/api/user', authenticateToken, csrfProtection, userRoutes);
app.use('/api/categories', authenticateToken, csrfProtection, categoryRoutes);
app.use('/api/products', authenticateToken, csrfProtection, productRoutes);
app.use('/api/product-steps', authenticateToken, csrfProtection, productStepsRoutes);
app.use('/api/customers', authenticateToken, csrfProtection, customerRoutes);
app.use('/api/orders', authenticateToken, csrfProtection, orderRoutes);
app.use('/api/my-jobs', authenticateToken, csrfProtection, myJobsRoutes);

// Token yönetim scheduler'ını başlat
// Sadece revoke et (önerilen)
startTokenCleanupScheduler();

const PORT = process.env.PORT || 3001;

// Redis bağlantısını başlat
async function startServer() {
  try {
    // Redis bağlantısını başlat
    await connectRedis();
    
    // Server'ı başlat
    app.listen(PORT, () => {
      console.log(`🚀 Server ${PORT} portunda çalışıyor.`);
      if (isProduction) {
        console.log(`🌐 Production modda çalışıyor - API Sunucusu`);
        console.log(`🔗 API: http://localhost:${PORT}/api`);
      } else {
        console.log(`🌐 Development modda - CORS Origin: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`);
      }
    });
  } catch (error) {
    console.error('❌ Server başlatma hatası:', error);
    process.exit(1);
  }
}

startServer();
