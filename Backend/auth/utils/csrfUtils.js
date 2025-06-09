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
    await deleteCsrfToken(userId);
    const token = crypto.randomBytes(32).toString('hex');
    const key = `csrf:${userId}`;
    await redisClient.setEx(key, sessionTTL, token);
    
    // Only log in development mode and don't expose full token
    if (process.env.NODE_ENV === 'development') {
      console.log(`[CSRF] [create] userId: ${userId}, token: ${token.substring(0, 8)}..., TTL: ${sessionTTL}s`);
    }
    
    return token;
  } catch (error) {
    console.error(`[CSRF] [create] HATA! userId: ${userId}`, error);
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
      console.warn(`[CSRF] [verify] Token yok! userId: ${userId}`);
      return false;
    }
    const isValid = storedToken === token;
    
    // Only log in development mode and don't expose full token
    if (process.env.NODE_ENV === 'development') {
      console.log(`[CSRF] [verify] userId: ${userId}, token: ${token.substring(0, 8)}..., isValid: ${isValid}`);
    }
    
    return isValid;
  } catch (error) {
    console.error(`[CSRF] [verify] HATA! userId: ${userId}`, error);
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
    const newToken = await createCsrfToken(userId, sessionTTL);
    
    // Only log in development mode and don't expose full token
    if (process.env.NODE_ENV === 'development') {
      console.log(`[CSRF] [refresh] userId: ${userId}, newToken: ${newToken.substring(0, 8)}...`);
    }
    
    return newToken;
  } catch (error) {
    console.error(`[CSRF] [refresh] HATA! userId: ${userId}`, error);
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
    console.log(`[CSRF] [delete] userId: ${userId}, silindi: ${result > 0}`);
    return result > 0;
  } catch (error) {
    console.error(`[CSRF] [delete] HATA! userId: ${userId}`, error);
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
    
    // Only log in development mode and don't expose full token
    if (process.env.NODE_ENV === 'development') {
      console.log(`[CSRF] [get] userId: ${userId}, token: ${token ? token.substring(0, 8) + '...' : 'YOK'}`);
    }
    
    return token;
  } catch (error) {
    console.error(`[CSRF] [get] HATA! userId: ${userId}`, error);
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
      console.log(`[CSRF] [ttl] userId: ${userId}, yeni TTL: ${newTTL}s`);
      return true;
    }
    console.warn(`[CSRF] [ttl] Token yok! userId: ${userId}`);
    return false;
  } catch (error) {
    console.error(`[CSRF] [ttl] HATA! userId: ${userId}`, error);
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