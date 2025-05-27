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
require('dotenv').config();

// CORS ayarları
app.use(cors({
  origin: 'http://localhost:5173', // React app URL'i (Vite default port)
  credentials: true, // Cookie'leri kabul et
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json()); // JSON body parse
app.use(cookieParser()); // Cookie parse
app.use('/api/auth', authRoutes); // /api/auth altına yönlendir
app.use('/api/permissions', permissionRoutes); // /api/permissions altına yönlendir
app.use('/api/user', userRoutes); // /api/user altına yönlendir
app.use('/api/categories', categoryRoutes); // /api/categories altına yönlendir
app.use('/api/products', productRoutes); // /api/products altına yönlendir
app.use('/api/product-steps', productStepsRoutes); // /api/product-steps altına yönlendir

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server ${PORT} portunda çalışıyor.`);
});
