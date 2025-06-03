const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { sendSubscriptionReminderEmail } = require('../auth/utils/emailUtils');

// Her gün çalışacak abonelik hatırlatma fonksiyonu
async function subscriptionReminderJob() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Sadece aktif premium şirketleri çek (süresi bitmemiş olanlar)
    const companies = await prisma.company.findMany({
      where: {
        Suspscription_package: "premium",
        Sub_end_time: {
          gt: today // Sadece süresi bugünden büyük olanlar (bitmemiş olanlar)
        }
      },
      select: {
        id: true,
        Name: true,
        Sub_end_time: true
      }
    });

    for (const company of companies) {
      if (!company.Sub_end_time) continue;
      const endDate = new Date(company.Sub_end_time);
      endDate.setHours(0, 0, 0, 0);
      const diffTime = endDate.getTime() - today.getTime();
      const daysLeft = Math.round(diffTime / (1000 * 60 * 60 * 24));
      
      // Sadece 7, 3 ve 1 gün kaldığında hatırlat
      if (![7, 3, 1].includes(daysLeft)) continue;

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
      if (!superadmin) {
        continue;
      }

      // Mail gönder
      await sendSubscriptionReminderEmail(
        superadmin.Mail,
        superadmin.Name || '',
        company.Name || '',
        daysLeft,
        endDate
      );
    }
  } catch (err) {
    console.error('❌ Abonelik hatırlatma scheduler hatası:', err);
  }
}

module.exports = subscriptionReminderJob; 