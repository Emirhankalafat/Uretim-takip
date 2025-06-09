const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../auth/middleware/authMiddleware');
const { inviteUser, getInvites, getCompanyUsers, getSimpleCompanyUsers, getUserById, getAnnouncements, getAnnouncementById, getCompanyProfile, updateCompanyProfile } = require('./userController');

// SuperAdmin kullanıcı davet eder (authentication gerekli)
router.post('/invite', authenticateToken, inviteUser);

// SuperAdmin davetleri listeler (authentication gerekli)
router.get('/invites', authenticateToken, getInvites);

// Şirket kullanıcılarını listeler (authentication gerekli)
router.get('/company-users', authenticateToken, getCompanyUsers);

// Basit kullanıcı listesi (sadece id ve name) - authentication yeterli
router.get('/simple-users', authenticateToken, getSimpleCompanyUsers);

// Genel sistem duyurularını getir
router.get('/announcements', authenticateToken, getAnnouncements);

// Belirli bir duyurunun detayını getir (numeric ID kontrolü)
router.get('/announcements/:announcementId(\\d+)', authenticateToken, getAnnouncementById);

// Şirket profili yönetimi
router.get('/company/profile', authenticateToken, getCompanyProfile);
router.put('/company/profile', authenticateToken, updateCompanyProfile);

router.get('/:userId', authenticateToken, getUserById);

module.exports = router; 