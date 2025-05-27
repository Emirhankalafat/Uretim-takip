const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
require('dotenv').config();
const { 
  createConfirmToken, 
  createJWTToken, 
  createRefreshToken, 
  saveRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
  revokeAllUserRefreshTokens
} = require('./utils/tokenUtils');
const { sendConfirmEmail } = require('./utils/emailUtils');
const { 
  createCsrfToken, 
  deleteCsrfToken, 
  getCsrfToken,
  updateCsrfTokenTTL 
} = require('./utils/csrfUtils');

const registerCompanyUser = async (req, res) => {
  try {
    const { name, mail, password, companyName } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { Mail: mail },
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Bu e-posta zaten kullanılıyor.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newCompany = await prisma.company.create({
      data: {
        Name: companyName,
        Max_User: 5,
        Suspscription_package: 'trial',
        Sub_end_time: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
    });

    const newUser = await prisma.user.create({
      data: {
        Name: name,
        Mail: mail,
        password: hashedPassword,
        is_SuperAdmin: true,
        is_active: true,
        company_id: newCompany.id,
      },
    });

    const confirmToken = await createConfirmToken(newUser.id);
    console.log('Kullanıcı oluşturuldu, confirm token:', confirmToken);

    // Email gönder
    const emailSent = await sendConfirmEmail(newUser.Mail, newUser.Name, confirmToken);
    
    if (!emailSent) {
      console.warn('Email gönderilemedi, ancak kullanıcı oluşturuldu');
    }

    res.status(201).json({
      message: 'Kayıt başarılı. Lütfen e-posta adresinizi kontrol edin ve hesabınızı doğrulayın.',
      user: {
        id: Number(newUser.id),
        name: newUser.Name,
        mail: newUser.Mail,
        company_id: Number(newCompany.id),
      },
      email_sent: emailSent
    });
  } catch (error) {
    console.error('Kayıt hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

const confirmUser = async (req, res) => {
  const { token } = req.query;

  try {
    console.log('Confirm token request:', token);
    console.log('Token length:', token?.length);
    console.log('Current time:', new Date());

    // Önce token'ı bul
    const record = await prisma.confirmToken.findUnique({
      where: { token },
      include: { user: true },
    });

    console.log('Found record:', record ? 'YES' : 'NO');
    
    // Eğer token bulunamadıysa, kullanıcının zaten confirm edilmiş olup olmadığını kontrol et
    if (!record) {
      // Token silinmiş olabilir, kullanıcının durumunu kontrol et
      // Bu durumda token'ın hangi kullanıcıya ait olduğunu bilemeyiz
      // Bu yüzden genel bir hata mesajı döneriz
      console.log('Token not found, checking if this is a duplicate request...');
      return res.status(400).json({ message: 'Geçersiz veya süresi dolmuş token.' });
    }

    if (record) {
      console.log('Record details:', {
        id: record.id,
        user_id: record.user_id,
        token: record.token,
        expiresAt: record.expiresAt,
        createdAt: record.createdAt,
        isExpired: record.expiresAt < new Date(),
        userAlreadyConfirmed: record.user.is_confirm
      });
    }

    // Token süresi dolmuş mu kontrol et
    if (record.expiresAt < new Date()) {
      return res.status(400).json({ message: 'Geçersiz veya süresi dolmuş token.' });
    }

    // Kullanıcı zaten confirm edilmişse, başarılı response döndür (idempotent)
    if (record.user.is_confirm) {
      console.log('User already confirmed, returning success (idempotent)');
      // Token'ı sil (eğer hala varsa)
      await prisma.confirmToken.delete({
        where: { token },
      }).catch(() => {
        // Token zaten silinmişse hata verme
        console.log('Token already deleted');
      });
      
      return res.status(200).json({ message: 'Kullanıcı doğrulandı.' });
    }

    // Kullanıcıyı onayla
    await prisma.user.update({
      where: { id: BigInt(record.user_id) },
      data: { is_confirm: true },
    });

    // Token'ı sil
    await prisma.confirmToken.delete({
      where: { token },
    });

    console.log('User confirmed successfully');
    res.status(200).json({ message: 'Kullanıcı doğrulandı.' });
  } catch (error) {
    console.error('Doğrulama hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

const loginUser = async (req, res) => {
  try {
    const { mail, password } = req.body;

    // Kullanıcıyı bul
    const user = await prisma.user.findUnique({
      where: { Mail: mail },
      include: { company: true }
    });

    if (!user) {
      return res.status(401).json({ message: 'Geçersiz e-posta veya şifre.' });
    }

    // Şifre kontrolü
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Geçersiz e-posta veya şifre.' });
    }

    // Kullanıcı aktif mi kontrol et
    if (!user.is_active) {
      return res.status(403).json({ message: 'Hesabınız aktif değil. Lütfen yöneticinizle iletişime geçin.' });
    }

    // Kullanıcı onaylı mı kontrol et
    if (!user.is_confirm) {
      return res.status(403).json({ message: 'Hesabınız henüz onaylanmamış. Lütfen e-posta adresinizi kontrol edin.' });
    }

    // JWT access token oluştur (15 dakika)
    const accessToken = createJWTToken(Number(user.id), user.Mail, Number(user.company_id));
    
    // Refresh token oluştur (7 gün)
    const refreshToken = createRefreshToken();
    await saveRefreshToken(Number(user.id), refreshToken);

    // CSRF token oluştur (session süresi ile aynı - 1 gün)
    const csrfToken = await createCsrfToken(Number(user.id), 24 * 60 * 60); // 1 gün

    // Cookie'lere token'ları kaydet
    res.cookie('accessToken', accessToken, {
      httpOnly: true, // XSS saldırılarına karşı koruma
      secure: process.env.NODE_ENV === 'production', // HTTPS'de secure flag
      sameSite: 'strict', // CSRF saldırılarına karşı koruma
      maxAge: 15 * 60 * 1000 // 15 dakika (milisaniye cinsinden)
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 gün (milisaniye cinsinden)
    });

    // CSRF token'ı da cookie olarak gönder (JavaScript'ten erişilebilir)
    res.cookie('csrfToken', csrfToken, {
      httpOnly: false, // JavaScript'ten erişilebilir olmalı
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 1 gün (milisaniye cinsinden)
    });

    res.status(200).json({
      message: 'Giriş başarılı.',
      user: {
        id: Number(user.id),
        Name: user.Name,  // Frontend'de Name olarak bekleniyor
        Mail: user.Mail,  // Frontend'de Mail olarak bekleniyor
        name: user.Name,  // Backward compatibility için
        mail: user.Mail,  // Backward compatibility için
        company_id: Number(user.company_id),
        company_name: user.company.Name,
        is_SuperAdmin: user.is_SuperAdmin
      },
      csrfToken: csrfToken // CSRF token'ı frontend'e gönder
    });

  } catch (error) {
    console.error('Giriş hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// Refresh token ile yeni access token alma
const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token bulunamadı.' });
    }

    // Refresh token'ı doğrula
    const tokenRecord = await verifyRefreshToken(refreshToken);
    
    if (!tokenRecord) {
      return res.status(401).json({ message: 'Geçersiz veya süresi dolmuş refresh token.' });
    }

    // Kullanıcı bilgilerini al
    const user = await prisma.user.findUnique({
      where: { id: tokenRecord.userId },
      include: { company: true }
    });

    if (!user || !user.is_active || !user.is_confirm) {
      return res.status(401).json({ message: 'Kullanıcı hesabı aktif değil.' });
    }

    // Eski refresh token'ı revoke et
    await revokeRefreshToken(tokenRecord.id);

    // Yeni access token ve refresh token oluştur (token rotasyonu)
    const newAccessToken = createJWTToken(Number(user.id), user.Mail, Number(user.company_id));
    const newRefreshToken = createRefreshToken();
    await saveRefreshToken(Number(user.id), newRefreshToken);

    // CSRF token'ın TTL'ini güncelle (session yenilendiği için)
    await updateCsrfTokenTTL(Number(user.id), 24 * 60 * 60); // 1 gün

    // Yeni cookie'leri ayarla
    res.cookie('accessToken', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000 // 15 dakika
    });

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 gün
    });

    // Güncel CSRF token'ı al ve frontend'e gönder
    const currentCsrfToken = await getCsrfToken(Number(user.id));

    // CSRF token'ı cookie olarak da gönder
    if (currentCsrfToken) {
      res.cookie('csrfToken', currentCsrfToken, {
        httpOnly: false, // JavaScript'ten erişilebilir olmalı
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 1 gün (milisaniye cinsinden)
      });
    }

    res.status(200).json({
      message: 'Token başarıyla yenilendi.',
      user: {
        id: Number(user.id),
        Name: user.Name,
        Mail: user.Mail,
        company_id: Number(user.company_id),
        company_name: user.company.Name,
        is_SuperAdmin: user.is_SuperAdmin
      },
      csrfToken: currentCsrfToken // CSRF token'ı frontend'e gönder
    });

  } catch (error) {
    console.error('Token yenileme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

const logoutUser = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    let userId = null;
    
    // Eğer refresh token varsa, onu revoke et ve user ID'yi al
    if (refreshToken) {
      const tokenRecord = await verifyRefreshToken(refreshToken);
      if (tokenRecord) {
        userId = Number(tokenRecord.userId);
        await revokeRefreshToken(tokenRecord.id);
      }
    }

    // Eğer auth middleware'den user bilgisi varsa onu kullan
    if (req.user && req.user.id) {
      userId = req.user.id;
    }

    // CSRF token'ı sil
    if (userId) {
      await deleteCsrfToken(userId);
    }

    // Cookie'leri temizle
    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    // CSRF token cookie'sini de temizle
    res.clearCookie('csrfToken', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    res.status(200).json({ message: 'Çıkış başarılı.' });
  } catch (error) {
    console.error('Çıkış hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

const getUserProfile = (req, res) => {
  try {
    // Middleware'den gelen kullanıcı bilgilerini döndür
    res.status(200).json({
      message: 'Kullanıcı bilgileri başarıyla alındı.',
      user: req.user
    });
  } catch (error) {
    console.error('Profil getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

const getDashboardProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await prisma.user.findUnique({
      where: { id: BigInt(userId) },
      include: { 
        company: true,
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
    }

    // Normal kullanıcı için basit profil bilgileri
    if (!user.is_SuperAdmin) {
      return res.status(200).json({
        message: 'Dashboard profil bilgileri başarıyla alındı.',
        profile: {
          name: user.Name,
          mail: user.Mail,
          company_name: user.company.Name,
          created_at: user.created_at,
          is_SuperAdmin: false
        }
      });
    }

    // Super admin için detaylı bilgiler
    const companyStats = await prisma.company.findUnique({
      where: { id: user.company_id },
      include: {
        users: {
          select: {
            id: true,
            Name: true,
            Mail: true,
            is_active: true,
            is_confirm: true,
            created_at: true
          }
        }
      }
    });

    const totalUsers = companyStats.users.length;
    const activeUsers = companyStats.users.filter(u => u.is_active).length;
    const confirmedUsers = companyStats.users.filter(u => u.is_confirm).length;
    const pendingUsers = companyStats.users.filter(u => !u.is_confirm).length;

    return res.status(200).json({
      message: 'Dashboard profil bilgileri başarıyla alındı.',
      profile: {
        name: user.Name,
        mail: user.Mail,
        company_name: user.company.Name,
        created_at: user.created_at,
        is_SuperAdmin: true,
        company_stats: {
          total_users: totalUsers,
          active_users: activeUsers,
          confirmed_users: confirmedUsers,
          pending_users: pendingUsers,
          max_users: companyStats.Max_User,
          subscription_package: companyStats.Suspscription_package,
          subscription_end: companyStats.Sub_end_time
        },
        recent_users: companyStats.users.slice(-5).map(u => ({
          id: Number(u.id),
          name: u.Name,
          mail: u.Mail,
          is_active: u.is_active,
          is_confirm: u.is_confirm,
          created_at: u.created_at
        }))
      }
    });

  } catch (error) {
    console.error('Dashboard profil getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// CSRF token alma endpoint'i
const getCsrfTokenEndpoint = async (req, res) => {
  try {
    // Kullanıcı bilgisi var mı kontrol et (auth middleware'den sonra çalışmalı)
    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        message: 'Kullanıcı bilgisi bulunamadı. Lütfen giriş yapın.' 
      });
    }

    // Mevcut CSRF token'ı al
    const csrfToken = await getCsrfToken(req.user.id);

    if (!csrfToken) {
      // CSRF token yoksa yeni oluştur
      const newCsrfToken = await createCsrfToken(req.user.id, 24 * 60 * 60); // 1 gün
      
      // Cookie olarak da gönder
      res.cookie('csrfToken', newCsrfToken, {
        httpOnly: false, // JavaScript'ten erişilebilir olmalı
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 1 gün (milisaniye cinsinden)
      });
      
      return res.status(200).json({
        message: 'CSRF token oluşturuldu.',
        csrfToken: newCsrfToken
      });
    }

    // Mevcut token'ı cookie olarak da gönder
    res.cookie('csrfToken', csrfToken, {
      httpOnly: false, // JavaScript'ten erişilebilir olmalı
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 1 gün (milisaniye cinsinden)
    });

    res.status(200).json({
      message: 'CSRF token başarıyla alındı.',
      csrfToken: csrfToken
    });

  } catch (error) {
    console.error('CSRF token alma hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

module.exports = {
  registerCompanyUser,
  confirmUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  getUserProfile,
  getDashboardProfile,
  getCsrfTokenEndpoint,
};
