const { verifyCsrfToken, refreshCsrfToken, getCsrfToken } = require('../utils/csrfUtils');

/**
 * CSRF token doğrulama middleware'i
 * Belirtilen endpoint'leri muaf tutar
 */
const csrfProtection = (req, res, next) => {
  // Muaf endpoint'ler
  const exemptPaths = [
    // Auth endpoint'leri
    '/api/auth/login',
    '/api/auth/register', 
    '/api/auth/refresh',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
    '/api/auth/logout',
    '/api/auth/csrf-token',
    
    // Confirm endpoint'leri
    '/api/auth/confirm',
    '/api/auth/resend-confirm',
    
    // Invite endpoint'leri (public)
    '/api/auth/accept-invite'
  ];

  // Muaf method'lar (GET genellikle muaf)
  const exemptMethods = ['GET', 'HEAD', 'OPTIONS'];

  // Method kontrolü
  if (exemptMethods.includes(req.method)) {
    return next();
  }

  // Path kontrolü
  if (exemptPaths.includes(req.path)) {
    return next();
  }

  // Kullanıcı bilgisi var mı kontrol et (auth middleware'den sonra çalışmalı)
  if (!req.user || !req.user.id) {
    return res.status(401).json({ 
      message: 'Kullanıcı bilgisi bulunamadı. Lütfen giriş yapın.' 
    });
  }

  // CSRF token'ı header'dan al
  const csrfToken = req.headers['x-csrf-token'] || req.headers['csrf-token'];

  // Development mode debug logs
  if (process.env.NODE_ENV !== 'production') {
    console.log(`🔍 CSRF Debug - User: ${req.user.id}, Path: ${req.path}, Method: ${req.method}`);
    console.log(`🔍 Token from header: ${csrfToken ? csrfToken.substring(0, 16) + '...' : 'NULL'}`);
  }

  if (!csrfToken) {
    return res.status(403).json({ 
      message: 'CSRF token bulunamadı. Lütfen sayfayı yenileyin.' 
    });
  }

  // CSRF token'ı doğrula
  verifyCsrfToken(req.user.id, csrfToken)
    .then(async (isValid) => {
      // Development mode debug logs
      if (process.env.NODE_ENV !== 'production') {
        console.log(`🔍 Token validation result: ${isValid}`);
        
        if (!isValid) {
          // Redis'teki token'ı da kontrol edelim
          const storedToken = await getCsrfToken(req.user.id);
          console.log(`🔍 Stored token in Redis: ${storedToken ? storedToken.substring(0, 16) + '...' : 'NULL'}`);
          console.log(`🔍 Sent token: ${csrfToken.substring(0, 16)}...`);
          console.log(`🔍 Tokens match: ${storedToken === csrfToken}`);
        }
      }
      
      if (!isValid) {
        return res.status(403).json({ 
          message: 'Geçersiz CSRF token. Lütfen sayfayı yenileyin.' 
        });
      }

      // Token geçerli, yeni token oluştur ve response header'ına ekle
      try {
        const newCsrfToken = await refreshCsrfToken(req.user.id);
        res.setHeader('X-New-CSRF-Token', newCsrfToken);
        
        // Development mode debug logs
        if (process.env.NODE_ENV !== 'production') {
          console.log(`🔍 New CSRF token generated: ${newCsrfToken.substring(0, 16)}...`);
        }
        
        // Request'e yeni token'ı ekle (isteğe bağlı)
        req.newCsrfToken = newCsrfToken;
        
        next();
      } catch (error) {
        console.error('CSRF token yenileme hatası:', error);
        return res.status(500).json({ 
          message: 'CSRF token yenileme hatası.' 
        });
      }
    })
    .catch((error) => {
      console.error('CSRF token doğrulama hatası:', error);
      return res.status(500).json({ 
        message: 'CSRF token doğrulama hatası.' 
      });
    });
};

/**
 * Sadece belirli endpoint'ler için CSRF koruması
 * @param {Array} protectedPaths - Korunacak path'ler
 */
const csrfProtectionForPaths = (protectedPaths = []) => {
  return (req, res, next) => {
    // Sadece belirtilen path'ler korunacak
    if (!protectedPaths.includes(req.path)) {
      return next();
    }

    // Normal CSRF korumasını uygula
    return csrfProtection(req, res, next);
  };
};

module.exports = { 
  csrfProtection,
  csrfProtectionForPaths
}; 