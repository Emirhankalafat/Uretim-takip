const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
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

module.exports = { 
  createConfirmToken, 
  createJWTToken, 
  verifyJWTToken,
  createInviteToken
};
