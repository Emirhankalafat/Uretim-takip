const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../auth/middleware/authMiddleware');
const { inviteUser, acceptInvite, getInvites, checkInvite, getCompanyUsers, getSimpleCompanyUsers } = require('./userController');

// SuperAdmin kullanıcı davet eder (authentication gerekli)
router.post('/invite', authenticateToken, inviteUser);

// Davet edilen kullanıcı daveti kabul eder (authentication gerekmez)
router.post('/accept-invite', acceptInvite);

// SuperAdmin davetleri listeler (authentication gerekli)
router.get('/invites', authenticateToken, getInvites);

// Davet kontrolü (authentication gerekmez)
router.get('/check-invite', checkInvite);

// Şirket kullanıcılarını listeler (authentication gerekli)
router.get('/company-users', authenticateToken, getCompanyUsers);

// Basit kullanıcı listesi (sadece id ve name) - authentication yeterli
router.get('/simple-users', authenticateToken, getSimpleCompanyUsers);

module.exports = router; 