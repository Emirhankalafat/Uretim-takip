const { createCsrfToken, verifyCsrfToken, refreshCsrfToken, deleteCsrfToken, getCsrfToken } = require('./auth/utils/csrfUtils');
const { disconnectRedis } = require('./config/redis');

async function testCsrfSystem() {
  console.log('🔒 CSRF Token Sistemi Test Ediliyor...\n');

  const testUserId = 123;

  try {
    // 1. CSRF token oluştur
    console.log('1️⃣ CSRF token oluşturuluyor...');
    const token1 = await createCsrfToken(testUserId, 60); // 60 saniye TTL
    console.log(`✅ Token oluşturuldu: ${token1.substring(0, 16)}...\n`);

    // 2. Token'ı doğrula
    console.log('2️⃣ Token doğrulanıyor...');
    const isValid1 = await verifyCsrfToken(testUserId, token1);
    console.log(`✅ Token geçerli: ${isValid1}\n`);

    // 3. Token'ı yenile
    console.log('3️⃣ Token yenileniyor...');
    const token2 = await refreshCsrfToken(testUserId, 60);
    console.log(`✅ Yeni token: ${token2.substring(0, 16)}...\n`);

    // 4. Eski token'ın geçersiz olduğunu kontrol et
    console.log('4️⃣ Eski token kontrol ediliyor...');
    const isValid2 = await verifyCsrfToken(testUserId, token1);
    console.log(`✅ Eski token geçersiz: ${!isValid2}\n`);

    // 5. Yeni token'ın geçerli olduğunu kontrol et
    console.log('5️⃣ Yeni token kontrol ediliyor...');
    const isValid3 = await verifyCsrfToken(testUserId, token2);
    console.log(`✅ Yeni token geçerli: ${isValid3}\n`);

    // 6. Token'ı al
    console.log('6️⃣ Token alınıyor...');
    const retrievedToken = await getCsrfToken(testUserId);
    console.log(`✅ Alınan token: ${retrievedToken.substring(0, 16)}...\n`);

    // 7. Token'ı sil
    console.log('7️⃣ Token siliniyor...');
    const deleted = await deleteCsrfToken(testUserId);
    console.log(`✅ Token silindi: ${deleted}\n`);

    // 8. Silinmiş token'ı kontrol et
    console.log('8️⃣ Silinmiş token kontrol ediliyor...');
    const isValid4 = await verifyCsrfToken(testUserId, token2);
    console.log(`✅ Silinmiş token geçersiz: ${!isValid4}\n`);

    console.log('🎉 Tüm testler başarılı!');

  } catch (error) {
    console.error('❌ Test hatası:', error);
  }

  // Redis bağlantısını kapat
  await disconnectRedis();
  process.exit(0);
}

testCsrfSystem(); 