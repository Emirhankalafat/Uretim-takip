const express = require('express');
const router = express.Router();
const notificationController = require('./notification.controller');
const { authenticateToken } = require('../auth/middleware/authMiddleware'); // Path to your auth middleware
const { csrfProtection } = require('../auth/middleware/csrfMiddleware'); // Path to your CSRF middleware

// All notification routes require authentication
router.use(authenticateToken);

// GET routes (CSRF koruması gerekmez)
router.get('/', notificationController.getUserNotifications);
router.get('/unread-count', notificationController.getUnreadCount);

// POST routes for read operations (CSRF koruması gerekmez - güvenlik açısından kritik değil)
router.post('/:id/read', notificationController.markAsRead);
router.post('/read-all', notificationController.markAllAsRead);

module.exports = router;
