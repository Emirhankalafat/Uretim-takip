const express = require('express');
const router = express.Router();
const { registerCompanyUser, confirmUser, loginUser, refreshAccessToken, logoutUser, getUserProfile, getDashboardProfile, getCsrfTokenEndpoint, getAuthStatus, forgotPassword, verifyResetToken, resetPassword, adminLogin } = require('./authController');
const { authenticateToken } = require('./middleware/authMiddleware');

// POST /auth/register → yeni şirket + superadmin kullanıcı oluşturur
router.post('/register', registerCompanyUser);
router.get('/confirm', confirmUser);
router.post('/login', loginUser);
router.post('/admin-login', adminLogin);
router.post('/refresh-token', refreshAccessToken);
router.post('/logout', logoutUser);
router.get('/auth-status', authenticateToken, getAuthStatus);
router.get('/profile', authenticateToken, getUserProfile);
router.get('/dashboard-profile', authenticateToken, getDashboardProfile);
router.get('/csrf-token', authenticateToken, getCsrfTokenEndpoint);

// Password reset endpoints
router.post('/forgot-password', forgotPassword);
router.get('/verify-reset-token', verifyResetToken);
router.post('/reset-password', resetPassword);

module.exports = router;
