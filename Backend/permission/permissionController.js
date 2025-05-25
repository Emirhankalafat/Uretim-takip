const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Kullanıcıya permission ekleme
const addPermissionToUser = async (req, res) => {
  try {
    const { userId, permissionId } = req.body;

    if (!userId || !permissionId) {
      return res.status(400).json({ 
        message: 'Kullanıcı ID ve Permission ID gerekli.' 
      });
    }

    // Kullanıcının var olup olmadığını kontrol et
    const user = await prisma.user.findUnique({
      where: { id: BigInt(userId) },
      include: { company: true }
    });

    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
    }

    // GÜVENLİK KONTROLLERI
    // 1. SuperAdmin'e yetki ekleme yasağı (sadece SuperAdmin kendine ekleyebilir)
    if (user.is_SuperAdmin && !req.user.is_SuperAdmin) {
      return res.status(403).json({ 
        message: 'SuperAdmin kullanıcılara yetki ekleyemezsiniz.' 
      });
    }

    // 2. Kendi kendine yetki ekleme yasağı (sadece SuperAdmin kendine ekleyebilir)
    if (Number(userId) === req.user.id && !req.user.is_SuperAdmin) {
      return res.status(403).json({ 
        message: 'Kendinize yetki ekleyemezsiniz.' 
      });
    }

    // 3. USER_MANAGEMENT yetkisi olan kullanıcılara müdahale yasağı (sadece SuperAdmin yapabilir)
    if (!req.user.is_SuperAdmin) {
      const targetUserPermissions = await prisma.users_Permissions.findFirst({
        where: {
          User_id: BigInt(userId),
          permission: {
            Name: 'USER_MANAGEMENT'
          }
        }
      });

      if (targetUserPermissions) {
        return res.status(403).json({ 
          message: 'USER_MANAGEMENT yetkisi olan kullanıcılara yetki ekleyemezsiniz.' 
        });
      }
    }

    // Permission'ın var olup olmadığını kontrol et
    const permission = await prisma.permissions.findUnique({
      where: { id: BigInt(permissionId) }
    });

    if (!permission) {
      return res.status(404).json({ message: 'Permission bulunamadı.' });
    }

    // 4. USER_MANAGEMENT yetkisini sadece SuperAdmin verebilir
    if (permission.Name === 'USER_MANAGEMENT' && !req.user.is_SuperAdmin) {
      return res.status(403).json({ 
        message: 'USER_MANAGEMENT yetkisini sadece SuperAdmin verebilir.' 
      });
    }

    // Kullanıcının zaten bu permission'a sahip olup olmadığını kontrol et
    const existingPermission = await prisma.users_Permissions.findFirst({
      where: {
        User_id: BigInt(userId),
        Permission_id: BigInt(permissionId)
      }
    });

    if (existingPermission) {
      return res.status(400).json({ 
        message: 'Kullanıcı zaten bu yetkiye sahip.' 
      });
    }

    // Permission'ı kullanıcıya ekle
    const userPermission = await prisma.users_Permissions.create({
      data: {
        User_id: BigInt(userId),
        Permission_id: BigInt(permissionId)
      },
      include: {
        user: {
          select: { Name: true, Mail: true }
        },
        permission: {
          select: { Name: true, Type: true }
        }
      }
    });

    res.status(201).json({
      message: 'Permission başarıyla eklendi.',
      data: {
        user: userPermission.user,
        permission: userPermission.permission
      }
    });

  } catch (error) {
    console.error('Permission ekleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// Kullanıcıdan permission çıkarma
const removePermissionFromUser = async (req, res) => {
  try {
    const { userId, permissionId } = req.body;

    if (!userId || !permissionId) {
      return res.status(400).json({ 
        message: 'Kullanıcı ID ve Permission ID gerekli.' 
      });
    }

    // Hedef kullanıcının bilgilerini al
    const targetUser = await prisma.user.findUnique({
      where: { id: BigInt(userId) },
      select: { id: true, is_SuperAdmin: true, Name: true, Mail: true }
    });

    if (!targetUser) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
    }

    // GÜVENLİK KONTROLLERI
    // 1. SuperAdmin'den yetki çıkarma yasağı (sadece SuperAdmin kendinden çıkarabilir)
    if (targetUser.is_SuperAdmin && !req.user.is_SuperAdmin) {
      return res.status(403).json({ 
        message: 'SuperAdmin kullanıcılardan yetki çıkaramazsınız.' 
      });
    }

    // 2. Kendi kendinden yetki çıkarma yasağı (sadece SuperAdmin kendinden çıkarabilir)
    if (Number(userId) === req.user.id && !req.user.is_SuperAdmin) {
      return res.status(403).json({ 
        message: 'Kendinizden yetki çıkaramazsınız.' 
      });
    }

    // 3. USER_MANAGEMENT yetkisi olan kullanıcılardan yetki çıkarma yasağı (sadece SuperAdmin yapabilir)
    if (!req.user.is_SuperAdmin) {
      const targetUserPermissions = await prisma.users_Permissions.findFirst({
        where: {
          User_id: BigInt(userId),
          permission: {
            Name: 'USER_MANAGEMENT'
          }
        }
      });

      if (targetUserPermissions) {
        return res.status(403).json({ 
          message: 'USER_MANAGEMENT yetkisi olan kullanıcılardan yetki çıkaramazsınız.' 
        });
      }
    }

    // Permission'ın var olup olmadığını kontrol et
    const existingPermission = await prisma.users_Permissions.findFirst({
      where: {
        User_id: BigInt(userId),
        Permission_id: BigInt(permissionId)
      },
      include: {
        user: {
          select: { Name: true, Mail: true }
        },
        permission: {
          select: { Name: true, Type: true }
        }
      }
    });

    if (!existingPermission) {
      return res.status(404).json({ 
        message: 'Kullanıcının bu yetkisi bulunamadı.' 
      });
    }

    // 4. USER_MANAGEMENT yetkisini sadece SuperAdmin çıkarabilir
    if (existingPermission.permission.Name === 'USER_MANAGEMENT' && !req.user.is_SuperAdmin) {
      return res.status(403).json({ 
        message: 'USER_MANAGEMENT yetkisini sadece SuperAdmin çıkarabilir.' 
      });
    }

    // Permission'ı kullanıcıdan çıkar
    await prisma.users_Permissions.delete({
      where: {
        id: existingPermission.id
      }
    });

    res.status(200).json({
      message: 'Permission başarıyla çıkarıldı.',
      data: {
        user: existingPermission.user,
        permission: existingPermission.permission
      }
    });

  } catch (error) {
    console.error('Permission çıkarma hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// Kullanıcının permission'larını listeleme
const getUserPermissions = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: 'Kullanıcı ID gerekli.' });
    }

    // Eğer kullanıcı kendi yetkilerini görüyorsa izin ver
    // Başkasının yetkilerini görmek için USER_MANAGEMENT yetkisi gerekli
    if (Number(userId) !== req.user.id && !req.user.is_SuperAdmin) {
      // USER_MANAGEMENT yetkisi kontrolü
      const userPermissions = await prisma.users_Permissions.findFirst({
        where: {
          User_id: BigInt(req.user.id),
          permission: {
            Name: 'USER_MANAGEMENT'
          }
        }
      });

      if (!userPermissions) {
        return res.status(403).json({ 
          message: 'Başka kullanıcıların yetkilerini görmek için USER_MANAGEMENT yetkisi gerekli.' 
        });
      }
    }

    // Kullanıcının var olup olmadığını kontrol et
    const user = await prisma.user.findUnique({
      where: { id: BigInt(userId) },
      select: { 
        id: true, 
        Name: true, 
        Mail: true,
        company: {
          select: { Name: true }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
    }

    // Kullanıcının permission'larını getir
    const userPermissions = await prisma.users_Permissions.findMany({
      where: {
        User_id: BigInt(userId)
      },
      include: {
        permission: {
          select: { id: true, Name: true, Type: true }
        }
      }
    });

    // BigInt id'leri Number'a çevir
    const serializedUser = {
      ...user,
      id: Number(user.id)
    };

    const serializedPermissions = userPermissions.map(up => ({
      ...up.permission,
      id: Number(up.permission.id)
    }));

    res.status(200).json({
      message: 'Kullanıcı yetkileri başarıyla getirildi.',
      data: {
        user: serializedUser,
        permissions: serializedPermissions
      }
    });

  } catch (error) {
    console.error('Permission listeleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// Tüm permission'ları listeleme
const getAllPermissions = async (req, res) => {
  try {
    const permissions = await prisma.permissions.findMany({
      orderBy: { Name: 'asc' }
    });

    // BigInt id'leri Number'a çevir
    const serializedPermissions = permissions.map(permission => ({
      ...permission,
      id: Number(permission.id)
    }));

    res.status(200).json({
      message: 'Tüm yetkiler başarıyla getirildi.',
      data: serializedPermissions
    });

  } catch (error) {
    console.error('Permission listeleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// Şirketteki kullanıcıları listeleme (permission atamak için)
const getCompanyUsers = async (req, res) => {
  try {
    const companyId = req.user.company_id;

    const users = await prisma.user.findMany({
      where: {
        company_id: BigInt(companyId),
        is_active: true
      },
      select: {
        id: true,
        Name: true,
        Mail: true,
        is_SuperAdmin: true,
        permissions: {
          include: {
            permission: {
              select: { id: true, Name: true, Type: true }
            }
          }
        }
      },
      orderBy: { Name: 'asc' }
    });

    // BigInt id'leri Number'a çevir
    const serializedUsers = users.map(user => ({
      ...user,
      id: Number(user.id),
      permissions: user.permissions.map(up => ({
        ...up.permission,
        id: Number(up.permission.id)
      }))
    }));

    res.status(200).json({
      message: 'Şirket kullanıcıları başarıyla getirildi.',
      data: {
        users: serializedUsers
      }
    });

  } catch (error) {
    console.error('Şirket kullanıcıları listeleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

module.exports = {
  addPermissionToUser,
  removePermissionFromUser,
  getUserPermissions,
  getAllPermissions,
  getCompanyUsers
}; 