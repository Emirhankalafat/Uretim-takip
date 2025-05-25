const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();

async function createConfirmToken(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 saat

  await prisma.confirmToken.create({
    data: {
      user_id: Number(userId),
      token,
      expiresAt,
    },
  });

  return token;
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

module.exports = { 
  createConfirmToken, 
  createJWTToken, 
  verifyJWTToken 
};
