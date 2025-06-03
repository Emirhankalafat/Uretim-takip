const { createLogger, format, transports } = require('winston');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.printf(({ timestamp, level, message, ...meta }) => {
      return `${timestamp} [${level.toUpperCase()}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
    })
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'logs/error.log', level: 'error' }),
    new transports.File({ filename: 'logs/combined.log' })
  ]
});

// Veritabanına log yazan fonksiyon
async function logToDb({ type = 'info', message, details = null, user_id = null, endpoint = null, ip = null, stack = null }) {
  try {
    await prisma.systemLog.create({
      data: {
        type,
        message,
        details: details ? (typeof details === 'string' ? details : JSON.stringify(details)) : null,
        user_id: user_id ? BigInt(user_id) : null,
        endpoint,
        ip,
        stack
      }
    });
  } catch (err) {
    logger.error('DB log yazılamadı', { err, type, message, details, user_id, endpoint, ip, stack });
  }
}

module.exports = logger;
module.exports.logToDb = logToDb; 