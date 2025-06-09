const { PrismaClient } = require('@prisma/client');

// Singleton Prisma Client
let prisma = null;

const getPrismaClient = () => {
  if (!prisma) {
    try {
      // Log level'ı daha akıllı ayarla
      const logLevel = process.env.PRISMA_LOG_LEVEL || 
                      (process.env.NODE_ENV === 'production' ? 'error' : 'warn');
      
      prisma = new PrismaClient({
        log: [
          { emit: 'event', level: 'query' },
          { emit: 'stdout', level: 'error' },
          { emit: 'stdout', level: 'warn' }
        ],
        datasources: {
          db: {
            url: process.env.DATABASE_URL
          }
        }
      });
      
      // Sadece yavaş sorguları logla (development'ta)
      if (process.env.NODE_ENV === 'development') {
        prisma.$on('query', (e) => {
          const duration = e.duration;
          
          // Sadece 500ms'den uzun sorguları logla
          if (duration > 500) {
            const queryPreview = e.query.substring(0, 80).replace(/\s+/g, ' ');
            console.warn(`🐌 Slow query: ${duration}ms - ${queryPreview}...`);
          }
          
          // Çok yavaş sorguları (2s+) detaylı logla
          if (duration > 2000) {
            console.error(`🚨 Very slow query: ${duration}ms`);
            console.error(`Query: ${e.query}`);
            console.error(`Params: ${JSON.stringify(e.params)}`);
          }
        });
      }
      
      console.log('✅ Prisma client başarıyla oluşturuldu');
    } catch (error) {
      console.error('❌ Prisma client oluşturulurken hata:', error);
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