const { verifyJWTToken } = require('../utils/tokenUtils');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const logger = require('../../utils/logger');

const authenticateToken = async (req, res, next) => {
  try {
    // Token'ı birden fazla yerden almaya çalış
    let token = req.cookies.accessToken; // Cookie'den
    
    // Eğer cookie'de yoksa header'dan al
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
    
    // Eğer hala yoksa form data'dan al (ödeme sayfası için)
    if (!token && req.body.accessToken) {
      token = req.body.accessToken;
      // Form data'dan aldığımız token'ı cookie'ye set et ki devamında kullanılabilsin
      res.cookie('accessToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000 // 15 dakika
      });
    }

    if (!token) {
      return res.status(401).json({ message: 'Erişim token\'ı bulunamadı. Lütfen giriş yapın.' });
    }

    // Token'ı doğrula
    const decoded = verifyJWTToken(token);
    if (!decoded || !decoded.userId) {
      return res.status(401).json({ message: 'Geçersiz veya süresi dolmuş token. Lütfen tekrar giriş yapın.' });
    }

    // Kullanıcının hala aktif ve onaylı olup olmadığını kontrol et
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { company: true } 
    });

    if (!user) {
      return res.status(401).json({ message: 'Kullanıcı bulunamadı.' });
    }

    if (!user.is_active) {
      return res.status(403).json({ message: 'Hesabınız aktif değil.' });
    }

    if (!user.is_confirm) {
      return res.status(403).json({ message: 'Hesabınız onaylanmamış.' });
    }

    // Kullanıcı bilgilerini request'e ekle
    req.user = {
      id: Number(user.id),
      Mail: user.Mail,  // Frontend'de Mail olarak bekleniyor
      Name: user.Name,  // Frontend'de Name olarak bekleniyor
      mail: user.Mail,  // Backward compatibility için
      name: user.Name,  // Backward compatibility için
      company_id: Number(user.company_id),
      company_name: user.company.Name,
      is_SuperAdmin: user.is_SuperAdmin
    };

    next();
  } catch (error) {
    logger.error('Auth middleware hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

const authenticateSystemAdmin = async (req, res, next) => {
  try {
    let token = req.cookies.accessToken;
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
    if (!token && req.body.accessToken) {
      token = req.body.accessToken;
      res.cookie('accessToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000 // 15 dakika
      });
    }
    if (!token) {
      return res.status(401).json({ message: 'Erişim token\'ı bulunamadı. Lütfen giriş yapın.' });
    }
    const decoded = verifyJWTToken(token);
    if (!decoded || !decoded.adminId) {
      return res.status(401).json({ message: 'Geçersiz veya süresi dolmuş token. Lütfen tekrar giriş yapın.' });
    }
    const admin = await prisma.systemAdmin.findUnique({ where: { id: decoded.adminId } });
    if (!admin || !admin.isActive) {
      return res.status(401).json({ message: 'Sistem yöneticisi bulunamadı veya pasif.' });
    }
    req.systemAdmin = { id: Number(admin.id), email: admin.email };
    next();
  } catch (error) {
    logger.error('SystemAdmin auth middleware hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

const authenticateApiKey = async (req, res, next) => {
  try {
    // Hem header hem body destekle
    const apiKey = req.headers['x-api-key'] || req.body.api_key;
    if (!apiKey) {
      return res.status(401).json({ message: 'API key bulunamadı.' });
    }

    const company = await prisma.company.findFirst({
      where: {
        api_key: apiKey
      }
    });

    if (!company) {
      return res.status(403).json({ message: 'Geçersiz API key' });
    }

    // Abonelik paketi kontrolü - sadece trial ve premium kullanıcılar MCP'ye erişebilir
    if (company.Suspscription_package === 'basic') {
      return res.status(403).json({ 
        error: 'MCP erişimi için premium veya trial üyelik gereklidir.',
        error_code: 'MCP_SUBSCRIPTION_REQUIRED',
        current_package: 'basic'
      });
    }

    // Trial veya premium değilse de reddet
    if (company.Suspscription_package !== 'trial' && company.Suspscription_package !== 'premium') {
      return res.status(403).json({ 
        error: 'Geçersiz abonelik paketi.',
        error_code: 'INVALID_PACKAGE',
        current_package: company.Suspscription_package
      });
    }

    // Controller tarafında erişmek için
    req.company = {
      id: Number(company.id),
      name: company.Name,
      package: company.Suspscription_package
    };

    next();
  } catch (error) {
    logger.error('API key auth middleware hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// Aktif abonelik kontrolü - sadece trial ve premium kullanıcılar POST işlemleri yapabilir
const requireActiveSubscription = async (req, res, next) => {
  try {
    // GET istekleri için kontrole gerek yok - basic kullanıcılar görebilir
    if (req.method === 'GET') {
      return next();
    }

    // Kullanıcının şirket abonelik paketini kontrol et
    if (!req.user) {
      return res.status(401).json({ message: 'Kullanıcı bilgisi bulunamadı.' });
    }

    // Şirket bilgilerini al
    const company = await prisma.company.findUnique({
      where: { id: req.user.company_id },
      select: { 
        Suspscription_package: true,
        Sub_end_time: true 
      }
    });

    if (!company) {
      return res.status(404).json({ message: 'Şirket bulunamadı.' });
    }

    // Basic paket kontrolü
    if (company.Suspscription_package === 'basic') {
      return res.status(403).json({ 
        message: 'Bu işlemi gerçekleştirmek için premium veya trial üyelik gereklidir. Lütfen aboneliğinizi yükseltin.',
        error_code: 'SUBSCRIPTION_REQUIRED',
        current_package: 'basic'
      });
    }

    // Trial veya premium ise devam et
    if (company.Suspscription_package === 'trial' || company.Suspscription_package === 'premium') {
      return next();
    }

    // Bilinmeyen paket tipi
    return res.status(403).json({ 
      message: 'Geçersiz abonelik paketi.',
      error_code: 'INVALID_PACKAGE',
      current_package: company.Suspscription_package
    });

  } catch (error) {
    logger.error('Subscription middleware hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

module.exports = { authenticateToken, authenticateSystemAdmin, authenticateApiKey, requireActiveSubscription }; 