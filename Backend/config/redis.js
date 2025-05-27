const { createClient } = require('redis');
require('dotenv').config();

// Redis client oluştur
const redisClient = createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379
  },
  // Şifre varsa kullan, yoksa undefined
  ...(process.env.REDIS_PASSWORD && { password: process.env.REDIS_PASSWORD }),
  database: parseInt(process.env.REDIS_DB) || 0
});

// Redis event listeners
redisClient.on('error', (err) => {
  console.error('❌ Redis Client Error:', err.message);
});

redisClient.on('connect', () => {
  console.log('🔗 Redis bağlantısı kuruluyor...');
});

redisClient.on('ready', () => {
  console.log('✅ Redis bağlantısı başarılı ve hazır!');
});

redisClient.on('end', () => {
  console.log('🔌 Redis bağlantısı sonlandırıldı');
});

redisClient.on('reconnecting', () => {
  console.log('🔄 Redis yeniden bağlanmaya çalışıyor...');
});

// Redis bağlantısını başlat
async function connectRedis() {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
      console.log('🚀 Redis client başlatıldı');
    }
  } catch (error) {
    console.error('❌ Redis bağlantı hatası:', error.message);
    throw error;
  }
}

// Redis bağlantısını kapat
async function disconnectRedis() {
  try {
    if (redisClient.isOpen) {
      await redisClient.quit();
      console.log('👋 Redis bağlantısı kapatıldı');
    }
  } catch (error) {
    console.error('❌ Redis kapatma hatası:', error.message);
  }
}

// Redis client'ı export et
module.exports = {
  redisClient,
  connectRedis,
  disconnectRedis
}; 