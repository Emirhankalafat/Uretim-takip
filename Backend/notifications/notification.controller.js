const notificationService = require('./notification.service');

// Get notifications for the logged-in user
const getUserNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id; // Assuming userId is available from auth middleware
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const result = await notificationService.getNotificationsByUserId(userId, page, limit);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// Mark a notification as read
const markAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const notificationId = BigInt(req.params.id);
    const notification = await notificationService.markNotificationAsRead(notificationId, userId);
    res.json(notification);
  } catch (error) {
    // Handle specific errors like 'Notification not found' if needed
    if (error.message.includes('Notification not found')) {
      return res.status(404).json({ message: error.message });
    }
    next(error);
  }
};

// Mark all notifications as read for the logged-in user
const markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await notificationService.markAllNotificationsAsRead(userId);
    res.json({ message: `Successfully marked ${result.count} notifications as read.` });
  } catch (error) {
    next(error);
  }
};

// Get unread notification count for the logged-in user
const getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const count = await notificationService.getUnreadNotificationCount(userId);
    res.json({ unreadCount: count });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
};
