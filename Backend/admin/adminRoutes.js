const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../auth/middleware/authMiddleware');
const { getAllUsers, toggleUserActive, getAllCompanies, getSystemLogs } = require('./adminController');

// Tüm routelar için önce authentication gerekli
router.use(authenticateToken);

// Kullanıcı yönetimi
router.get('/users', getAllUsers);
router.put('/users/:userId/toggle-active', toggleUserActive);

// Şirket yönetimi
router.get('/companies', getAllCompanies);

// Sistem logları
router.get('/logs', getSystemLogs);

module.exports = router; 