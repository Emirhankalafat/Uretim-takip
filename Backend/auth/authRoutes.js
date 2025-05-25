const express = require('express');
const router = express.Router();
const { registerCompanyUser, confirmUser, loginUser, logoutUser, getUserProfile } = require('./authController');
const { authenticateToken } = require('./middleware/authMiddleware');

// POST /auth/register → yeni şirket + superadmin kullanıcı oluşturur
router.post('/register', registerCompanyUser);
router.get('/confirm', confirmUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.get('/profile', authenticateToken, getUserProfile);

module.exports = router;
