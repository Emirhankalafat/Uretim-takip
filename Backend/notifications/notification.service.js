const { PrismaClient, NotificationType } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Creates a new notification.
 * @param {object} data - Notification data.
 * @param {BigInt} data.userId - The ID of the user to notify.
 * @param {string} data.message - The notification message.
 * @param {NotificationType} data.type - The type of notification (e.g., INFO, WARNING).
 * @param {string} [data.linkTo] - Optional link for the notification.
 * @returns {Promise<object>} The created notification.
 */
const createNotification = async ({ userId, message, type, linkTo }) => {
  if (!userId || !message || !type) {
    throw new Error('User ID, message, and type are required to create a notification.');
  }

  // Validate NotificationType
  if (!Object.values(NotificationType).includes(type)) {
    throw new Error(`Invalid notification type: ${type}`);
  }

  return prisma.notification.create({
    data: {
      userId,
      message,
      type,
      linkTo,
    },
  });
};

/**
 * Creates notifications for multiple users (bulk operation).
 * @param {Array} notifications - Array of notification objects.
 * @returns {Promise<Array>} The created notifications.
 */
const createBulkNotifications = async (notifications) => {
  if (!Array.isArray(notifications) || notifications.length === 0) {
    throw new Error('Notifications array is required.');
  }

  // Validate each notification
  for (const notification of notifications) {
    if (!notification.userId || !notification.message || !notification.type) {
      throw new Error('Each notification must have userId, message, and type.');
    }
    if (!Object.values(NotificationType).includes(notification.type)) {
      throw new Error(`Invalid notification type: ${notification.type}`);
    }
  }

  return prisma.notification.createMany({
    data: notifications,
  });
};

/**
 * Sends notifications to users who are responsible for order processing.
 * @param {object} orderData - Order information.
 * @param {BigInt} orderData.orderId - The ID of the created order.
 * @param {string} orderData.orderNumber - The order number.
 * @param {string} orderData.customerName - Name of the customer (if applicable).
 * @param {BigInt} orderData.companyId - The company ID.
 * @param {boolean} orderData.isStock - Whether it's a stock order.
 * @returns {Promise<number>} Number of notifications sent.
 */
const notifyOrderResponsibles = async ({ orderId, orderNumber, customerName, companyId, isStock }) => {
  try {
    // Get all users who should be notified about new orders
    const responsibleUsers = await getOrderResponsibleUsers(companyId);
    
    if (responsibleUsers.length === 0) {
      console.log('No responsible users found for order notifications');
      return 0;
    }

    // Create notification message
    const orderType = isStock ? 'Stok Siparişi' : 'Müşteri Siparişi';
    const message = isStock 
      ? `Yeni ${orderType} oluşturuldu: ${orderNumber}`
      : `Yeni ${orderType} oluşturuldu: ${orderNumber} - Müşteri: ${customerName}`;

    // Create notifications for all responsible users
    const notifications = responsibleUsers.map(user => ({
      userId: user.id,
      message,
      type: NotificationType.NEW_ORDER,
      linkTo: `/orders/${orderId}`
    }));

    await createBulkNotifications(notifications);
    
    console.log(`Order notifications sent to ${responsibleUsers.length} users for order ${orderNumber}`);
    return responsibleUsers.length;
  } catch (error) {
    console.error('Error sending order notifications:', error);
    throw error;
  }
};

/**
 * Gets users who should be notified about new orders.
 * This includes users with ORDER_READ permission and order-related roles.
 * @param {BigInt} companyId - The company ID.
 * @returns {Promise<Array>} Array of users who should be notified.
 */
const getOrderResponsibleUsers = async (companyId) => {
  try {
    // Get users with ORDER_READ permission in the company
    const users = await prisma.user.findMany({
      where: {
        company_id: companyId,
        is_active: true, // Only active users
      },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });

    // Filter users who have ORDER_READ or ORDER_WRITE permissions
    const responsibleUsers = users.filter(user => {
      // SuperAdmins get notified
      if (user.is_SuperAdmin) return true;
      
      // Check if user has order-related permissions
      return user.permissions.some(userPerm => 
        ['ORDER_READ', 'ORDER_WRITE', 'ORDER_CREATE'].includes(userPerm.permission.name)
      );
    });

    return responsibleUsers.map(user => ({
      id: user.id, // Keep as BigInt for internal use
      name: user.Name,
      email: user.Mail
    }));
  } catch (error) {
    console.error('Error getting order responsible users:', error);
    throw error;
  }
};

/**
 * Sends notification when order status changes.
 * @param {object} data - Order status change data.
 * @param {BigInt} data.orderId - The order ID.
 * @param {string} data.orderNumber - The order number.
 * @param {string} data.oldStatus - Previous status.
 * @param {string} data.newStatus - New status.
 * @param {BigInt} data.companyId - Company ID.
 * @param {string} [data.customerName] - Customer name if applicable.
 * @returns {Promise<number>} Number of notifications sent.
 */
