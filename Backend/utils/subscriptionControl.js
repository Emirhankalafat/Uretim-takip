const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Süresi geçmiş abonelikleri kontrol eden ve basic'e döndüren fonksiyon
async function checkExpiredSubscriptions() {
  console.log('🔄 Süresi geçmiş abonelikler kontrol ediliyor -', new Date().toISOString());
  try {
    const now = new Date();
    
    // Trial veya premium üyeliği bitmiş şirketleri bul
    const expiredCompanies = await prisma.company.findMany({
      where: {
        Sub_end_time: {
          lt: now // Sub_end_time şimdiden küçükse (geçmişte kalmışsa)
        },
        Suspscription_package: {
          in: ["premium", "trial"] // Sadece premium ve trial paketleri
        }
      },
      select: {
        id: true,
        Name: true,
        Suspscription_package: true,
        Sub_end_time: true
      }
    });

    console.log(`📋 ${expiredCompanies.length} adet süresi geçmiş abonelik bulundu.`);

    // Her bir şirket için basic pakete geç
    for (const company of expiredCompanies) {
      console.log(`🏢 ${company.Name} şirketi için paket değişikliği yapılıyor (${company.Suspscription_package} -> basic)`);
      
      await prisma.company.update({
        where: {
          id: company.id
        },
        data: {
          Suspscription_package: "basic"
        }
      });

      console.log(`✅ ${company.Name} şirketi basic pakete geçirildi.`);
    }

    console.log('✅ Süresi geçmiş abonelik kontrolü tamamlandı.');
  } catch (err) {
    console.error('❌ Süresi geçmiş abonelik kontrol hatası:', err);
  }
}

module.exports = checkExpiredSubscriptions; 