const { revokeExpiredTokens, deleteOldRevokedTokens } = require('./tokenUtils');

// Her 24 saatte bir süresi dolmuş token'ları revoke et
const startTokenCleanupScheduler = (options = {}) => {
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000; // 24 saat milisaniye cinsinden
  const { deleteOldTokens = false, oldTokenDays = 30 } = options;
  
  // İlk çalıştırma
  revokeExpiredTokens().then((result) => {
    console.log('Token revoke işlemi başlatıldı, güncellenen kayıt sayısı:', result.count);
  }).catch(error => {
    console.error('Token revoke hatası:', error);
  });
  
  // Her 24 saatte bir çalıştır
  setInterval(async () => {
    try {
      // Süresi dolmuş token'ları revoke et
      const revokeResult = await revokeExpiredTokens();
      console.log('Süresi dolmuş token\'lar revoke edildi, sayı:', revokeResult.count);
      
      // İsteğe bağlı: Eski revoke edilmiş token'ları sil
      if (deleteOldTokens) {
        const deleteResult = await deleteOldRevokedTokens(oldTokenDays);
        console.log(`${oldTokenDays} gün önceki revoke edilmiş token'lar silindi, sayı:`, deleteResult.count);
      }
    } catch (error) {
      console.error('Scheduled token işlemi hatası:', error);
    }
  }, TWENTY_FOUR_HOURS);
};

module.exports = { startTokenCleanupScheduler }; 