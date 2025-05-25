const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const app = express();
const authRoutes = require('./auth/authRoutes');
const permissionRoutes = require('./permission/permissionRoutes');
require('dotenv').config();

// CORS ayarları
app.use(cors({
  origin: 'http://localhost:3000', // React app URL'i
  credentials: true, // Cookie'leri kabul et
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json()); // JSON body parse
app.use(cookieParser()); // Cookie parse
app.use('/api/auth', authRoutes); // /api/auth altına yönlendir
app.use('/api/permissions', permissionRoutes); // /api/permissions altına yönlendir

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server ${PORT} portunda çalışıyor.`);
});
