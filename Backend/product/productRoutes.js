const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../auth/middleware/authMiddleware');
const { requirePermission } = require('../permission/permissionMiddleware');
const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getProductsByCategory
} = require('./productController');

// Tüm route'lar için authentication gerekli
router.use(authenticateToken);

// Ürünleri listeleme - PRODUCT_READ yetkisi gerekli
router.get('/', requirePermission('PRODUCT_READ'), getProducts);

// Tek ürün getirme - PRODUCT_READ yetkisi gerekli
router.get('/:id', requirePermission('PRODUCT_READ'), getProductById);

// Kategoriye göre ürünleri getirme - PRODUCT_READ yetkisi gerekli
router.get('/category/:categoryId', requirePermission('PRODUCT_READ'), getProductsByCategory);

// Ürün oluşturma - PRODUCT_CREATE yetkisi gerekli
router.post('/', requirePermission('PRODUCT_CREATE'), createProduct);

// Ürün güncelleme - PRODUCT_UPDATE yetkisi gerekli
router.put('/:id', requirePermission('PRODUCT_UPDATE'), updateProduct);

// Ürün silme - PRODUCT_DELETE yetkisi gerekli
router.delete('/:id', requirePermission('PRODUCT_DELETE'), deleteProduct);

module.exports = router; 