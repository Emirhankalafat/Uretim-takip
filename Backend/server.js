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
const adminRoutes = require('./admin/adminRoutes');
const mcpRoutes = require('./MCP/mcpRouter');
const { startTokenCleanupScheduler } = require('./auth/utils/scheduler');
const { authenticateToken, authenticateSystemAdmin } = require('./auth/middleware/authMiddleware');
const { csrfProtection } = require('./auth/middleware/csrfMiddleware');
const { connectRedis } = require('./config/redis');
const { checkInvite, acceptInvite } = require('./user/userController');
const cron = require('node-cron');
const subscriptionReminderJob = require('./utils/subscriptionReminder');
const checkExpiredSubscriptions = require('./utils/subscriptionControl');
const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const { redisClient } = require('./config/redis');
const reportRoutes = require('./reports/reportRoutes');
const notificationRoutes = require('./notifications/notification.routes');
require('dotenv').config();

// Production modunu kontrol et
const isProduction = process.env.NODE_ENV === 'production';
app.set('trust proxy', 1);

// JSON ve URL encoded body parser - CORS'tan önce
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// İyzico 3D Secure callback - Body parser'dan sonra, CORS'tan ÖNCE tanımla
app.options('/api/payment/3dsecure/callback', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.status(200).end();
});

app.post('/api/payment/3dsecure/callback', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  
  // PaymentController.handle3DSCallback'i direkt çağır
  const PaymentController = require('./payment/paymentController');
  PaymentController.handle3DSCallback(req, res);
});

// CORS ayarları - CSRF için X-New-CSRF-Token expose edilir
const corsOptions = {
  origin: isProduction
    ? function (origin, callback) {
        const allowedOrigins = [
          process.env.FRONTEND_URL,
          'https://üretimgo.com',
          'https://www.üretimgo.com',
          'https://xn--retimgo-m2a.com',
          'https://www.xn--retimgo-m2a.com'
        ].filter(Boolean);
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      }
    : 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-CSRF-Token',
    'CSRF-Token',
    'X-New-CSRF-Token'
  ],
  exposedHeaders: ['X-New-CSRF-Token'],
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Rate limit log fonksiyonu
function logRateLimit(req, key, message) {
  console.warn(`[RATE LIMIT] IP: ${req.ip} - Key: ${key} - Path: ${req.originalUrl} - Message: ${message}`);
}

// Rate limit middleware (Redis tabanlı)
const authRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 dakika
  max: 50, // 5 dakikada 50 istek (daha fazla)
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    message: 'Çok fazla istek yaptınız. Lütfen daha sonra tekrar deneyin.'
  },
  store: new RedisStore({
    sendCommand: async (...args) => redisClient.sendCommand(args)
  }),
  handler: (req, res, next, options) => {
    logRateLimit(req, req.ip, 'AUTH rate limit aşıldı');
    res.status(options.statusCode).json(options.message);
  }
});

const paymentRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 dakika
  max: 10, // 10 dakikada 10 istek
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    message: 'Çok fazla ödeme isteği. Lütfen daha sonra tekrar deneyin.'
  },
  store: new RedisStore({
    sendCommand: async (...args) => redisClient.sendCommand(args)
  }),
  handler: (req, res, next, options) => {
    logRateLimit(req, req.ip, 'PAYMENT rate limit aşıldı');
    res.status(options.statusCode).json(options.message);
  }
});

const inviteRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 saat
  max: 5, // 1 saatte 5 davet
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    message: 'Çok fazla davet isteği. Lütfen daha sonra tekrar deneyin.'
  },
  store: new RedisStore({
    sendCommand: async (...args) => redisClient.sendCommand(args)
  }),
  handler: (req, res, next, options) => {
    logRateLimit(req, req.ip, 'INVITE rate limit aşıldı');
    res.status(options.statusCode).json(options.message);
  }
});

const resetPasswordRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 dakika
  max: 5, // 10 dakikada 5 şifre sıfırlama
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    message: 'Çok fazla şifre sıfırlama isteği. Lütfen daha sonra tekrar deneyin.'
  },
  store: new RedisStore({
    sendCommand: async (...args) => redisClient.sendCommand(args)
  }),
  handler: (req, res, next, options) => {
    logRateLimit(req, req.ip, 'RESET PASSWORD rate limit aşıldı');
    res.status(options.statusCode).json(options.message);
  }
});

// Auth routes (CSRF koruması yok)
app.use('/api/auth', authRateLimiter, authRoutes);

// Public user routes (authentication gerekmez)
app.get('/api/user/check-invite', checkInvite);
app.post('/api/user/accept-invite', acceptInvite);

// Payment routes - authentication logic payment/routes.js'de
app.use('/api/payment', paymentRateLimiter, paymentRoutes);

// Davet (invite) endpointi için rate limit (userRoutes.js'de /invite)
app.use('/api/user/invite', inviteRateLimiter, userRoutes);

// Şifre sıfırlama endpointleri için rate limit
app.use('/api/auth/forgot-password', resetPasswordRateLimiter, authRoutes);
app.use('/api/auth/reset-password', resetPasswordRateLimiter, authRoutes);

// Diğer tüm route'lar için auth + CSRF koruması
app.use('/api/permissions', authenticateToken, csrfProtection, permissionRoutes);
app.use('/api/user', authenticateToken, csrfProtection, userRoutes);
app.use('/api/categories', authenticateToken, csrfProtection, categoryRoutes);
app.use('/api/products', authenticateToken, csrfProtection, productRoutes);
app.use('/api/product-steps', authenticateToken, csrfProtection, productStepsRoutes);
app.use('/api/customers', authenticateToken, csrfProtection, customerRoutes);
app.use('/api/orders', authenticateToken, csrfProtection, orderRoutes);
app.use('/api/my-jobs', authenticateToken, csrfProtection, myJobsRoutes);
app.use('/api/mcp', mcpRoutes);
app.use('/api/notifications', authenticateToken, csrfProtection, notificationRoutes);

// Admin routes - authentication ve CSRF koruması gerekli
app.use('/api/admin', authenticateSystemAdmin, adminRoutes);

// Token yönetim scheduler'ını başlat
// Sadece revoke et (önerilen)
startTokenCleanupScheduler();

// Sunucu başlatıldığında bir kere çalıştır (test amaçlı)
async function runInitialJobs() {
  await checkExpiredSubscriptions(); // Önce süresi bitenleri kontrol et
  await subscriptionReminderJob();   // Sonra hatırlatmaları yap
}

// İlk çalıştırma
runInitialJobs();

// Scheduler (her saat başı kontrol, sadece UTC 00:00'da hatırlatma)
cron.schedule('0 * * * *', async () => {
  await checkExpiredSubscriptions();
  const now = new Date();
  if (now.getUTCHours() === 0 && now.getUTCMinutes() === 0) {
    await subscriptionReminderJob();
  }
}, {
  timezone: 'UTC'
});

app.use('/api/reports', reportRoutes);

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
