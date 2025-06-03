const express = require('express');
const router = express.Router();
const { authenticateSystemAdmin } = require('../auth/middleware/authMiddleware');
const { 
  getAllUsers, 
  toggleUserActive, 
  getAllCompanies, 
  getSystemLogs, 
  getCompanyDetails, 
  updateCompanySubscription, 
  getSystemStats 
} = require('./adminController');

// Tüm admin routelar için önce admin authentication gerekli
router.use(authenticateSystemAdmin);

// Kullanıcı yönetimi
router.get('/users', getAllUsers);
router.put('/users/:userId/toggle-active', toggleUserActive);

// Şirket yönetimi
router.get('/companies', getAllCompanies);
router.get('/companies/:companyId', getCompanyDetails);
router.put('/companies/:companyId/subscription', updateCompanySubscription);

// Sistem logları
router.get('/logs', getSystemLogs);

// Sistem istatistikleri
router.get('/stats', getSystemStats);

module.exports = router; 