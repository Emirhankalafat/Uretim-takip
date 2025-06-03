const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { sendSubscriptionReminderEmail } = require('../auth/utils/emailUtils');

// Süresi geçmiş abonelikleri kontrol eden ve basic'e döndüren fonksiyon
async function checkExpiredSubscriptions() {
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

    // Her bir şirket için basic pakete geç
    for (const company of expiredCompanies) {
      // Şirketin superadminini bul
      const superadmin = await prisma.user.findFirst({
        where: {
          company_id: company.id,
          is_SuperAdmin: true,
          is_active: true
        },
        select: {
          Mail: true,
          Name: true
        }
      });

      // Paketi basic'e çevir
      await prisma.company.update({
        where: {
          id: company.id
        },
        data: {
          Suspscription_package: "basic"
        }
      });

      // Superadmin varsa üyelik bitti maili gönder
      if (superadmin) {
        await sendSubscriptionReminderEmail(
          superadmin.Mail,
          superadmin.Name || '',
          company.Name || '',
          0, // 0 gün kaldı = bitti
          company.Sub_end_time
        );
      }
    }
  } catch (err) {
    console.error('❌ Süresi geçmiş abonelik kontrol hatası:', err);
  }
}

module.exports = checkExpiredSubscriptions; 