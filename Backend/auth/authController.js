const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
require('dotenv').config();
const { createConfirmToken, createJWTToken } = require('./utils/tokenUtils');

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

    res.status(201).json({
      message: 'Kayıt başarılı. Lütfen e-posta ile doğrulama yapın.',
      user: {
        id: Number(newUser.id),
        name: newUser.Name,
        mail: newUser.Mail,
        company_id: Number(newCompany.id),
      },
      confirm_token: confirmToken,
    });
  } catch (error) {
    console.error('Kayıt hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

const confirmUser = async (req, res) => {
  const { token } = req.query;

  try {
    const record = await prisma.confirmToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!record || record.expiresAt < new Date()) {
      return res.status(400).json({ message: 'Geçersiz veya süresi dolmuş token.' });
    }

    // Kullanıcıyı onayla
    await prisma.user.update({
      where: { id: record.user_id },
      data: { is_confirm: true },
    });

    // Tokenı sil (isteğe bağlı ama iyi bir uygulama)
    await prisma.confirmToken.delete({
      where: { token },
    });

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

module.exports = {
  registerCompanyUser,
  confirmUser,
  loginUser,
  logoutUser,
  getUserProfile,
};
