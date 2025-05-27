const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../auth/middleware/authMiddleware');
const { requirePermission } = require('../permission/permissionMiddleware');
const {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory
} = require('./categoryController');

// Tüm route'lar için authentication gerekli
router.use(authenticateToken);

// Kategorileri listeleme - CATEGORY_READ yetkisi gerekli
router.get('/', requirePermission('CATEGORY_READ'), getCategories);

// Tek kategori getirme - CATEGORY_READ yetkisi gerekli
router.get('/:id', requirePermission('CATEGORY_READ'), getCategoryById);

// Kategori oluşturma - CATEGORY_CREATE yetkisi gerekli
router.post('/', requirePermission('CATEGORY_CREATE'), createCategory);

// Kategori güncelleme - CATEGORY_UPDATE yetkisi gerekli
router.put('/:id', requirePermission('CATEGORY_UPDATE'), updateCategory);

// Kategori silme - CATEGORY_DELETE yetkisi gerekli
router.delete('/:id', requirePermission('CATEGORY_DELETE'), deleteCategory);

module.exports = router; 