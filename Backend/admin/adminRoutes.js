const express = require('express');
const router = express.Router();
const { authenticateSystemAdmin } = require('../auth/middleware/authMiddleware');

// CSRF token endpoint server.js'te ayrı olarak tanımlandı
const { 
  getAllUsers, 
  toggleUserActive, 
  getAllCompanies, 
  getSystemLogs, 
  getCompanyDetails, 
  updateCompanySubscription, 
  getSystemStats,
  createAnnouncement,
  getAllAnnouncements,
  updateAnnouncement,
  deleteAnnouncement,
  getAnnouncementById
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

// Duyuru yönetimi (Sadece admin panelinden)
router.post('/announcements', createAnnouncement);
router.get('/announcements', getAllAnnouncements);
router.get('/announcements/:announcementId(\\d+)', getAnnouncementById);
router.put('/announcements/:announcementId(\\d+)', updateAnnouncement);
router.delete('/announcements/:announcementId(\\d+)', deleteAnnouncement);

module.exports = router; 