const { PrismaClient } = require('@prisma/client');

// Singleton Prisma Client
let prisma = null;

const getPrismaClient = () => {
  if (!prisma) {
    try {
      prisma = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
      });
      console.log('Prisma client başarıyla oluşturuldu');
    } catch (error) {
      console.error('Prisma client oluşturulurken hata:', error);
      throw error;
    }
  }
  return prisma;
};

// Prisma client kontrolü ve hata yönetimi
const checkPrismaClient = (prismaInstance) => {
  if (!prismaInstance) {
    console.error('Prisma client bulunamadı');
    throw new Error('Veritabanı bağlantı hatası');
  }
  return true;
};

// Graceful shutdown için
const disconnectPrisma = async () => {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
    console.log('Prisma client bağlantısı kapatıldı');
  }
};

module.exports = {
  getPrismaClient,
  checkPrismaClient,
  disconnectPrisma
}; 