const notifyOrderStatusChange = async ({ orderId, orderNumber, oldStatus, newStatus, companyId, customerName }) => {
  try {
    const responsibleUsers = await getOrderResponsibleUsers(companyId);
    
    if (responsibleUsers.length === 0) {
      console.log('No responsible users found for order status notifications');
      return 0;
    }

    // Create status change message
    const statusMessages = {
      'PENDING': 'Beklemede',
      'IN_PROGRESS': 'İşleniyor',
      'COMPLETED': 'Tamamlandı',
      'CANCELLED': 'İptal Edildi',
      'ON_HOLD': 'Bekletiliyor'
    };

    const oldStatusText = statusMessages[oldStatus] || oldStatus;
    const newStatusText = statusMessages[newStatus] || newStatus;
    
    const message = customerName 
      ? `Sipariş durumu güncellendi: ${orderNumber} - ${oldStatusText} → ${newStatusText} (Müşteri: ${customerName})`
      : `Sipariş durumu güncellendi: ${orderNumber} - ${oldStatusText} → ${newStatusText}`;

    const notifications = responsibleUsers.map(user => ({
      userId: user.id,
      message,
      type: NotificationType.ORDER_STATUS_UPDATE,
      linkTo: `/orders/${orderId}`
    }));

    await createBulkNotifications(notifications);
    
    console.log(`Order status change notifications sent to ${responsibleUsers.length} users for order ${orderNumber}`);
    return responsibleUsers.length;
  } catch (error) {
    console.error('Error sending order status notifications:', error);
    throw error;
  }
};

/**
 * Gets notifications for a user, paginated, with unread first.
 * @param {BigInt} userId - The ID of the user.
 * @param {number} [page=1] - The page number for pagination.
 * @param {number} [limit=10] - The number of notifications per page.
 * @returns {Promise<object>} An object containing notifications and pagination info.
 */
const getNotificationsByUserId = async (userId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const [notifications, totalCount] = await prisma.$transaction([
    prisma.notification.findMany({
      where: { userId },
      orderBy: [
        { isRead: 'asc' }, // Unread first
        { createdAt: 'desc' }, // Then by newest
      ],
      skip,
      take: limit,
    }),
    prisma.notification.count({ where: { userId } }),
  ]);

  return {
    notifications,
    totalPages: Math.ceil(totalCount / limit),
    currentPage: page,
    totalCount,
  };
};

/**
 * Marks a specific notification as read.
 * @param {BigInt} notificationId - The ID of the notification.
 * @param {BigInt} userId - The ID of the user (to ensure ownership).
 * @returns {Promise<object>} The updated notification.
 */
const markNotificationAsRead = async (notificationId, userId) => {
  console.log(`[Notification Service] markAsRead - notificationId: ${notificationId}, userId: ${userId}`);
  
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  console.log(`[Notification Service] Found notification:`, notification ? {
    id: notification.id.toString(),
    userId: notification.userId.toString(),
    isRead: notification.isRead
  } : 'NOT FOUND');

  if (!notification) {
    throw new Error('Notification not found.');
  }

  // BigInt karşılaştırması için toString() kullan
  if (notification.userId.toString() !== userId.toString()) {
    console.warn(`[Notification Service] Permission denied - notification.userId: ${notification.userId}, requested userId: ${userId}`);
    throw new Error('User does not have permission for this notification.');
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });
};

/**
 * Marks all unread notifications for a user as read.
 * @param {BigInt} userId - The ID of the user.
 * @returns {Promise<object>} Batch payload containing the count of updated notifications.
 */
const markAllNotificationsAsRead = async (userId) => {
  return prisma.notification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: { isRead: true },
  });
};

/**
 * Gets the count of unread notifications for a user.
 * @param {BigInt} userId - The ID of the user.
 * @returns {Promise<number>} The count of unread notifications.
 */
const getUnreadNotificationCount = async (userId) => {
  return prisma.notification.count({
    where: {
      userId,
      isRead: false,
    },
  });
};

/**
 * Sends notification to assigned users when they get new tasks.
 * @param {object} data - Task assignment data.
 * @param {BigInt} data.orderId - The order ID.
 * @param {string} data.orderNumber - The order number.
 * @param {Array} data.assignedUserIds - Array of assigned user IDs.
 * @param {string} [data.customerName] - Customer name if applicable.
 * @param {boolean} [data.isStock] - Whether this is a stock order.
 * @returns {Promise<number>} Number of notifications sent.
 */
const notifyAssignedUsers = async ({ orderId, orderNumber, assignedUserIds, customerName, isStock }) => {
  try {
    if (!assignedUserIds || assignedUserIds.length === 0) {
      console.log('No assigned users found for task notifications');
      return 0;
    }

    // Unique user IDs only
    const uniqueUserIds = [...new Set(assignedUserIds)];
    
    const message = isStock 
      ? `Size yeni bir iş atandı: ${orderNumber} (Stok Siparişi)`
      : customerName 
        ? `Size yeni bir iş atandı: ${orderNumber} (Müşteri: ${customerName})`
        : `Size yeni bir iş atandı: ${orderNumber}`;

    const notifications = uniqueUserIds.map(userId => ({
      userId: BigInt(userId),
      message,
      type: NotificationType.TASK_ASSIGNED,
      linkTo: `/my-jobs`
    }));

    await createBulkNotifications(notifications);
    
    console.log(`Task assignment notifications sent to ${uniqueUserIds.length} users for order ${orderNumber}`);
    return uniqueUserIds.length;
  } catch (error) {
    console.error('Error sending task assignment notifications:', error);
    throw error;
  }
};

module.exports = {
  createNotification,
  createBulkNotifications,
  notifyOrderResponsibles,
  notifyOrderStatusChange,
  notifyAssignedUsers,
  getOrderResponsibleUsers,
  getNotificationsByUserId,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationCount,
  NotificationType, // Exporting for use in other services if needed
};
