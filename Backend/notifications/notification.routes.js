const express = require('express');
const router = express.Router();
const notificationController = require('./notification.controller');
const { authenticateToken } = require('../auth/middleware/authMiddleware'); // Path to your auth middleware
const { csrfProtection } = require('../auth/middleware/csrfMiddleware'); // Path to your CSRF middleware

// All notification routes require authentication
router.use(authenticateToken);
router.use(csrfProtection); // Apply CSRF protection if needed for these routes

// GET /api/notifications - Get all notifications for the logged-in user (paginated)
router.get('/', notificationController.getUserNotifications);

// GET /api/notifications/unread-count - Get the count of unread notifications
router.get('/unread-count', notificationController.getUnreadCount);

// POST /api/notifications/:id/read - Mark a specific notification as read
router.post('/:id/read', notificationController.markAsRead);

// POST /api/notifications/read-all - Mark all notifications as read
router.post('/read-all', notificationController.markAllAsRead);

module.exports = router;
