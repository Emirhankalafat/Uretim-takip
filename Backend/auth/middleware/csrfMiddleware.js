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
    // Sadece kritik durumlarda log
    if (process.env.CSRF_DEBUG === 'true') {
      console.log(`[CSRF] Muaf method: ${req.method} ${req.path}`);
    }
    return next();
  }

  // Path kontrolü
  if (exemptPaths.includes(req.path)) {
    if (process.env.CSRF_DEBUG === 'true') {
      console.log(`[CSRF] Muaf endpoint: ${req.method} ${req.path}`);
    }
    return next();
  }

  // Kullanıcı veya admin bilgisi var mı kontrol et (auth middleware'den sonra çalışmalı)
  const userId = req.user?.id || req.systemAdmin?.id;
  if (!userId) {
    console.warn(`[CSRF] Kullanıcı bilgisi yok! ${req.method} ${req.path}`);
    return res.status(401).json({ 
      message: 'Kullanıcı bilgisi bulunamadı. Lütfen giriş yapın.' 
    });
  }

  // CSRF token'ı header'dan al
  const csrfToken = req.headers['x-csrf-token'] || req.headers['csrf-token'];

  if (!csrfToken) {
    console.warn(`[CSRF] Token header'da yok! userId: ${userId}, ${req.method} ${req.path}`);
    return res.status(403).json({ 
      message: 'CSRF token bulunamadı. Lütfen sayfayı yenileyin.' 
    });
  }

  // CSRF token'ı doğrula
  verifyCsrfToken(userId, csrfToken)
    .then(async (isValid) => {
      if (!isValid) {
        console.warn(`[CSRF] Geçersiz token! userId: ${userId}, token: ${csrfToken.substring(0, 8)}..., ${req.method} ${req.path}`);
        return res.status(403).json({ 
          message: 'Geçersiz CSRF token. Lütfen sayfayı yenileyin.' 
        });
      }
      // Token geçerli, yeni token oluştur ve response header'ına ekle
      try {
        const newCsrfToken = await refreshCsrfToken(userId);
        res.setHeader('X-New-CSRF-Token', newCsrfToken);
        
        // Sadece debug mode'da detaylı log
        if (process.env.CSRF_DEBUG === 'true') {
          console.log(`[CSRF] Token doğrulandı ve yenilendi! userId: ${userId}, eski: ${csrfToken.substring(0, 8)}..., yeni: ${newCsrfToken.substring(0, 8)}..., ${req.method} ${req.path}`);
        }
        
        req.newCsrfToken = newCsrfToken;
        next();
      } catch (error) {
        console.error(`[CSRF] Token yenileme hatası! userId: ${userId}, ${req.method} ${req.path}`, error);
        return res.status(500).json({ 
          message: 'CSRF token yenileme hatası.' 
        });
      }
    })
    .catch((error) => {
      console.error(`[CSRF] Token doğrulama hatası! userId: ${userId}, ${req.method} ${req.path}`, error);
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

/**
 * Admin endpoint'leri için özelleştirilmiş CSRF koruması
 */
const adminCsrfProtection = (req, res, next) => {
  // Admin exempt paths
  const adminExemptPaths = [
    '/api/admin/csrf-token'
  ];

  // Exempt methods
  const exemptMethods = ['GET', 'HEAD', 'OPTIONS'];

  // Method kontrolü
  if (exemptMethods.includes(req.method)) {
    return next();
  }

  // Path kontrolü
  if (adminExemptPaths.includes(req.path)) {
    return next();
  }

  // Admin bilgisi var mı kontrol et
  const adminId = req.systemAdmin?.id;
  if (!adminId) {
    return res.status(401).json({ 
      message: 'Admin bilgisi bulunamadı. Lütfen giriş yapın.' 
    });
  }

  // Admin CSRF token prefix'i kullan
  const prefixedAdminId = `admin_${adminId}`;

  // CSRF token'ı header'dan al
  const csrfToken = req.headers['x-csrf-token'] || req.headers['csrf-token'];

  if (!csrfToken) {
    return res.status(403).json({ 
      message: 'CSRF token bulunamadı. Lütfen sayfayı yenileyin.' 
    });
  }

  // CSRF token'ı doğrula
  verifyCsrfToken(prefixedAdminId, csrfToken)
    .then(async (isValid) => {
      if (!isValid) {
        return res.status(403).json({ 
          message: 'Geçersiz CSRF token. Lütfen sayfayı yenileyin.' 
        });
      }

      // Token geçerli, yeni token oluştur ve response header'ına ekle
      try {
        const newCsrfToken = await refreshCsrfToken(prefixedAdminId);
        res.setHeader('X-New-CSRF-Token', newCsrfToken);
        
        req.newCsrfToken = newCsrfToken;
        next();
      } catch (error) {
        console.error(`[ADMIN CSRF] Token yenileme hatası! adminId: ${adminId}`, error);
        return res.status(500).json({ 
          message: 'CSRF token yenileme hatası.' 
        });
      }
    })
    .catch((error) => {
      console.error(`[ADMIN CSRF] Token doğrulama hatası! adminId: ${adminId}`, error);
      return res.status(500).json({ 
        message: 'CSRF token doğrulama hatası.' 
      });
    });
};

module.exports = { 
  csrfProtection,
  csrfProtectionForPaths,
  adminCsrfProtection
};