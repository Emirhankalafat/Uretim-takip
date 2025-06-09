const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
require('dotenv').config();
const { createInviteToken, createConfirmToken } = require('../auth/utils/tokenUtils');
const { sendInviteEmail, sendConfirmEmail } = require('../auth/utils/emailUtils');

// SuperAdmin kullanıcı davet eder
const inviteUser = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email adresi gerekli.' });
    }

    // Email format kontrolü
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Geçerli bir email adresi girin.' });
    }

    // Sadece SuperAdmin davet gönderebilir
    if (!req.user.is_SuperAdmin) {
      return res.status(403).json({ message: 'Sadece SuperAdmin kullanıcı davet edebilir.' });
    }

    const companyId = req.user.company_id;

    // Şirket bilgilerini al (kullanıcı limiti kontrolü için)
    const company = await prisma.company.findUnique({
      where: { id: BigInt(companyId) },
      include: {
        users: {
          where: { is_active: true }
        }
      }
    });

    if (!company) {
      return res.status(404).json({ message: 'Şirket bulunamadı.' });
    }

    // Kullanıcı sayısı limiti kontrolü
    if (company.users.length >= company.Max_User) {
      return res.status(400).json({ 
        message: `Kullanıcı limiti aşıldı. Maksimum ${company.Max_User} kullanıcı ekleyebilirsiniz.` 
      });
    }

    // Bu email ile zaten kayıtlı kullanıcı var mı kontrol et
    const existingUser = await prisma.user.findUnique({
      where: { Mail: email }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Bu email adresi ile zaten kayıtlı bir kullanıcı var.' });
    }

    // Bu email ile bekleyen davet var mı kontrol et
    const existingInvite = await prisma.invite.findFirst({
      where: {
        mail: email,
        Company_id: BigInt(companyId),
        is_confirm: false,
        expires_at: {
          gt: new Date() // Süresi dolmamış
        }
      }
    });

    if (existingInvite) {
      return res.status(400).json({ message: 'Bu email adresine zaten aktif bir davet gönderilmiş.' });
    }

    // Invite token oluştur
    const inviteToken = await createInviteToken(companyId, email);

    // Invite email gönder
    const emailSent = await sendInviteEmail(email, company.Name, inviteToken);

    if (!emailSent) {
      // Email gönderilemezse invite kaydını sil
      await prisma.invite.delete({
        where: { invite_token: inviteToken }
      });
      return res.status(500).json({ message: 'Davet emaili gönderilemedi. Lütfen tekrar deneyin.' });
    }

    res.status(201).json({
      message: 'Davet başarıyla gönderildi.',
      data: {
        email: email,
        company_name: company.Name,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

  } catch (error) {
    console.error('Davet gönderme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// Davet kontrolü (frontend için)
const checkInvite = async (req, res) => {
  try {
    const { token } = req.query;

    console.log('Received token:', token);
    console.log('Token length:', token?.length);

    if (!token) {
      return res.status(400).json({ message: 'Davet token gerekli.' });
    }

    // Önce tüm invite'ları listele (debug için)
    const allInvites = await prisma.invite.findMany({
      select: {
        id: true,
        invite_token: true,
        mail: true,
        is_confirm: true,
        expires_at: true
      }
    });
    console.log('All invites in database:', allInvites);

    // Invite token kontrolü
    const invite = await prisma.invite.findUnique({
      where: { invite_token: token },
      include: { company: true }
    });

    console.log('Found invite:', invite ? 'YES' : 'NO');
    if (invite) {
      console.log('Invite details:', {
        id: invite.id,
        mail: invite.mail,
        is_confirm: invite.is_confirm,
        expires_at: invite.expires_at,
        token_matches: invite.invite_token === token
      });
    } else {
      console.log('No invite found with token:', token);
      console.log('Looking for exact matches...');
      const partialMatch = await prisma.invite.findFirst({
        where: {
          invite_token: {
            contains: token.substring(0, 10)
          }
        }
      });
      console.log('Partial match found:', partialMatch ? 'YES' : 'NO');
    }

    if (!invite) {
      return res.status(400).json({ message: 'Geçersiz davet token.' });
    }

    // Token süresi dolmuş mu kontrol et
    if (invite.expires_at < new Date()) {
      return res.status(400).json({ message: 'Davet süresi dolmuş.' });
    }

    // Davet zaten kullanılmış mı kontrol et
    if (invite.is_confirm) {
      return res.status(400).json({ message: 'Bu davet zaten kullanılmış.' });
    }

    res.status(200).json({
      message: 'Geçerli davet.',
      data: {
        email: invite.mail,
        companyName: invite.company.Name,
        expiresAt: invite.expires_at
      }
    });

  } catch (error) {
    console.error('Davet kontrol hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// Davet edilen kullanıcı daveti kabul eder
const acceptInvite = async (req, res) => {
  try {
    const { inviteToken, name, password } = req.body;

    if (!inviteToken || !name || !password) {
      return res.status(400).json({ message: 'Davet token, isim ve şifre gerekli.' });
    }

    // Şifre uzunluk kontrolü
    if (password.length < 6) {
      return res.status(400).json({ message: 'Şifre en az 6 karakter olmalıdır.' });
    }

    // Invite token kontrolü
    const invite = await prisma.invite.findUnique({
      where: { invite_token: inviteToken },
      include: { company: true }
    });

    if (!invite) {
      return res.status(400).json({ message: 'Geçersiz davet token.' });
    }

    // Token süresi dolmuş mu kontrol et
    if (invite.expires_at < new Date()) {
      return res.status(400).json({ message: 'Davet süresi dolmuş.' });
    }

    // Davet zaten kullanılmış mı kontrol et
    if (invite.is_confirm) {
      return res.status(400).json({ message: 'Bu davet zaten kullanılmış.' });
    }

    // Bu email ile zaten kayıtlı kullanıcı var mı kontrol et
    const existingUser = await prisma.user.findUnique({
      where: { Mail: invite.mail }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Bu email adresi ile zaten kayıtlı bir kullanıcı var.' });
    }

    // Şirket kullanıcı limiti kontrolü
    const company = await prisma.company.findUnique({
      where: { id: invite.Company_id },
      include: {
        users: {
          where: { is_active: true }
        }
      }
    });

    if (company.users.length >= company.Max_User) {
      return res.status(400).json({ 
        message: `Şirket kullanıcı limiti aşıldı. Maksimum ${company.Max_User} kullanıcı olabilir.` 
      });
    }

    // Şifreyi hashle
    const hashedPassword = await bcrypt.hash(password, 10);

    // Kullanıcı oluştur (davet edilen kullanıcı doğrudan confirm)
    const newUser = await prisma.user.create({
      data: {
        Name: name,
        Mail: invite.mail,
        password: hashedPassword,
        is_SuperAdmin: false,
        is_active: true,
        is_confirm: true, // Davet edilen kullanıcı doğrudan confirm
        company_id: invite.Company_id,
      },
    });

    // Invite'ı kullanılmış olarak işaretle
    await prisma.invite.update({
      where: { invite_token: inviteToken },
      data: { is_confirm: true }
    });

    res.status(201).json({
      message: 'Hesap başarıyla oluşturuldu. Artık giriş yapabilirsiniz.',
      user: {
        id: Number(newUser.id),
        name: newUser.Name,
        mail: newUser.Mail,
        company_id: Number(newUser.company_id),
        company_name: company.Name
      }
    });

  } catch (error) {
    console.error('Davet kabul etme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// Şirket kullanıcılarını listeler (SuperAdmin için)
const getCompanyUsers = async (req, res) => {
  try {
    // Sadece SuperAdmin kullanıcıları görebilir
    if (!req.user.is_SuperAdmin) {
      return res.status(403).json({ message: 'Sadece SuperAdmin kullanıcıları görebilir.' });
    }

    const companyId = req.user.company_id;

    const users = await prisma.user.findMany({
      where: {
        company_id: BigInt(companyId)
      },
      select: {
        id: true,
        Name: true,
        Mail: true,
        is_SuperAdmin: true,
        is_active: true,
        is_confirm: true,
        created_at: true
      },
      orderBy: { created_at: 'desc' }
    });

    // BigInt'leri Number'a çevir
    const serializedUsers = users.map(user => ({
      ...user,
      id: Number(user.id)
    }));

    res.status(200).json({
      message: 'Kullanıcılar başarıyla getirildi.',
      data: {
        users: serializedUsers
      }
    });

  } catch (error) {
    console.error('Kullanıcıları listeleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// SuperAdmin'in gönderdiği davetleri listeler
const getInvites = async (req, res) => {
  try {
    // Sadece SuperAdmin davetleri görebilir
    if (!req.user.is_SuperAdmin) {
      return res.status(403).json({ message: 'Sadece SuperAdmin davetleri görebilir.' });
    }

    const companyId = req.user.company_id;

    const invites = await prisma.invite.findMany({
      where: {
        Company_id: BigInt(companyId)
      },
      orderBy: { created_at: 'desc' }
    });

    // BigInt'leri Number'a çevir
    const serializedInvites = invites.map(invite => ({
      ...invite,
      id: Number(invite.id),
      Company_id: Number(invite.Company_id)
    }));

    res.status(200).json({
      message: 'Davetler başarıyla getirildi.',
      data: {
        invites: serializedInvites
      }
    });

  } catch (error) {
    console.error('Davetleri listeleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// Basit kullanıcı listesi (sadece id ve name) - Herhangi bir authenticated kullanıcı için
const getSimpleCompanyUsers = async (req, res) => {
  try {
    const companyId = req.user.company_id;

    const users = await prisma.user.findMany({
      where: {
        company_id: BigInt(companyId),
        is_active: true,
        is_confirm: true
      },
      select: {
        id: true,
        Name: true
      },
      orderBy: { Name: 'asc' }
    });

    // BigInt'leri Number'a çevir
    const serializedUsers = users.map(user => ({
      id: Number(user.id),
      Name: user.Name
    }));

    res.status(200).json({
      message: 'Basit kullanıcı listesi başarıyla getirildi.',
      data: {
        users: serializedUsers
      }
    });

  } catch (error) {
    console.error('Basit kullanıcı listesi hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await prisma.user.findUnique({
      where: { id: BigInt(userId) },
      include: { company: true }
    });
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
    }
    // BigInt alanlarını dönüştür
    const serializedUser = {
      ...user,
      id: Number(user.id),
      company_id: user.company_id ? Number(user.company_id) : undefined
    };
    const serializedCompany = user.company
      ? {
          ...user.company,
          id: Number(user.company.id)
        }
      : null;
    res.status(200).json({ data: { user: serializedUser, company: serializedCompany } });
  } catch (error) {
    console.error('getUserById hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// Genel sistem duyurularını getir
const getAnnouncements = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const now = new Date();

    const announcements = await prisma.announcements.findMany({
      where: {
        isActive: true,
        OR: [
          { validUntil: null }, // Süresiz duyurular
          { validUntil: { gte: now } } // Süresi henüz dolmamış duyurular
        ]
      },
      select: {
        id: true,
        title: true,
        content: true,
        type: true,
        validUntil: true,
        created_at: true
      },
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * limit,
      take: parseInt(limit)
    });

    const totalCount = await prisma.announcements.count({
      where: {
        isActive: true,
        OR: [
          { validUntil: null },
          { validUntil: { gte: now } }
        ]
      }
    });

    // BigInt'leri stringe çevir
    const formattedAnnouncements = announcements.map(announcement => ({
      ...announcement,
      id: announcement.id.toString()
    }));

    res.status(200).json({
      message: 'Duyurular başarıyla getirildi.',
      data: {
        announcements: formattedAnnouncements,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Duyuru getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// Belirli bir duyurunun detayını getir
const getAnnouncementById = async (req, res) => {
  try {
    const { announcementId } = req.params;
    
    // ID'nin numeric olduğunu kontrol et
    if (!/^\d+$/.test(announcementId)) {
      return res.status(400).json({ message: 'Geçersiz duyuru ID formatı.' });
    }
    
    const now = new Date();

    const announcement = await prisma.announcements.findUnique({
      where: { 
        id: BigInt(announcementId)
      },
      select: {
        id: true,
        title: true,
        content: true,
        type: true,
        validUntil: true,
        created_at: true,
        isActive: true
      }
    });

    if (!announcement) {
      return res.status(404).json({ message: 'Duyuru bulunamadı.' });
    }

    // Duyuru aktif mi ve süresi dolmamış mı kontrol et
    if (!announcement.isActive) {
      return res.status(404).json({ message: 'Duyuru artık aktif değil.' });
    }

    if (announcement.validUntil && announcement.validUntil < now) {
      return res.status(404).json({ message: 'Duyuru süresi dolmuş.' });
    }

    // BigInt'i stringe çevir
    const formattedAnnouncement = {
      ...announcement,
      id: announcement.id.toString()
    };

    res.status(200).json({
      message: 'Duyuru detayı başarıyla getirildi.',
      data: {
        announcement: formattedAnnouncement
      }
    });

  } catch (error) {
    console.error('Duyuru detay getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// Şirket profili getir
const getCompanyProfile = async (req, res) => {
  try {
    const companyId = req.user.company_id;

    const company = await prisma.company.findUnique({
      where: { id: BigInt(companyId) },
      select: {
        id: true,
        Name: true,
        Created_At: true,
        Suspscription_package: true,
        Sub_end_time: true,
        Max_User: true,
        api_key: true,
        _count: {
          select: {
            users: { where: { is_active: true } },
            products: true,
            orders: true
          }
        }
      }
    });

    if (!company) {
      return res.status(404).json({ message: 'Şirket bulunamadı.' });
    }

    // API key'i dashboard'daki gibi göster (maskelenmemiş)
    const formattedCompany = {
      ...company,
      id: company.id.toString()
    };

    res.status(200).json({
      message: 'Şirket profili başarıyla getirildi.',
      data: {
        company: formattedCompany
      }
    });

  } catch (error) {
    console.error('Şirket profili getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// Şirket ismini güncelle (SuperAdmin için)
const updateCompanyProfile = async (req, res) => {
  try {
    // Debug log
    console.log('updateCompanyProfile - req.user:', {
      id: req.user.id,
      is_SuperAdmin: req.user.is_SuperAdmin,
      company_id: req.user.company_id,
      name: req.user.Name,
      mail: req.user.Mail
    });

    if (!req.user.is_SuperAdmin) {
      console.log('🚫 SuperAdmin kontrolü başarısız - kullanıcı SuperAdmin değil');
      return res.status(403).json({ message: 'Sadece SuperAdmin şirket profilini düzenleyebilir.' });
    }

    console.log('✅ SuperAdmin kontrolü başarılı');

    const companyId = req.user.company_id;
    const { name } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ message: 'Şirket ismi gerekli.' });
    }

    const updatedCompany = await prisma.company.update({
      where: { id: BigInt(companyId) },
      data: { Name: name.trim() },
      select: {
        id: true,
        Name: true,
        Created_At: true,
        Suspscription_package: true,
        Sub_end_time: true,
        Max_User: true,
        api_key: true
      }
    });

    // BigInt'leri stringe çevir
    const formattedCompany = {
      ...updatedCompany,
      id: updatedCompany.id.toString()
    };

    res.status(200).json({
      message: 'Şirket profili başarıyla güncellendi.',
      data: {
        company: formattedCompany
      }
    });

  } catch (error) {
    console.error('Şirket profili güncelleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

module.exports = {
  inviteUser,
  acceptInvite,
  getInvites,
  checkInvite,
  getCompanyUsers,
  getSimpleCompanyUsers,
  getUserById,
  getAnnouncements,
  getAnnouncementById,
  getCompanyProfile,
  updateCompanyProfile
}; 