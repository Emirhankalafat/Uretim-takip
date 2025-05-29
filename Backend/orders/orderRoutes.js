const express = require('express');
const router = express.Router();
const { requirePermission } = require('../permission/permissionMiddleware');
const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
  getProductStepsTemplate
} = require('./orderController');

// Siparişleri listeleme - ORDER_READ yetkisi gerekli
router.get('/', requirePermission('ORDER_READ'), getOrders);

// Tek sipariş getirme - ORDER_READ yetkisi gerekli
router.get('/:id', requirePermission('ORDER_READ'), getOrderById);

// Product steps şablon getirme - ORDER_CREATE yetkisi gerekli
router.get('/product-steps-template/:productId', requirePermission('ORDER_CREATE'), getProductStepsTemplate);

// Sipariş oluşturma - ORDER_CREATE yetkisi gerekli
router.post('/', requirePermission('ORDER_CREATE'), createOrder);

// Sipariş güncelleme - ORDER_UPDATE yetkisi gerekli
router.put('/:id', requirePermission('ORDER_UPDATE'), updateOrder);

// Sipariş silme - ORDER_DELETE yetkisi gerekli
router.delete('/:id', requirePermission('ORDER_DELETE'), deleteOrder);

module.exports = router; 