const express = require('express');
const router = express.Router();
const mcpOrderController = require('./mcpOrderController');
const { authenticateApiKey } = require('../auth/middleware/authMiddleware');

// Tüm MCP işlemlerinde API key zorunluluğu olacak
// API key doğrulaması, req.company objesini ekler

// Sipariş işlemleri
router.post('/orders/list', authenticateApiKey, mcpOrderController.getOrders);
router.post('/orders/get', authenticateApiKey, mcpOrderController.getOrderById);
router.post('/orders/create', authenticateApiKey, mcpOrderController.createOrder);
router.post('/orders/steps', authenticateApiKey, mcpOrderController.getOrderSteps);

// Müşteri işlemleri
router.post('/customers/list', authenticateApiKey, mcpOrderController.getCustomers);

// Kategori işlemleri
router.post('/categories/list', authenticateApiKey, mcpOrderController.getCategories);

// Ürün işlemleri
router.post('/products/list', authenticateApiKey, mcpOrderController.getProducts);

// Kullanıcı işlemleri
router.post('/users/list', authenticateApiKey, mcpOrderController.getUsers);

// Şirket işlemleri
router.post('/company/info', authenticateApiKey, mcpOrderController.getCompanyInfo);

// Gerekirse ileride:
// router.post('/orders/update', authenticateApiKey, mcpOrderController.updateOrder);
// router.post('/orders/delete', authenticateApiKey, mcpOrderController.deleteOrder);

module.exports = router;
