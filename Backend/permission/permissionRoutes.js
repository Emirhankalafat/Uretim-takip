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
  getCompanyUsers,
  updateCompanyName
} = require('./permissionController');

// Tüm permission'ları listeleme (kimlik doğrulama yeterli)
router.get('/permissions', authenticateToken, getAllPermissions);

// Kullanıcının kendi yetkilerini görme
router.get('/my-permissions', authenticateToken, (req, res) => {
  // req.user.id'yi params'a ekleyerek getUserPermissions'ı kullan
  req.params.userId = req.user.id.toString();
  getUserPermissions(req, res);
});

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

// Yeni: Kullanıcının permission'larını /permissions ile de görebilmek için
router.get('/user/:userId/permissions', 
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

// SuperAdmin için şirket ismi güncelleme
router.post('/update-company-name', authenticateToken, updateCompanyName);

module.exports = router; 