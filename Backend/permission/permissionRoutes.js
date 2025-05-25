const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../auth/middleware/authMiddleware');
const { 
  requireSuperAdmin, 
  requireSameCompany, 
  requirePermission 
} = require('./permissionMiddleware');
const {
  addPermissionToUser,
  removePermissionFromUser,
  getUserPermissions,
  getAllPermissions,
  getCompanyUsers
} = require('./permissionController');

// Tüm permission'ları listeleme (kimlik doğrulama yeterli)
router.get('/permissions', authenticateToken, getAllPermissions);

// Şirketteki kullanıcıları listeleme (USER_MANAGEMENT yetkisi gerekli)
router.get('/company-users', 
  authenticateToken, 
  requirePermission('USER_MANAGEMENT'), 
  getCompanyUsers
);

// Kullanıcının permission'larını görme (aynı şirket kontrolü)
router.get('/user/:userId', 
  authenticateToken, 
  requireSameCompany, 
  getUserPermissions
);

// Kullanıcıya permission ekleme (aynı şirket + permission kontrolü)
router.post('/add-permission', 
  authenticateToken, 
  requireSameCompany, 
  requirePermission('USER_MANAGEMENT'), 
  addPermissionToUser
);

// Kullanıcıdan permission çıkarma (aynı şirket + permission kontrolü)
router.post('/remove-permission', 
  authenticateToken, 
  requireSameCompany, 
  requirePermission('USER_MANAGEMENT'), 
  removePermissionFromUser
);

module.exports = router; 