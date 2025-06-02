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
const cron = require('node-cron');
const subscriptionReminderJob = require('./utils/subscriptionReminder');
const checkExpiredSubscriptions = require('./utils/subscriptionControl');
require('dotenv').config();

// Production modunu kontrol et
const isProduction = process.env.NODE_ENV === 'production';

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
  
  console.log('=== İyzico Callback Debug ===');
  console.log('Origin:', req.headers.origin);
  console.log('User-Agent:', req.headers['user-agent']);
  console.log('Content-Type:', req.headers['content-type']);
  console.log('Body keys:', req.body ? Object.keys(req.body) : 'Body is null/undefined');
  console.log('Raw body:', req.body);
  
  // PaymentController.handle3DSCallback'i direkt çağır
  const PaymentController = require('./payment/paymentController');
  PaymentController.handle3DSCallback(req, res);
});

// CORS ayarları
if (isProduction) {
  // Production modda sadece aynı origin'den gelen istekleri kabul et
  app.use(cors({
    origin: function (origin, callback) {
      // Origin yoksa (same-origin requests) veya belirtilen URL'ler ise izin ver
      const allowedOrigins = [
        process.env.FRONTEND_URL,
        'https://üretimgo.com',
        'https://www.üretimgo.com',
        'https://xn--retimgo-m2a.com',  // Unicode domain encoding
        'https://www.xn--retimgo-m2a.com'
      ].filter(Boolean); // null/undefined değerleri filtrele
      
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log('❌ CORS blocked origin:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'CSRF-Token'],
    optionsSuccessStatus: 200 // IE11 için
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

// Auth routes (CSRF koruması yok)
app.use('/api/auth', authRoutes);

// Public user routes (authentication gerekmez)
app.get('/api/user/check-invite', checkInvite);
app.post('/api/user/accept-invite', acceptInvite);

// Payment routes - authentication logic payment/routes.js'de
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

// Sunucu başlatıldığında bir kere çalıştır (test amaçlı)
async function runInitialJobs() {
  await checkExpiredSubscriptions(); // Önce süresi bitenleri kontrol et
  await subscriptionReminderJob();   // Sonra hatırlatmaları yap
}

// İlk çalıştırma
runInitialJobs();

// Scheduler (her saat başı kontrol, sadece UTC 00:00'da hatırlatma)
cron.schedule('0 * * * *', async () => {
  console.log('🕐 Saatlik abonelik kontrolü başlatılıyor...');
  await checkExpiredSubscriptions();
  const now = new Date();
  if (now.getUTCHours() === 0 && now.getUTCMinutes() === 0) {
    console.log('🌅 UTC 00:00 - Günlük abonelik hatırlatması başlatılıyor...');
    await subscriptionReminderJob();
  }
}, {
  timezone: 'UTC'
});

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
