const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { sendSubscriptionReminderEmail } = require('../auth/utils/emailUtils');

// Her gün çalışacak abonelik hatırlatma fonksiyonu
async function subscriptionReminderJob() {
  console.log('🔄 Subscription reminder job başlatıldı -', new Date().toISOString());
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Sadece premium şirketleri çek
    console.log('📋 Premium şirketler sorgulanıyor...');
    const companies = await prisma.company.findMany({
      where: {
        Suspscription_package: "premium",
        Sub_end_time: {
          not: undefined
        }
      },
      select: {
        id: true,
        Name: true,
        Sub_end_time: true
      }
    });
    console.log(`✅ ${companies.length} adet premium şirket bulundu.`);

    for (const company of companies) {
      if (!company.Sub_end_time) continue;
      const endDate = new Date(company.Sub_end_time);
      endDate.setHours(0, 0, 0, 0);
      const diffTime = endDate.getTime() - today.getTime();
      const daysLeft = Math.round(diffTime / (1000 * 60 * 60 * 24));
      
      console.log(`🏢 Şirket: ${company.Name}, Kalan Gün: ${daysLeft}`);
      
      if (![7, 3, 0].includes(daysLeft)) continue;

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
      if (!superadmin) {
        console.log(`⚠️ ${company.Name} için superadmin bulunamadı!`);
        continue;
      }

      // Mail gönder
      console.log(`📧 ${company.Name} şirketi için ${superadmin.Mail} adresine hatırlatma maili gönderiliyor...`);
      await sendSubscriptionReminderEmail(
        superadmin.Mail,
        superadmin.Name || '',
        company.Name || '',
        daysLeft,
        endDate
      );
      console.log(`✅ ${company.Name} için mail gönderildi.`);
    }
    console.log('✅ Subscription reminder job başarıyla tamamlandı.');
  } catch (err) {
    console.error('❌ Abonelik hatırlatma scheduler hatası:', err);
  }
}

module.exports = subscriptionReminderJob; 