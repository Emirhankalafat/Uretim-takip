const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../auth/middleware/authMiddleware');
const { requirePermission } = require('../permission/permissionMiddleware');
const {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer
} = require('./customerController');

// Tüm route'lar için authentication gerekli
router.use(authenticateToken);

// Müşterileri listeleme - CUSTOMER_READ yetkisi gerekli
router.get('/', requirePermission('CUSTOMER_READ'), getCustomers);

// Tek müşteri getirme - CUSTOMER_READ yetkisi gerekli
router.get('/:id', requirePermission('CUSTOMER_READ'), getCustomerById);

// Müşteri oluşturma - CUSTOMER_CREATE yetkisi gerekli
router.post('/', requirePermission('CUSTOMER_CREATE'), createCustomer);

// Müşteri güncelleme - CUSTOMER_UPDATE yetkisi gerekli
router.put('/:id', requirePermission('CUSTOMER_UPDATE'), updateCustomer);

// Müşteri silme - CUSTOMER_DELETE yetkisi gerekli
router.delete('/:id', requirePermission('CUSTOMER_DELETE'), deleteCustomer);

module.exports = router; 