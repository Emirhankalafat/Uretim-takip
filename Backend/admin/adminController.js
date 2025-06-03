const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const logger = require('../utils/logger');
const { logToDb } = require('../utils/logger');

// Tüm kullanıcıları listele (aktif/pasif durumu, rol bilgisi vs ile birlikte)
const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        Name: true,
        Mail: true,
        is_SuperAdmin: true,
        is_active: true,
        is_confirm: true,
        created_at: true,
        company: {
          select: {
            id: true,
            Name: true,
            Suspscription_package: true,
            Sub_end_time: true
          }
        },
        permissions: {
          select: {
            permission: {
              select: {
                id: true,
                Name: true,
                Type: true
              }
            }
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    // BigInt'leri stringe çevir
    const formattedUsers = users.map(user => ({
      ...user,
      id: user.id.toString(),
      company: {
        ...user.company,
        id: user.company.id.toString()
      },
      permissions: user.permissions.map(p => ({
        ...p.permission,
        id: p.permission.id.toString()
      }))
    }));

    res.status(200).json({
      message: 'Kullanıcılar başarıyla listelendi.',
      users: formattedUsers
    });
  } catch (error) {
    logger.error('Kullanıcı listeleme hatası:', error);
    await logToDb({
      type: 'error',
      message: 'Kullanıcı listeleme hatası',
      details: error.message,
      stack: error.stack,
      endpoint: '/admin/users',
      ip: req.ip,
      user_id: req.systemAdmin?.id || null
    });
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// Kullanıcı aktiflik durumunu değiştir
const toggleUserActive = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await prisma.user.findUnique({
      where: { id: BigInt(userId) }
    });

    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
    }

    // Kullanıcının aktiflik durumunu tersine çevir
    const updatedUser = await prisma.user.update({
      where: { id: BigInt(userId) },
      data: { is_active: !user.is_active },
      select: {
        id: true,
        Name: true,
        Mail: true,
        is_active: true
      }
    });

    res.status(200).json({
      message: `Kullanıcı ${updatedUser.is_active ? 'aktif' : 'pasif'} duruma getirildi.`,
      user: {
        ...updatedUser,
        id: updatedUser.id.toString()
      }
    });
  } catch (error) {
    logger.error('Kullanıcı aktiflik değiştirme hatası:', error);
    await logToDb({
      type: 'error',
      message: 'Kullanıcı aktiflik değiştirme hatası',
      details: error.message,
      stack: error.stack,
      endpoint: `/admin/users/${req.params.userId}/toggle-active`,
      ip: req.ip,
      user_id: req.systemAdmin?.id || null
    });
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// Tüm şirketleri listele
const getAllCompanies = async (req, res) => {
  try {
    const companies = await prisma.company.findMany({
      include: {
        users: {
          select: {
            id: true,
            Name: true,
            Mail: true,
            is_SuperAdmin: true,
            is_active: true
          }
        },
        _count: {
          select: {
            users: true,
            products: true,
            orders: true
          }
        }
      },
      orderBy: { Created_At: 'desc' }
    });

    // BigInt'leri stringe çevir
    const formattedCompanies = companies.map(company => ({
      ...company,
      id: company.id.toString(),
      users: company.users.map(user => ({
        ...user,
        id: user.id.toString()
      }))
    }));

    res.status(200).json({
      message: 'Şirketler başarıyla listelendi.',
      companies: formattedCompanies
    });
  } catch (error) {
    logger.error('Şirket listeleme hatası:', error);
    await logToDb({
      type: 'error',
      message: 'Şirket listeleme hatası',
      details: error.message,
      stack: error.stack,
      endpoint: '/admin/companies',
      ip: req.ip,
      user_id: req.systemAdmin?.id || null
    });
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// Sistem loglarını listele (yeni SystemLog tablosu)
const getSystemLogs = async (req, res) => {
  try {
    const { startDate, endDate, type, user_id, endpoint, search } = req.query;
    let whereClause = {};
    if (type) whereClause.type = type;
    if (user_id) whereClause.user_id = BigInt(user_id);
    if (endpoint) whereClause.endpoint = { contains: endpoint, mode: 'insensitive' };
    if (startDate || endDate) {
      whereClause.created_at = {};
      if (startDate) whereClause.created_at.gte = new Date(startDate);
      if (endDate) whereClause.created_at.lte = new Date(endDate);
    }
    if (search) {
      whereClause.OR = [
        { message: { contains: search, mode: 'insensitive' } },
        { details: { contains: search, mode: 'insensitive' } }
      ];
    }
    const logs = await prisma.systemLog.findMany({
      where: whereClause,
      include: {
        user: {
          select: { id: true, Name: true, Mail: true }
        }
      },
      orderBy: { created_at: 'desc' },
      take: 200 // max 200 log
    });
    const formattedLogs = logs.map(log => ({
      ...log,
      id: log.id.toString(),
      user_id: log.user_id ? log.user_id.toString() : null,
      user: log.user ? { ...log.user, id: log.user.id.toString() } : null
    }));
    res.status(200).json({
      message: 'Sistem logları başarıyla listelendi.',
      logs: formattedLogs
    });
  } catch (error) {
    logger.error('Log listeleme hatası:', error);
    await logToDb({
      type: 'error',
      message: 'Log listeleme hatası',
      details: error.message,
      stack: error.stack,
      endpoint: '/admin/logs',
      ip: req.ip,
      user_id: req.systemAdmin?.id || null
    });
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// Şirket detaylarını görüntüle
const getCompanyDetails = async (req, res) => {
  try {
    const { companyId } = req.params;
    
    const company = await prisma.company.findUnique({
      where: { id: BigInt(companyId) },
      include: {
        users: {
          select: {
            id: true,
            Name: true,
            Mail: true,
            is_SuperAdmin: true,
            is_active: true,
            is_confirm: true,
            created_at: true
          }
        },
        products: {
          select: {
            id: true,
            name: true,
            description: true
          },
          take: 10 // Son 10 ürün
        },
        orders: {
          select: {
            id: true,
            order_number: true,
            status: true,
            priority: true,
            deadline: true,
            created_at: true
          },
          orderBy: { created_at: 'desc' },
          take: 10 // Son 10 sipariş
        },
        _count: {
          select: {
            users: true,
            products: true,
            orders: true,
            categories: true,
            customers: true
          }
        }
      }
    });

    if (!company) {
      return res.status(404).json({ message: 'Şirket bulunamadı.' });
    }

    // BigInt'leri stringe çevir
    const formattedCompany = {
      ...company,
      id: company.id.toString(),
      users: company.users.map(user => ({
        ...user,
        id: user.id.toString()
      })),
      products: company.products.map(product => ({
        ...product,
        id: product.id.toString()
      })),
      orders: company.orders.map(order => ({
        ...order,
        id: order.id.toString()
      }))
    };

    res.status(200).json({
      message: 'Şirket detayları başarıyla getirildi.',
      company: formattedCompany
    });
  } catch (error) {
    logger.error('Şirket detayı getirme hatası:', error);
    await logToDb({
      type: 'error',
      message: 'Şirket detayı getirme hatası',
      details: error.message,
      stack: error.stack,
      endpoint: `/admin/companies/${req.params.companyId}`,
      ip: req.ip,
      user_id: req.systemAdmin?.id || null
    });
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// Şirket aboneliğini güncelle
const updateCompanySubscription = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { subscriptionPackage, endDate, maxUser } = req.body;
    
    if (!subscriptionPackage || !endDate || !maxUser) {
      return res.status(400).json({ message: 'Abonelik paketi, bitiş tarihi ve maksimum kullanıcı sayısı gereklidir.' });
    }

    const company = await prisma.company.findUnique({
      where: { id: BigInt(companyId) }
    });

    if (!company) {
      return res.status(404).json({ message: 'Şirket bulunamadı.' });
    }

    const updatedCompany = await prisma.company.update({
      where: { id: BigInt(companyId) },
      data: { 
        Suspscription_package: subscriptionPackage,
        Sub_end_time: new Date(endDate),
        Max_User: parseInt(maxUser)
      }
    });

    res.status(200).json({
      message: 'Şirket aboneliği başarıyla güncellendi.',
      company: {
        ...updatedCompany,
        id: updatedCompany.id.toString()
      }
    });
  } catch (error) {
    logger.error('Şirket aboneliği güncelleme hatası:', error);
    await logToDb({
      type: 'error',
      message: 'Şirket aboneliği güncelleme hatası',
      details: error.message,
      stack: error.stack,
      endpoint: `/admin/companies/${req.params.companyId}/subscription`,
      ip: req.ip,
      user_id: req.systemAdmin?.id || null
    });
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// Sistem istatistiklerini görüntüle
const getSystemStats = async (req, res) => {
  try {
    // Toplam şirket sayısı
    const totalCompanies = await prisma.company.count();
    
    // Toplam kullanıcı sayısı
    const totalUsers = await prisma.user.count();
    
    // Aktif kullanıcı sayısı
    const activeUsers = await prisma.user.count({
      where: { is_active: true }
    });
    
    // Toplam sipariş sayısı
    const totalOrders = await prisma.orders.count();
    
    // Son 30 günde oluşturulan şirket sayısı
    const newCompanies = await prisma.company.count({
      where: {
        Created_At: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      }
    });
    
    // Son 30 günde oluşturulan kullanıcı sayısı
    const newUsers = await prisma.user.count({
      where: {
        created_at: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      }
    });

    // Abonelik paketlerine göre şirket dağılımı
    const subscriptionStats = await prisma.company.groupBy({
      by: ['Suspscription_package'],
      _count: {
        id: true
      }
    });

    // Aboneliği yakında bitecek şirketler (30 gün içinde)
    const expiringSubscriptions = await prisma.company.count({
      where: {
        Sub_end_time: {
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      }
    });

    res.status(200).json({
      message: 'Sistem istatistikleri başarıyla getirildi.',
      stats: {
        totalCompanies,
        totalUsers,
        activeUsers,
        totalOrders,
        newCompanies,
        newUsers,
        subscriptionStats,
        expiringSubscriptions
      }
    });
  } catch (error) {
    logger.error('Sistem istatistikleri getirme hatası:', error);
    await logToDb({
      type: 'error',
      message: 'Sistem istatistikleri getirme hatası',
      details: error.message,
      stack: error.stack,
      endpoint: '/admin/stats',
      ip: req.ip,
      user_id: req.systemAdmin?.id || null
    });
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};


module.exports = {
  getAllUsers,
  toggleUserActive,
  getAllCompanies,
  getSystemLogs,
  getCompanyDetails,
  updateCompanySubscription,
  getSystemStats
};
