const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Yardımcı: Query'den tarih aralığı al
function getDateRangeFromQuery(req) {
  const { startDate, endDate } = req.query;
  let range = {};
  if (startDate) range.gte = new Date(startDate);
  if (endDate) range.lte = new Date(endDate);
  return Object.keys(range).length > 0 ? range : undefined;
}

// Toplam kullanıcı ve sipariş sayısı
const getGeneralStats = async (req, res) => {
  try {
    const totalUsers = await prisma.user.count();
    const totalOrders = await prisma.orders.count();
    res.status(200).json({
      message: 'Genel istatistikler başarıyla getirildi.',
      data: { totalUsers, totalOrders }
    });
  } catch (error) {
    console.error('Genel istatistikler getirilirken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// Belirli tarih aralığında sipariş sayısı
const getOrderCountByDateRange = async (req, res) => {
  try {
    const createdAt = getDateRangeFromQuery(req);
    const where = createdAt ? { created_at: createdAt } : {};
    const count = await prisma.orders.count({ where });
    res.status(200).json({
      message: 'Belirtilen tarih aralığındaki sipariş sayısı getirildi.',
      data: { orderCount: count }
    });
  } catch (error) {
    console.error('Tarih aralığı sipariş sayısı hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// Son 7 günün sipariş sayısı (veya tarih aralığı)
const getLast7DaysOrderCount = async (req, res) => {
  try {
    let createdAt = getDateRangeFromQuery(req);
    if (!createdAt) {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      createdAt = { gte: sevenDaysAgo };
    }
    const count = await prisma.orders.count({ where: { created_at: createdAt } });
    res.status(200).json({
      message: 'Sipariş sayısı başarıyla getirildi.',
      data: { orderCount: count }
    });
  } catch (error) {
    console.error('Sipariş sayısı hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// En çok sipariş veren ilk 5 müşteri (tarih aralığı destekli)
const getTopCustomers = async (req, res) => {
  try {
    const createdAt = getDateRangeFromQuery(req);
    const where = createdAt ? { created_at: createdAt } : {};
    const topCustomers = await prisma.orders.groupBy({
      by: ['Customer_id'],
      _count: { id: true },
      where,
      orderBy: { _count: { id: 'desc' } },
      take: 5
    });
    // Müşteri isimlerini çek
    const customerIds = topCustomers.map(tc => tc.Customer_id);
    const customers = await prisma.customers.findMany({
      where: { id: { in: customerIds } },
      select: { id: true, Name: true }
    });
    const result = topCustomers.map(tc => ({
      customer: customers.find(c => c.id === tc.Customer_id),
      orderCount: tc._count.id
    }));
    res.status(200).json({
      message: 'En çok sipariş veren ilk 5 müşteri getirildi.',
      data: Array.isArray(result) ? result : []
    });
  } catch (error) {
    console.error('Top müşteriler hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// Aktif kullanıcı sayısı
const getActiveUsers = async (req, res) => {
  try {
    const count = await prisma.user.count({ where: { is_active: true } });
    res.status(200).json({
      message: 'Aktif kullanıcı sayısı başarıyla getirildi.',
      data: { activeUserCount: count }
    });
  } catch (error) {
    console.error('Aktif kullanıcı sayısı hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

module.exports = {
  getGeneralStats,
  getOrderCountByDateRange,
  getLast7DaysOrderCount,
  getTopCustomers,
  getActiveUsers
}; 