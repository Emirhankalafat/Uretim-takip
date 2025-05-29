const crypto = require('crypto');
const { redisClient, connectRedis } = require('../../config/redis');

// Redis bağlantısını başlat (eğer başlatılmamışsa)
connectRedis().catch(console.error);

/**
 * CSRF token oluştur ve Redis'e kaydet
 * @param {number} userId - Kullanıcı ID'si
 * @param {number} sessionTTL - Session TTL (saniye cinsinden)
 * @returns {string} CSRF token
 */
async function createCsrfToken(userId, sessionTTL = 24 * 60 * 60) { // Default 1 gün
  try {
    // Eski CSRF token'ı varsa sil
    await deleteCsrfToken(userId);
    
    // Yeni token oluştur
    const token = crypto.randomBytes(32).toString('hex');
    const key = `csrf:${userId}`;
    
    // Redis'e kaydet (TTL ile)
    await redisClient.setEx(key, sessionTTL, token);
    
    if (process.env.NODE_ENV !== 'production') {
      console.log(`🔍 CSRF token oluşturuldu - User: ${userId}, Token: ${token.substring(0, 16)}..., TTL: ${sessionTTL}s`);
    } else {
      console.log(`CSRF token oluşturuldu - User: ${userId}, TTL: ${sessionTTL}s`);
    }
    return token;
  } catch (error) {
    console.error('CSRF token oluşturma hatası:', error);
    throw error;
  }
}

/**
 * CSRF token'ı doğrula
 * @param {number} userId - Kullanıcı ID'si
 * @param {string} token - Doğrulanacak token
 * @returns {boolean} Token geçerli mi?
 */
async function verifyCsrfToken(userId, token) {
  try {
    const key = `csrf:${userId}`;
    const storedToken = await redisClient.get(key);
    
    if (!storedToken) {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`🔍 CSRF token bulunamadı - User: ${userId}, Redis Key: ${key}`);
      } else {
        console.log(`CSRF token bulunamadı - User: ${userId}`);
      }
      return false;
    }
    
    const isValid = storedToken === token;
    if (process.env.NODE_ENV !== 'production') {
      console.log(`🔍 CSRF token doğrulama - User: ${userId}, Valid: ${isValid}`);
      console.log(`🔍 Stored: ${storedToken.substring(0, 16)}..., Received: ${token.substring(0, 16)}...`);
    } else {
      console.log(`CSRF token doğrulama - User: ${userId}, Valid: ${isValid}`);
    }
    
    return isValid;
  } catch (error) {
    console.error('CSRF token doğrulama hatası:', error);
    return false;
  }
}

/**
 * CSRF token'ı yenile (eski token'ı sil, yeni token oluştur)
 * @param {number} userId - Kullanıcı ID'si
 * @param {number} sessionTTL - Session TTL (saniye cinsinden)
 * @returns {string} Yeni CSRF token
 */
async function refreshCsrfToken(userId, sessionTTL = 24 * 60 * 60) {
  try {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`🔍 CSRF token yenileniyor - User: ${userId}`);
    } else {
      console.log(`CSRF token yenileniyor - User: ${userId}`);
    }
    return await createCsrfToken(userId, sessionTTL);
  } catch (error) {
    console.error('CSRF token yenileme hatası:', error);
    throw error;
  }
}

/**
 * CSRF token'ı sil
 * @param {number} userId - Kullanıcı ID'si
 */
async function deleteCsrfToken(userId) {
  try {
    const key = `csrf:${userId}`;
    const result = await redisClient.del(key);
    if (process.env.NODE_ENV !== 'production') {
      console.log(`🔍 CSRF token silindi - User: ${userId}, Key: ${key}, Deleted: ${result > 0}`);
    } else {
      console.log(`CSRF token silindi - User: ${userId}, Deleted: ${result > 0}`);
    }
    return result > 0;
  } catch (error) {
    console.error('CSRF token silme hatası:', error);
    return false;
  }
}

/**
 * Kullanıcının CSRF token'ını al
 * @param {number} userId - Kullanıcı ID'si
 * @returns {string|null} CSRF token veya null
 */
async function getCsrfToken(userId) {
  try {
    const key = `csrf:${userId}`;
    const token = await redisClient.get(key);
    return token;
  } catch (error) {
    console.error('CSRF token alma hatası:', error);
    return null;
  }
}

/**
 * CSRF token'ın TTL'ini güncelle (session yenilendiğinde)
 * @param {number} userId - Kullanıcı ID'si
 * @param {number} newTTL - Yeni TTL (saniye cinsinden)
 */
async function updateCsrfTokenTTL(userId, newTTL) {
  try {
    const key = `csrf:${userId}`;
    const token = await redisClient.get(key);
    
    if (token) {
      await redisClient.setEx(key, newTTL, token);
      console.log(`CSRF token TTL güncellendi - User: ${userId}, TTL: ${newTTL}s`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('CSRF token TTL güncelleme hatası:', error);
    return false;
  }
}

module.exports = {
  createCsrfToken,
  verifyCsrfToken,
  refreshCsrfToken,
  deleteCsrfToken,
  getCsrfToken,
  updateCsrfTokenTTL,
  redisClient
}; 