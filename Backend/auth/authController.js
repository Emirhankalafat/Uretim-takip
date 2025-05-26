const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
require('dotenv').config();
const { createConfirmToken, createJWTToken } = require('./utils/tokenUtils');
const { sendConfirmEmail } = require('./utils/emailUtils');

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

    // JWT token oluştur
    const token = createJWTToken(Number(user.id), user.Mail, Number(user.company_id));

    // Cookie'ye token'ı kaydet (15 dakika)
    res.cookie('auth_token', token, {
      httpOnly: true, // XSS saldırılarına karşı koruma
      secure: process.env.NODE_ENV === 'production', // HTTPS'de secure flag
      sameSite: 'strict', // CSRF saldırılarına karşı koruma
      maxAge: 15 * 60 * 1000 // 15 dakika (milisaniye cinsinden)
    });

    res.status(200).json({
      message: 'Giriş başarılı.',
      user: {
        id: Number(user.id),
        name: user.Name,
        mail: user.Mail,
        company_id: Number(user.company_id),
        company_name: user.company.Name,
        is_SuperAdmin: user.is_SuperAdmin
      }
    });

  } catch (error) {
    console.error('Giriş hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

const logoutUser = (req, res) => {
  try {
    // Cookie'yi temizle
    res.clearCookie('auth_token', {
      httpOnly: true,
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

module.exports = {
  registerCompanyUser,
  confirmUser,
  loginUser,
  logoutUser,
  getUserProfile,
  getDashboardProfile,
};
