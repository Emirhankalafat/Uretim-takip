# 🔒 Güvenlik Dokümantasyonu

Bu dokümant Üretim Takip Sistemi'nin güvenlik özelliklerini ve en iyi uygulamalarını açıklar.

## 📋 İçindekiler

1. [Güvenlik Katmanları](#güvenlik-katmanları)
2. [Authentication & Authorization](#authentication--authorization)
3. [Input Validation & Sanitization](#input-validation--sanitization)
4. [CSRF Koruması](#csrf-koruması)
5. [Rate Limiting](#rate-limiting)
6. [SSL/TLS Konfigürasyonu](#ssltls-konfigürasyonu)
7. [Environment Variables](#environment-variables)
8. [Production Güvenlik Kontrol Listesi](#production-güvenlik-kontrol-listesi)

## 🛡️ Güvenlik Katmanları

### 1. Transport Layer Security
- **HTTPS zorunlu** production ortamında
- **HSTS headers** tarayıcı güvenliği için
- **SSL/TLS sertifika** validasyonu

### 2. Application Level Security
- **Helmet.js** güvenlik header'ları
- **CORS** konfigürasyonu
- **Input sanitization** XSS koruması için
- **Rate limiting** DDoS koruması için

### 3. Authentication & Session Management
- **JWT tokens** stateless authentication
- **Refresh token rotation** gelişmiş güvenlik
- **CSRF protection** session hijacking koruması
- **Secure cookies** HttpOnly, Secure, SameSite

## 🔐 Authentication & Authorization

### JWT Token Sistemi
```javascript
// Token'lar bcrypt ile hashlenmiş olarak saklanır
const tokenHash = await bcrypt.hash(refreshToken, 10);

// Access token'lar kısa süreli (15 dakika)
const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });

// Refresh token'lar uzun süreli (30 gün) ama rotate edilir
const refreshToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
```

### Role-Based Access Control
- **SuperAdmin**: Tüm yetkilere sahip
- **Admin**: Şirket düzeyinde yönetim
- **User**: Sınırlı işlemler
- **Permission Middleware**: Endpoint düzeyinde yetki kontrolü

### Password Security
- **bcrypt hashing** (salt rounds: 10)
- **Minimum 8 karakter** şifre uzunluğu
- **Complexity requirements**: büyük/küçük harf, rakam, özel karakter

## 🧹 Input Validation & Sanitization

### XSS Koruması
```javascript
// DOMPurify ile sanitization
const sanitizedInput = DOMPurify.sanitize(input, {
  ALLOWED_TAGS: [],
  ALLOWED_ATTR: []
});
```

### SQL Injection Koruması
- **Prisma ORM** prepared statements kullanır
- **Input pattern validation** ek koruma için
- **Parameter sanitization** tüm giriş verilerinde

### Validation Rules
- **Email validation** RFC compliant
- **Password strength** complexity kontrolü
- **Input length limits** buffer overflow koruması
- **Type validation** veri tipi kontrolü

## 🛡️ CSRF Koruması

### Token Sistemi
- **Redis tabanlı** CSRF token storage
- **Token rotation** her istekte yeni token
- **Domain validation** token'ın geçerli domain'den geldiğini doğrula

### Implementation
```javascript
// CSRF token oluştur
const csrfToken = crypto.randomBytes(32).toString('hex');
await redisClient.setEx(`csrf:${userId}`, 3600, csrfToken);

// Middleware ile doğrula
const isValid = await verifyCsrfToken(userId, requestToken);
```

## ⏱️ Rate Limiting

### Endpoint Bazlı Limitler
- **Authentication**: 25 istek / 15 dakika
- **Payment**: 10 istek / 10 dakika
- **Invites**: 5 istek / 1 saat
- **Password Reset**: 5 istek / 10 dakika

### Redis Store
```javascript
const rateLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: async (...args) => redisClient.sendCommand(args)
  }),
  windowMs: 15 * 60 * 1000,
  max: 25
});
```

## 🔒 SSL/TLS Konfigürasyonu

### Production Requirements
```bash
# Environment variables
SSL_CERT_PATH=/etc/ssl/certs/server.crt
SSL_KEY_PATH=/etc/ssl/private/server.key
SSL_CA_PATH=/etc/ssl/certs/ca-bundle.crt
```

### Security Headers
```javascript
// HSTS
'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'

// Frame Protection
'X-Frame-Options': 'DENY'

// Content Type Protection
'X-Content-Type-Options': 'nosniff'
```

## 🔑 Environment Variables

### Critical Variables
```bash
# DEĞERT İLMESİ GEREKEN
JWT_SECRET=<64+ karakter güçlü secret>
DATABASE_URL=postgresql://user:STRONG_PASSWORD@host:5432/db
REDIS_PASSWORD=<güçlü Redis şifresi>
EMAIL_PASS=<app-specific password>

# Production'da HTTPS
FRONTEND_URL=https://yourdomain.com
BACKEND_URL=https://api.yourdomain.com
```

### Security Notes
- ❌ **Asla** production secret'ları repository'e commit etmeyin
- ✅ **Kullanın** environment-specific secret management (AWS Secrets Manager, etc.)
- ✅ **Rotate edin** secret'ları düzenli olarak
- ✅ **Strong passwords** kullanın (minimum 12 karakter)

## ✅ Production Güvenlik Kontrol Listesi

### Deployment Öncesi
- [ ] Tüm default password'ler değiştirildi
- [ ] JWT secret en az 64 karakter güçlü string
- [ ] SSL sertifikaları kuruldu ve test edildi
- [ ] Database şifreleri güçlü ve benzersiz
- [ ] CORS allowed origins production domain'leri içeriyor
- [ ] Rate limiting production değerleriyle ayarlandı

### Runtime Monitoring
- [ ] SSL sertifikası süresi izleniyor
- [ ] Failed authentication attempt'ler loglanıyor
- [ ] Rate limit aşımları izleniyor
- [ ] Suspicious activity monitoring aktif
- [ ] Error logları hassas bilgi içermiyor

### Regular Maintenance
- [ ] Dependency security scan (npm audit)
- [ ] Log rotation ve temizlik
- [ ] Token cleanup job çalışıyor
- [ ] Database connection pooling optimized
- [ ] Redis memory usage monitored

## 🚨 Güvenlik İhlali Durumunda

### Immediate Actions
1. **Identify scope** - Hangi data etkilendi?
2. **Revoke tokens** - Tüm active session'ları sonlandır
3. **Rotate secrets** - JWT secret, API key'leri değiştir
4. **Investigate logs** - Saldırı vektörünü belirle
5. **Notify users** - Gerekirse kullanıcıları bilgilendir

### Prevention Updates
1. **Patch vulnerabilities** - Güvenlik güncellemelerini uygula
2. **Review access controls** - Permission'ları gözden geçir
3. **Update monitoring** - Detection capability'yi artır
4. **Security audit** - Third-party assessment yaptır

## 📞 Security Contact

Güvenlik açığı bildirimi için:
- Email: security@yourdomain.com
- Responsible disclosure policy uygulanır
- 24-48 saat içinde yanıt garantisi

---

**Not**: Bu dokümantasyon düzenli olarak güncellenmelidir. Son güncelleme: 2024 