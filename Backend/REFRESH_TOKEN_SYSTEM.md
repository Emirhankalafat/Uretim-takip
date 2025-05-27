# 🔄 Refresh Token Sistemi

Bu proje **JWT Access Token + Refresh Token** sistemi ile güçlendirilmiştir.

## 📋 Sistem Özellikleri

### ✅ Güvenlik Önlemleri
- [x] **HttpOnly Cookie'ler** - XSS saldırılarına karşı koruma
- [x] **Secure & SameSite Cookie'ler** - CSRF saldırılarına karşı koruma  
- [x] **Refresh Token Hash'leme** - Veritabanında bcrypt ile hashlenir
- [x] **Token Rotasyonu** - Her refresh'te yeni token'lar üretilir
- [x] **Otomatik Temizlik** - Süresi dolmuş token'lar otomatik silinir

### ⏱️ Token Süreleri
- **Access Token**: 15 dakika
- **Refresh Token**: 7 gün

## 🔧 Backend Implementasyonu

### 1. Veri Modeli (Prisma)
```prisma
model RefreshToken {
  id          BigInt   @id @default(autoincrement())
  user        User     @relation(fields: [userId], references: [id])
  userId      BigInt
  tokenHash   String
  expiresAt   DateTime
  revoked     Boolean  @default(false)
  createdAt   DateTime @default(now())

  @@map("refresh_tokens")
}
```

### 2. API Endpoint'leri

#### 🔑 Login
```
POST /api/auth/login
```
- Access token (15dk) + Refresh token (7 gün) oluşturur
- Her iki token'ı HttpOnly cookie olarak gönderir

#### 🔄 Token Yenileme  
```
POST /api/auth/refresh-token
```
- Refresh token'ı doğrular
- Yeni access + refresh token oluşturur (token rotasyonu)
- Eski refresh token'ı revoke eder

#### 🚪 Logout
```
POST /api/auth/logout
```
- Refresh token'ı revoke eder
- Cookie'leri temizler

### 3. Middleware
- `authenticateToken`: Access token'ı doğrular
- Cookie'den `accessToken`'ı okur

### 4. Otomatik Token Yönetimi
- Her 24 saatte bir süresi dolmuş token'lar revoke edilir (silinmez)
- Revoke edilmiş token'lar kullanılamaz hale gelir
- İsteğe bağlı: 30+ gün önceki revoke token'lar fiziksel silinebilir
- `startTokenCleanupScheduler()` server başlatıldığında çalışır

## 🎯 Frontend Implementasyonu (Axios)

### Otomatik Token Yenileme
```javascript
// Response interceptor - 401 hatalarını yakalar
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !originalRequest._retry) {
      try {
        // Refresh token ile yeni access token al
        await api.post('/auth/refresh-token')
        
        // Orijinal isteği tekrar dene
        return api(originalRequest)
      } catch (refreshError) {
        // Refresh başarısızsa logout yap
        redirectToLogin()
      }
    }
  }
)
```

## 🔄 Akış Diagramı

1. **Kullanıcı giriş yapar**
   - Access token (15dk) + Refresh token (7 gün) oluştur
   - HttpOnly cookie'ler olarak gönder

2. **API istekleri**
   - Access token otomatik gönderilir
   - Geçerliyse normal işlem

3. **Access token süresi dolarsa (15dk sonra)**
   - Axios 401 yakaalar
   - Otomatik `/refresh-token` çağırır
   - Yeni token'lar alır (token rotasyonu)
   - Orijinal isteği tekrarlar

4. **Refresh token da süresi dolarsa (7 gün sonra)**
   - Kullanıcı logout edilir
   - Login sayfasına yönlendirilir

## 🛠️ Kullanım

### Backend Başlatma
```bash
cd Backend
npm start
```

### Database Migration
```bash
npx prisma migrate dev --name add-refresh-token-model
```

### Test Endpoint'leri
```bash
# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"mail":"test@example.com","password":"password123"}' \
  --cookie-jar cookies.txt

# Protected endpoint
curl -X GET http://localhost:3001/api/auth/profile \
  --cookie cookies.txt

# Refresh token
curl -X POST http://localhost:3001/api/auth/refresh-token \
  --cookie cookies.txt

# Logout
curl -X POST http://localhost:3001/api/auth/logout \
  --cookie cookies.txt
```

## 🔍 Monitoring

### Token Durumu Kontrolü
```sql
-- Aktif refresh token'lar
SELECT u.Mail, rt.expiresAt, rt.revoked, rt.createdAt
FROM refresh_tokens rt 
JOIN users u ON rt.userId = u.id 
WHERE rt.revoked = false AND rt.expiresAt > NOW();

-- Revoke edilmiş token'lar
SELECT COUNT(*) as revoked_tokens 
FROM refresh_tokens 
WHERE revoked = true;

-- Süresi dolmuş ama henüz revoke edilmemiş token'lar
SELECT COUNT(*) as expired_not_revoked 
FROM refresh_tokens 
WHERE expiresAt < NOW() AND revoked = false;

-- Eski revoke edilmiş token'lar (30+ gün)
SELECT COUNT(*) as old_revoked_tokens 
FROM refresh_tokens 
WHERE revoked = true AND createdAt < NOW() - INTERVAL '30 days';
```

### Log Monitoring
```bash
# Token revoke logları
tail -f server.log | grep "token"
# Çıktı örneği:
# "Süresi dolmuş token'lar revoke edildi, sayı: 5"
```

## 🚀 Üretim Ortamı

### Environment Variables
```env
NODE_ENV=production
JWT_SECRET=your-super-secure-secret-key
DATABASE_URL=postgresql://user:pass@host:5432/db
```

### HTTPS Gereksinimleri
- Production'da `secure: true` cookie flag'i aktif
- HTTPS sertifikası gerekli
- SameSite=Strict CSRF koruması

## 📊 Performans

- **Memory**: Refresh token'lar bcrypt ile hashlenmiş olarak saklanır
- **Database**: Revoke sistemi ile token tablosu kontrollü büyür, eski token'lar isteğe bağlı silinebilir  
- **Network**: Cookie'ler otomatik gönderilir, manual header yönetimi yok
- **Security**: Token rotasyonu ile aynı token'ın uzun süre kullanılması engellenir 