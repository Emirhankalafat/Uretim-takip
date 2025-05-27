const express = require('express');
const router = express.Router();
const { registerCompanyUser, confirmUser, loginUser, refreshAccessToken, logoutUser, getUserProfile, getDashboardProfile } = require('./authController');
const { authenticateToken } = require('./middleware/authMiddleware');

// POST /auth/register → yeni şirket + superadmin kullanıcı oluşturur
router.post('/register', registerCompanyUser);
router.get('/confirm', confirmUser);
router.post('/login', loginUser);
router.post('/refresh-token', refreshAccessToken);
router.post('/logout', logoutUser);
router.get('/profile', authenticateToken, getUserProfile);
router.get('/dashboard-profile', authenticateToken, getDashboardProfile);

module.exports = router;
