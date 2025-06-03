const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../auth/middleware/authMiddleware');
const { requirePermission } = require('../permission/permissionMiddleware');
const {
  getGeneralStats,
  getOrderCountByDateRange,
  getLast7DaysOrderCount,
  getTopCustomers,
  getActiveUsers
} = require('./reportController');

// Genel istatistikler
router.get('/general-stats', authenticateToken, requirePermission('REPORT_READ'), getGeneralStats);
// Belirli tarih aralığında sipariş sayısı
router.get('/order-count-by-date', authenticateToken, requirePermission('REPORT_READ'), getOrderCountByDateRange);
// Son 7 günün veya verilen tarih aralığının sipariş sayısı
router.get('/last-7-days-orders', authenticateToken, requirePermission('REPORT_READ'), getLast7DaysOrderCount);
// En çok sipariş veren ilk 5 müşteri (tarih aralığı destekli)
router.get('/top-customers', authenticateToken, requirePermission('REPORT_READ'), getTopCustomers);
// Aktif kullanıcı sayısı
router.get('/active-users', authenticateToken, requirePermission('REPORT_READ'), getActiveUsers);

module.exports = router; 