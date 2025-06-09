import DOMPurify from 'dompurify';

/**
 * Frontend XSS koruması için input sanitization
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') {
    return input;
  }
  
  // HTML etiketlerini ve zararlı içerikleri temizle
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // Hiçbir HTML etiketine izin verme
    ALLOWED_ATTR: [] // Hiçbir HTML attribute'una izin verme
  });
};

/**
 * Güvenli HTML render için (eğer HTML içerik gösterilmesi gerekiyorsa)
 */
export const sanitizeHTML = (html) => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: []
  });
};

/**
 * Object içindeki tüm string değerleri sanitize et
 */
export const sanitizeObject = (obj) => {
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
};

/**
 * Form data sanitization hook
 */
export const useSanitizedForm = (formData) => {
  return sanitizeObject(formData);
};

/**
 * Güvenli URL validation
 */
export const isValidURL = (url) => {
  try {
    const urlObj = new URL(url);
    // Sadece HTTP/HTTPS protokollerine izin ver
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
};

/**
 * SQL injection pattern kontrolü (frontend validation)
 */
export const hasSQLInjectionPattern = (input) => {
  if (typeof input !== 'string') {
    return false;
  }
  
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,
    /(\'|\"|;|--|\*|\|)/g,
    /(\b(OR|AND)\b.*=.*)/gi
  ];
  
  return sqlPatterns.some(pattern => pattern.test(input));
};

/**
 * Email validation
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Password strength validation
 */
export const validatePasswordStrength = (password) => {
  const checks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[@$!%*?&]/.test(password)
  };
  
  const score = Object.values(checks).filter(Boolean).length;
  
  return {
    isValid: score === 5,
    score,
    checks,
    strength: score <= 2 ? 'weak' : score <= 4 ? 'medium' : 'strong'
  };
};

/**
 * CSRF token korumalı API çağrıları için wrapper
 */
export const secureApiCall = async (apiFunction, data = null) => {
  try {
    // Data'yı sanitize et
    const sanitizedData = data ? sanitizeObject(data) : null;
    
    // API çağrısını yap
    const response = await apiFunction(sanitizedData);
    
    return response;
  } catch (error) {
    console.error('Secure API call failed:', error);
    throw error;
  }
};

export default {
  sanitizeInput,
  sanitizeHTML,
  sanitizeObject,
  useSanitizedForm,
  isValidURL,
  hasSQLInjectionPattern,
  isValidEmail,
  validatePasswordStrength,
  secureApiCall
}; 