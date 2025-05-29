const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
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
const { startTokenCleanupScheduler } = require('./auth/utils/scheduler');
const { authenticateToken } = require('./auth/middleware/authMiddleware');
const { csrfProtection } = require('./auth/middleware/csrfMiddleware');
const { connectRedis } = require('./config/redis');
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
app.use(cookieParser()); // Cookie parse

// Production modda statik dosyaları serve et
if (isProduction) {
  // Frontend build dosyalarını serve et
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
}

// Auth routes (CSRF koruması yok)
app.use('/api/auth', authRoutes);

// Diğer tüm route'lar için auth + CSRF koruması
app.use('/api/permissions', authenticateToken, csrfProtection, permissionRoutes);
app.use('/api/user', authenticateToken, csrfProtection, userRoutes);
app.use('/api/categories', authenticateToken, csrfProtection, categoryRoutes);
app.use('/api/products', authenticateToken, csrfProtection, productRoutes);
app.use('/api/product-steps', authenticateToken, csrfProtection, productStepsRoutes);
app.use('/api/customers', authenticateToken, csrfProtection, customerRoutes);
app.use('/api/orders', authenticateToken, csrfProtection, orderRoutes);
app.use('/api/my-jobs', authenticateToken, csrfProtection, myJobsRoutes);

// Production modda tüm diğer route'ları React app'e yönlendir (SPA routing için)
if (isProduction) {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
}

// Token yönetim scheduler'ını başlat
// Sadece revoke et (önerilen)
startTokenCleanupScheduler();

// Alternatif: Eski token'ları da sil (30+ gün önceki revoke edilmiş token'lar)
// startTokenCleanupScheduler({ deleteOldTokens: true, oldTokenDays: 30 });

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
        console.log(`🌐 Production modda çalışıyor - Statik dosyalar serve ediliyor`);
        console.log(`🔗 Uygulama: http://localhost:${PORT}`);
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
