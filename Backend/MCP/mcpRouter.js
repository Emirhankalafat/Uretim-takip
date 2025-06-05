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

// Gerekirse ileride:
// router.post('/orders/update', authenticateApiKey, mcpOrderController.updateOrder);
// router.post('/orders/delete', authenticateApiKey, mcpOrderController.deleteOrder);

module.exports = router;
