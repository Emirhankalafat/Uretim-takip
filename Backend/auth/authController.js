const bcrypt = require('bcryptjs');
const { getPrismaClient, checkPrismaClient } = require('../utils/prismaClient');

// Merkezi prisma client'ı al
const prisma = getPrismaClient();
require('dotenv').config();
const { 
  createConfirmToken, 
  createJWTToken, 
  createRefreshToken, 
  saveRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
  revokeAllUserRefreshTokens,
  createPasswordResetToken,
  verifyPasswordResetToken,
  markPasswordResetTokenAsUsed
} = require('./utils/tokenUtils');
const { sendConfirmEmail, sendPasswordResetEmail } = require('./utils/emailUtils');
const { 
  createCsrfToken, 
  deleteCsrfToken, 
  getCsrfToken,
  updateCsrfTokenTTL 
} = require('./utils/csrfUtils');
const logger = require('../utils/logger');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

function generateApiKey() {
  return crypto.randomBytes(32).toString('hex');
}

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

    const apiKey = generateApiKey();
    const newCompany = await prisma.company.create({
      data: {
        Name: companyName,
        Max_User: 5,
        Suspscription_package: 'trial',
        Sub_end_time: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        api_key: apiKey,
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
        api_key: apiKey,
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
    // Önce token'ı bul
    const record = await prisma.confirmToken.findUnique({
      where: { token },
      include: { user: true },
    });

    // Eğer token bulunamadıysa, kullanıcının zaten confirm edilmiş olup olmadığını kontrol et
    if (!record) {
      // Token silinmiş olabilir, kullanıcının durumunu kontrol et
      // Bu durumda token'ın hangi kullanıcıya ait olduğunu bilemeyiz
      // Bu yüzden genel bir hata mesajı döneriz
      
      // Frontend'e redirect ile hata mesajı gönder
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      return res.redirect(`${frontendUrl}/confirm?status=error&message=${encodeURIComponent('Geçersiz veya süresi dolmuş token.')}`);
    }

    if (record) {
      // Token süresi dolmuş mu kontrol et
      if (record.expiresAt < new Date()) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        return res.redirect(`${frontendUrl}/confirm?status=error&message=${encodeURIComponent('Geçersiz veya süresi dolmuş token.')}`);
      }

      // Kullanıcı zaten confirm edilmişse, başarılı response döndür (idempotent)
      if (record.user.is_confirm) {
        // Token'ı sil (eğer hala varsa)
        await prisma.confirmToken.delete({
          where: { token },
        }).catch(() => {
          // Token zaten silinmişse hata verme
        });
        
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        return res.redirect(`${frontendUrl}/confirm?status=success&message=${encodeURIComponent('Kullanıcı doğrulandı.')}`);
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

      // Frontend'e redirect ile başarı mesajı gönder
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendUrl}/confirm?status=success&message=${encodeURIComponent('Kullanıcı doğrulandı.')}`);
      
    }

  } catch (error) {
    console.error('Doğrulama hatası:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/confirm?status=error&message=${encodeURIComponent('Sunucu hatası.')}`);
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

    // LOG: Başarılı giriş
    logger.info(`[LOGIN] Kullanıcı: ${user.Mail} (id: ${user.id}) IP: ${req.ip} Zaman: ${new Date().toISOString()}`);

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
      maxAge: 15 * 60 * 1000 // 15 dakika
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

    // CSRF token'ı yenile: önce sil, sonra yeni oluştur
    await deleteCsrfToken(Number(user.id)); // Eski CSRF token'ı Redis'ten sil
    const newCsrfToken = await createCsrfToken(Number(user.id), 24 * 60 * 60); // Yeni CSRF token oluştur

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

    // Yeni CSRF token'ı cookie olarak da gönder
    res.cookie('csrfToken', newCsrfToken, {
      httpOnly: false, // JavaScript'ten erişilebilir olmalı
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 1 gün (milisaniye cinsinden)
    });

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
      csrfToken: newCsrfToken // Yeni CSRF token'ı frontend'e gönder
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
        api_key: companyStats.api_key,
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

// Basit authentication status kontrolü (initialize için)
const getAuthStatus = (req, res) => {
  try {
    // Middleware'den gelen kullanıcı bilgilerini basit formatta döndür
    res.status(200).json({
      message: 'Authentication status başarıyla alındı.',
      user: {
        id: req.user.id,
        Name: req.user.Name,
        Mail: req.user.Mail,
        company_id: req.user.company_id,
        company_name: req.user.company_name,
        is_SuperAdmin: req.user.is_SuperAdmin
      }
    });
  } catch (error) {
    console.error('Auth status getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// Şifre sıfırlama talebi
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'E-posta adresi gereklidir.' });
    }

    // Kullanıcıyı bul
    const user = await prisma.user.findUnique({
      where: { Mail: email },
    });

    // Güvenlik sebebiyle, kullanıcı bulunamasa bile başarılı mesajı döndür
    if (!user) {
      return res.status(200).json({ 
        message: 'Eğer bu e-posta adresine kayıtlı bir hesap varsa, şifre sıfırlama linki gönderildi.' 
      });
    }

    // Kullanıcı aktif mi kontrol et
    if (!user.is_active) {
      return res.status(200).json({ 
        message: 'Eğer bu e-posta adresine kayıtlı bir hesap varsa, şifre sıfırlama linki gönderildi.' 
      });
    }

    // Reset token oluştur
    const resetToken = await createPasswordResetToken(user.id);

    // Email gönder
    const emailSent = await sendPasswordResetEmail(user.Mail, user.Name, resetToken);
    
    if (!emailSent) {
      console.warn('Password reset email gönderilemedi:', user.Mail);
      return res.status(500).json({ 
        message: 'Email gönderilirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.' 
      });
    }

    res.status(200).json({
      message: 'Eğer bu e-posta adresine kayıtlı bir hesap varsa, şifre sıfırlama linki gönderildi.',
      email_sent: emailSent
    });

  } catch (error) {
    console.error('Forgot password hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// Şifre sıfırlama token'ını doğrula
const verifyResetToken = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ message: 'Reset token gereklidir.' });
    }

    const verification = await verifyPasswordResetToken(token);

    if (!verification.valid) {
      return res.status(400).json({ message: verification.message });
    }

    res.status(200).json({
      message: 'Token geçerli.',
      user: {
        id: Number(verification.user.id),
        name: verification.user.Name,
        email: verification.user.Mail
      }
    });

  } catch (error) {
    console.error('Token doğrulama hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// Şifre sıfırlama
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token ve yeni şifre gereklidir.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Şifre en az 6 karakter olmalıdır.' });
    }

    // Token'ı doğrula
    const verification = await verifyPasswordResetToken(token);

    if (!verification.valid) {
      return res.status(400).json({ message: verification.message });
    }

    // Şifreyi hash'le
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Kullanıcının şifresini güncelle
    await prisma.user.update({
      where: { id: verification.user.id },
      data: { password: hashedPassword },
    });

    // Token'ı kullanılmış olarak işaretle
    await markPasswordResetTokenAsUsed(verification.tokenId);

    // Kullanıcının tüm refresh token'larını geçersiz kıl (güvenlik için)
    await revokeAllUserRefreshTokens(verification.user.id);

    res.status(200).json({
      message: 'Şifreniz başarıyla sıfırlandı. Artık yeni şifrenizle giriş yapabilirsiniz.',
    });

  } catch (error) {
    console.error('Reset password hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// SystemAdmin login
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'E-posta ve şifre gereklidir.' });
    }
    // SystemAdmin tablosunda admini bul
    const admin = await prisma.systemAdmin.findUnique({ where: { email } });
    if (!admin) {
      return res.status(401).json({ message: 'Geçersiz e-posta veya şifre.' });
    }
    // Şifre kontrolü
    const isPasswordValid = await bcrypt.compare(password, admin.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Geçersiz e-posta veya şifre.' });
    }
    // Sadece aktiflik kontrolü
    if (!admin.isActive) {
      return res.status(403).json({ message: 'Hesabınız pasif. Lütfen yöneticinizle iletişime geçin.' });
    }
    // JWT oluştur
    const token = jwt.sign(
      { adminId: Number(admin.id), email: admin.email, role: 'systemAdmin' },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    // CSRF token oluştur
    const csrfToken = await createCsrfToken(`admin_${admin.id}`);
    // JWT'yi cookie'ye ekle
    res.cookie('accessToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 1 gün
    });
    // CSRF token'ı da cookie olarak gönder (JavaScript'ten erişilebilir)
    res.cookie('csrfToken', csrfToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 1 gün
    });
    res.status(200).json({
      message: 'Admin girişi başarılı.',
      token,
      csrfToken,
      admin: {
        id: Number(admin.id),
        email: admin.email,
        name: admin.name || '',
        isActive: admin.isActive,
        role: 'systemAdmin'
      }
    });
  } catch (error) {
    console.error('Admin login hatası:', error);
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
  getAuthStatus,
  forgotPassword,
  verifyResetToken,
  resetPassword,
  adminLogin,
};
