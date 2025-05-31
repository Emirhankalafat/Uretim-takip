const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function createConfirmToken(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 saat

  try {
    await prisma.confirmToken.create({
      data: {
        user_id: BigInt(userId),
        token,
        expiresAt,
      },
    });
    console.log('Confirm token başarıyla oluşturuldu:', token);
    return token;
  } catch (error) {
    console.error('Confirm token oluşturma hatası:', error);
    throw error;
  }
}

function createJWTToken(userId, userMail, companyId) {
  const payload = {
    userId: Number(userId),
    userMail: userMail,
    companyId: Number(companyId)
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET || 'default_secret', {
    expiresIn: '15m' // 15 dakika
  });
}

function verifyJWTToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
  } catch (error) {
    return null;
  }
}

async function createInviteToken(companyId, email) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 gün

  await prisma.invite.create({
    data: {
      Company_id: BigInt(companyId),
      mail: email,
      invite_token: token,
      expires_at: expiresAt,
    },
  });

  return token;
}

// Refresh token oluşturma
function createRefreshToken() {
  return crypto.randomBytes(64).toString('hex');
}

// Refresh token'ı veritabanına kaydetme
async function saveRefreshToken(userId, refreshToken) {
  const tokenHash = await bcrypt.hash(refreshToken, 10);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 gün
  
  return await prisma.refreshToken.create({
    data: {
      userId: BigInt(userId),
      tokenHash,
      expiresAt,
    },
  });
}

// Refresh token doğrulama
async function verifyRefreshToken(refreshToken) {
  try {
    // Aktif refresh token'ları getir
    const refreshTokens = await prisma.refreshToken.findMany({
      where: {
        revoked: false,
        expiresAt: {
          gt: new Date()
        }
      },
      include: {
        user: true
      }
    });

    // Token'ı hash'lerle karşılaştır
    for (const tokenRecord of refreshTokens) {
      const isValid = await bcrypt.compare(refreshToken, tokenRecord.tokenHash);
      if (isValid) {
        return tokenRecord;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Refresh token doğrulama hatası:', error);
    return null;
  }
}

// Refresh token'ı revoke etme
async function revokeRefreshToken(tokenId) {
  return await prisma.refreshToken.update({
    where: { id: BigInt(tokenId) },
    data: { revoked: true }
  });
}

// Kullanıcının tüm refresh token'larını revoke etme
async function revokeAllUserRefreshTokens(userId) {
  return await prisma.refreshToken.updateMany({
    where: { 
      userId: BigInt(userId),
      revoked: false
    },
    data: { revoked: true }
  });
}

// Süresi dolmuş token'ları revoke etme (silmek yerine)
async function revokeExpiredTokens() {
  return await prisma.refreshToken.updateMany({
    where: {
      expiresAt: { lt: new Date() },
      revoked: false
    },
    data: {
      revoked: true
    }
  });
}

// Çok eski revoke edilmiş token'ları fiziksel olarak sil (isteğe bağlı)
async function deleteOldRevokedTokens(daysOld = 30) {
  const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
  
  return await prisma.refreshToken.deleteMany({
    where: {
      revoked: true,
      createdAt: { lt: cutoffDate }
    }
  });
}

// Password reset token oluşturma
async function createPasswordResetToken(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 saat

  try {
    // Kullanıcının önceki reset token'larını sil
    await prisma.passwordResetToken.deleteMany({
      where: {
        user_id: BigInt(userId),
      },
    });

    // Yeni token oluştur
    await prisma.passwordResetToken.create({
      data: {
        user_id: BigInt(userId),
        token,
        expiresAt,
      },
    });
    
    console.log('Password reset token başarıyla oluşturuldu:', token);
    return token;
  } catch (error) {
    console.error('Password reset token oluşturma hatası:', error);
    throw error;
  }
}

// Password reset token doğrulama
async function verifyPasswordResetToken(token) {
  try {
    const tokenRecord = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!tokenRecord) {
      return { valid: false, message: 'Geçersiz token' };
    }

    if (tokenRecord.used) {
      return { valid: false, message: 'Token zaten kullanılmış' };
    }

    if (tokenRecord.expiresAt < new Date()) {
      return { valid: false, message: 'Token süresi dolmuş' };
    }

    return { valid: true, user: tokenRecord.user, tokenId: tokenRecord.id };
  } catch (error) {
    console.error('Password reset token doğrulama hatası:', error);
    return { valid: false, message: 'Sunucu hatası' };
  }
}

// Password reset token'ı kullanılmış olarak işaretle
async function markPasswordResetTokenAsUsed(tokenId) {
  try {
    await prisma.passwordResetToken.update({
      where: { id: BigInt(tokenId) },
      data: { used: true },
    });
    return true;
  } catch (error) {
    console.error('Password reset token güncelleme hatası:', error);
    return false;
  }
}

// Süresi dolmuş password reset token'ları temizle
async function cleanupExpiredPasswordResetTokens() {
  try {
    const result = await prisma.passwordResetToken.deleteMany({
      where: {
        expiresAt: { lt: new Date() }
      }
    });
    
    console.log(`${result.count} süresi dolmuş password reset token silindi`);
    return result.count;
  } catch (error) {
    console.error('Süresi dolmuş token temizleme hatası:', error);
    return 0;
  }
}

module.exports = { 
  createConfirmToken, 
  createJWTToken, 
  verifyJWTToken,
  createInviteToken,
  createRefreshToken,
  saveRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
  revokeAllUserRefreshTokens,
  revokeExpiredTokens,
  deleteOldRevokedTokens,
  createPasswordResetToken,
  verifyPasswordResetToken,
  markPasswordResetTokenAsUsed,
  cleanupExpiredPasswordResetTokens
};
