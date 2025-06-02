const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { sendSubscriptionReminderEmail } = require('../auth/utils/emailUtils');

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
      
      // Şirketin superadminini bul
      console.log(`👤 ${company.Name} için superadmin aranıyor...`);
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
        console.log(`📧 ${company.Name} şirketi için ${superadmin.Mail} adresine üyelik bitti maili gönderiliyor...`);
        await sendSubscriptionReminderEmail(
          superadmin.Mail,
          superadmin.Name || '',
          company.Name || '',
          0, // 0 gün kaldı = bitti
          company.Sub_end_time
        );
        console.log(`✅ ${company.Name} için üyelik bitti maili gönderildi.`);
      } else {
        console.log(`⚠️ ${company.Name} için superadmin bulunamadı!`);
      }

      console.log(`✅ ${company.Name} şirketi basic pakete geçirildi.`);
    }

    console.log('✅ Süresi geçmiş abonelik kontrolü tamamlandı.');
  } catch (err) {
    console.error('❌ Süresi geçmiş abonelik kontrol hatası:', err);
  }
}

module.exports = checkExpiredSubscriptions; 