const { body, param, query, validationResult } = require('express-validator');
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

// DOMPurify için window objesi oluştur
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

/**
 * Input sanitization fonksiyonu
 * XSS saldırılarını önlemek için HTML içeriğini temizler
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') {
    return input;
  }
  
  // HTML etiketlerini ve zararlı içerikleri temizle
  return DOMPurify.sanitize(input, { 
    ALLOWED_TAGS: [], // Hiçbir HTML etiketine izin verme
    ALLOWED_ATTR: [] // Hiçbir HTML attribute'una izin verme
  });
}

/**
 * Object içindeki tüm string değerleri sanitize et
 */
function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * Express middleware for input sanitization
 */
const sanitizeMiddleware = (req, res, next) => {
  // Body'yi sanitize et
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  
  // Query parametrelerini sanitize et
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  
  // Params'ları sanitize et
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }
  
  next();
};

/**
 * Common validation rules
 */
const validationRules = {
  // E-mail validation
  email: () => body('Mail')
    .isEmail()
    .normalizeEmail()
    .withMessage('Geçerli bir e-mail adresi giriniz'),
    
  // Password validation
  password: () => body('password')
    .isLength({ min: 8 })
    .withMessage('Şifre en az 8 karakter olmalıdır')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Şifre en az bir büyük harf, bir küçük harf, bir rakam ve bir özel karakter içermelidir'),
    
  // Name validation
  name: () => body('Name')
    .isLength({ min: 2, max: 50 })
    .withMessage('İsim 2-50 karakter arasında olmalıdır')
    .matches(/^[a-zA-ZçğıöşüÇĞIİÖŞÜ\s]+$/)
    .withMessage('İsim sadece harf ve boşluk içerebilir'),
    
  // ID validation
  id: (fieldName = 'id') => param(fieldName)
    .isInt({ min: 1 })
    .withMessage('Geçerli bir ID giriniz'),
    
  // Description validation
  description: (fieldName = 'description') => body(fieldName)
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Açıklama en fazla 1000 karakter olabilir'),
    
  // Order number validation
  orderNumber: () => body('order_number')
    .matches(/^[A-Z0-9-]+$/)
    .withMessage('Sipariş numarası sadece büyük harf, rakam ve tire içerebilir'),
    
  // Phone validation
  phone: () => body('phone')
    .optional()
    .matches(/^[0-9+\-\s()]+$/)
    .withMessage('Geçerli bir telefon numarası giriniz')
};

/**
 * Validation error handler middleware
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Giriş verilerinde hata var',
      errors: errors.array().map(error => ({
        field: error.param,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

/**
 * SQL Injection koruması için string kontrolü
 * Prisma ORM kullandığımız için ekstra koruma
 */
function preventSQLInjection(input) {
  if (typeof input !== 'string') {
    return input;
  }
  
  // Tehlikeli SQL pattern'lerini kontrol et
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,
    /(\'|\"|;|--|\*|\|)/g,
    /(\b(OR|AND)\b.*=.*)/gi
  ];
  
  for (const pattern of sqlPatterns) {
    if (pattern.test(input)) {
      throw new Error('Güvenlik nedeniyle bu giriş kabul edilemez');
    }
  }
  
  return input;
}

module.exports = {
  sanitizeInput,
  sanitizeObject,
  sanitizeMiddleware,
  validationRules,
  handleValidationErrors,
  preventSQLInjection
}; 