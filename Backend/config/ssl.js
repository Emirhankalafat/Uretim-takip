const fs = require('fs');
const https = require('https');
const path = require('path');

/**
 * SSL/TLS konfigürasyonu
 * Production ortamında HTTPS zorunlu hale getirir
 */

// SSL sertifika dosyalarının yolları
const SSL_CERT_PATH = process.env.SSL_CERT_PATH || '/etc/ssl/certs/server.crt';
const SSL_KEY_PATH = process.env.SSL_KEY_PATH || '/etc/ssl/private/server.key';
const SSL_CA_PATH = process.env.SSL_CA_PATH; // İsteğe bağlı CA chain

/**
 * SSL sertifikalarını yükle
 */
function loadSSLCredentials() {
  try {
    const sslOptions = {
      key: fs.readFileSync(SSL_KEY_PATH),
      cert: fs.readFileSync(SSL_CERT_PATH)
    };

    // CA chain varsa ekle
    if (SSL_CA_PATH && fs.existsSync(SSL_CA_PATH)) {
      sslOptions.ca = fs.readFileSync(SSL_CA_PATH);
    }

    return sslOptions;
  } catch (error) {
    console.error('❌ SSL sertifikaları yüklenemedi:', error.message);
    console.log('💡 Geliştirme ortamında SSL devre dışı. Production için SSL sertifikası gerekli!');
    return null;
  }
}

/**
 * HTTPS Server oluştur
 */
function createHTTPSServer(app) {
  const sslCredentials = loadSSLCredentials();
  
  if (!sslCredentials) {
    return null;
  }

  return https.createServer(sslCredentials, app);
}

/**
 * HTTP'den HTTPS'e yönlendirme middleware
 */
function httpsRedirect(req, res, next) {
  if (process.env.NODE_ENV === 'production' && !req.secure && req.get('x-forwarded-proto') !== 'https') {
    return res.redirect(301, `https://${req.get('host')}${req.url}`);
  }
  next();
}

/**
 * Security headers middleware
 */
function securityHeaders(req, res, next) {
  // Strict Transport Security
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  // X-Frame-Options
  res.setHeader('X-Frame-Options', 'DENY');
  
  // X-Content-Type-Options
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions Policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  next();
}

/**
 * SSL konfigürasyonu doğrula
 */
function validateSSLConfig() {
  if (process.env.NODE_ENV === 'production') {
    const requiredVars = ['SSL_CERT_PATH', 'SSL_KEY_PATH'];
    const missing = requiredVars.filter(varName => !process.env[varName]);
    
    if (missing.length > 0) {
      console.warn(`⚠️ Production ortamında SSL konfigürasyonu eksik: ${missing.join(', ')}`);
      console.warn('🔒 HTTPS kullanımı önerilir!');
    }
    
    // Sertifika dosyalarının varlığını kontrol et
    if (process.env.SSL_CERT_PATH && !fs.existsSync(process.env.SSL_CERT_PATH)) {
      console.error(`❌ SSL sertifika dosyası bulunamadı: ${process.env.SSL_CERT_PATH}`);
    }
    
    if (process.env.SSL_KEY_PATH && !fs.existsSync(process.env.SSL_KEY_PATH)) {
      console.error(`❌ SSL private key dosyası bulunamadı: ${process.env.SSL_KEY_PATH}`);
    }
  }
}

module.exports = {
  loadSSLCredentials,
  createHTTPSServer,
  httpsRedirect,
  securityHeaders,
  validateSSLConfig
}; 