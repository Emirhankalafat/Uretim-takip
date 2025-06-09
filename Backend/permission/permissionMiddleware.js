const { getPrismaClient, checkPrismaClient } = require('../utils/prismaClient');

// Merkezi prisma client'ı al
const prisma = getPrismaClient();

// 1. SuperAdmin kontrolü middleware
const requireSuperAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Kimlik doğrulama gerekli.' });
    }

    if (!req.user.is_SuperAdmin) {
      return res.status(403).json({ message: 'Bu işlem için SuperAdmin yetkisi gerekli.' });
    }

    next();
  } catch (error) {
    console.error('SuperAdmin middleware hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// 2. Aynı şirket kontrolü middleware
const requireSameCompany = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Kimlik doğrulama gerekli.' });
    }

    // Eğer SuperAdmin ise tüm şirketlere erişebilir
    if (req.user.is_SuperAdmin) {
      return next();
    }

    // URL'den veya body'den target user id'sini al
    const targetUserId = req.params.userId || req.body.userId || req.body.User_id;
    
    if (!targetUserId) {
      return res.status(400).json({ message: 'Hedef kullanıcı ID\'si gerekli.' });
    }

    // Hedef kullanıcının şirket bilgisini al
    const targetUser = await prisma.user.findUnique({
      where: { id: BigInt(targetUserId) },
      select: { company_id: true }
    });

    if (!targetUser) {
      return res.status(404).json({ message: 'Hedef kullanıcı bulunamadı.' });
    }

    // Aynı şirkette olup olmadığını kontrol et
    if (Number(targetUser.company_id) !== req.user.company_id) {
      return res.status(403).json({ message: 'Farklı şirketteki kullanıcılara müdahale edemezsiniz.' });
    }

    next();
  } catch (error) {
    console.error('Same company middleware hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// 3. Permission kontrolü middleware
const requirePermission = (permissionName) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Kimlik doğrulama gerekli.' });
      }

      // SuperAdmin her şeyi yapabilir
      if (req.user.is_SuperAdmin) {
        return next();
      }

      // Kullanıcının tüm permission'larını kontrol et
      const userPermissions = await prisma.users_Permissions.findMany({
        where: {
          User_id: BigInt(req.user.id)
        },
        include: {
          permission: true
        }
      });

      if (!userPermissions || userPermissions.length === 0) {
        return res.status(403).json({ message: 'Bu işlem için yetkiniz bulunmuyor.' });
      }

      // Permission name veya type kontrolü
      const hasPermission = userPermissions.some(up => 
        up.permission.Name === permissionName || 
        up.permission.Type === permissionName
      );

      if (!hasPermission) {
        return res.status(403).json({ 
          message: `Bu işlem için '${permissionName}' yetkisi gerekli.` 
        });
      }

      next();
    } catch (error) {
      console.error('Permission middleware hatası:', error);
      res.status(500).json({ message: 'Sunucu hatası.' });
    }
  };
};

module.exports = {
  requireSuperAdmin,
  requireSameCompany,
  requirePermission
}; 