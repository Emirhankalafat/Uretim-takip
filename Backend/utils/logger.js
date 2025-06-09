const { createLogger, format, transports } = require('winston');
const { getPrismaClient, checkPrismaClient } = require('./prismaClient');

// Merkezi prisma client'ı al
const prisma = getPrismaClient();

const logger = createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'error' : 'info'),
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.printf(({ timestamp, level, message, ...meta }) => {
      const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
      return `${timestamp} [${level.toUpperCase()}]: ${message} ${metaStr}`;
    })
  ),
  transports: [
    // Console transport - production'da sadece error
    new transports.Console({
      level: process.env.NODE_ENV === 'production' ? 'error' : 'info',
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    }),
    // File transports
    new transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB  
      maxFiles: 5
    })
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