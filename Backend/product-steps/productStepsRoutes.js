const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../auth/middleware/authMiddleware');
const { requirePermission } = require('../permission/permissionMiddleware');
const {
  createProductStep,
  getProductSteps,
  getStepsByProduct,
  getProductStepById,
  updateProductStep,
  deleteProductStep,
  reorderProductSteps
} = require('./productStepsController');

// Tüm route'lar için authentication gerekli
router.use(authenticateToken);

// Ürün adımlarını listeleme - PRODUCT_STEP_READ yetkisi gerekli
router.get('/', requirePermission('PRODUCT_STEP_READ'), getProductSteps);

// Belirli ürünün adımlarını getirme - PRODUCT_STEP_READ yetkisi gerekli
router.get('/product/:productId', requirePermission('PRODUCT_STEP_READ'), getStepsByProduct);

// Tek adım getirme - PRODUCT_STEP_READ yetkisi gerekli
router.get('/:id', requirePermission('PRODUCT_STEP_READ'), getProductStepById);

// Ürün adımı oluşturma - PRODUCT_STEP_CREATE yetkisi gerekli
router.post('/', requirePermission('PRODUCT_STEP_CREATE'), createProductStep);

// Ürün adımı güncelleme - PRODUCT_STEP_UPDATE yetkisi gerekli
router.put('/:id', requirePermission('PRODUCT_STEP_UPDATE'), updateProductStep);

// Ürün adımı silme - PRODUCT_STEP_DELETE yetkisi gerekli
router.delete('/:id', requirePermission('PRODUCT_STEP_DELETE'), deleteProductStep);

// Adım sırasını güncelleme - PRODUCT_STEP_UPDATE yetkisi gerekli
router.put('/product/:productId/reorder', requirePermission('PRODUCT_STEP_UPDATE'), reorderProductSteps);

module.exports = router; 