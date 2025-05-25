const { verifyJWTToken } = require('../utils/tokenUtils');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const authenticateToken = async (req, res, next) => {
  try {
    // Cookie'den token'ı al
    const token = req.cookies.auth_token;

    if (!token) {
      return res.status(401).json({ message: 'Erişim token\'ı bulunamadı. Lütfen giriş yapın.' });
    }

    // Token'ı doğrula
    const decoded = verifyJWTToken(token);
    if (!decoded) {
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
      mail: user.Mail,
      name: user.Name,
      company_id: Number(user.company_id),
      company_name: user.company.Name,
      is_SuperAdmin: user.is_SuperAdmin
    };

    next();
  } catch (error) {
    console.error('Auth middleware hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

module.exports = { authenticateToken }; 