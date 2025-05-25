# Üretim Takip Sistemi

Bu proje, şirketler için kullanıcı yönetimi ve yetkilendirme sistemi içeren bir üretim takip sistemidir.

## 🚀 Özellikler

- **Kullanıcı Kaydı ve Girişi**: Şirket bazlı kullanıcı kaydı
- **Yetki Yönetimi**: Kullanıcılara özel yetkiler atama
- **Super Admin Sistemi**: Tam yetki kontrolü
- **Güvenli API**: JWT token tabanlı kimlik doğrulama
- **Modern UI**: React + Tailwind CSS ile responsive tasarım

## 🛠️ Teknolojiler

### Backend
- Node.js + Express.js
- PostgreSQL + Prisma ORM
- JWT Authentication
- bcryptjs (şifre hashleme)
- CORS middleware

### Frontend
- React.js
- React Router DOM
- Tailwind CSS
- Axios (HTTP client)
- Context API (state management)

## 📦 Kurulum

### 1. Projeyi klonlayın
```bash
git clone <repo-url>
cd Üretim-Takip-Sistemi
```

### 2. Backend Kurulumu
```bash
cd Backend
npm install
```

### 3. Veritabanı Kurulumu
```bash
# .env dosyası oluşturun ve DATABASE_URL'i ekleyin
echo "DATABASE_URL=postgresql://username:password@localhost:5432/database_name" > .env
echo "JWT_SECRET=your_jwt_secret_key" >> .env

# Prisma migration'ları çalıştırın
npx prisma migrate dev
```

### 4. Frontend Kurulumu
```bash
cd ../frontend
npm install
```

## 🚀 Çalıştırma

### Backend'i başlatın (Port 3001)
```bash
cd Backend
npm start
```

### Frontend'i başlatın (Port 3000)
```bash
cd frontend
npm start
```

## 📱 Kullanım

1. **Kayıt Ol**: `/register` - Yeni şirket ve super admin kullanıcı oluşturun
2. **Giriş Yap**: `/login` - Mevcut hesabınızla giriş yapın
3. **Dashboard**: `/dashboard` - Ana sayfa
4. **Kullanıcı Yönetimi**: `/user-management` - Kullanıcıları ve yetkilerini yönetin
5. **Yetkilerim**: `/my-permissions` - Kendi yetkilerinizi görüntüleyin

## 🔐 Yetki Sistemi

### Super Admin
- Tüm yetkilere sahiptir
- USER_MANAGEMENT yetkisini verebilir/çıkarabilir
- Tüm kullanıcıları yönetebilir

### USER_MANAGEMENT Yetkili Kullanıcı
- USER_MANAGEMENT dışındaki yetkileri verebilir/çıkarabilir
- Aynı şirketteki kullanıcıları yönetebilir

### Normal Kullanıcı
- Sadece kendi yetkilerini görüntüleyebilir

## 🔧 API Endpoints

### Auth
- `POST /api/auth/register` - Şirket kaydı
- `POST /api/auth/login` - Kullanıcı girişi
- `POST /api/auth/logout` - Çıkış
- `GET /api/auth/profile` - Kullanıcı profili

### Permissions
- `GET /api/permissions/permissions` - Tüm yetkiler
- `GET /api/permissions/company-users` - Şirket kullanıcıları
- `GET /api/permissions/user/:userId` - Kullanıcı yetkileri
- `POST /api/permissions/add-permission` - Yetki ekleme
- `POST /api/permissions/remove-permission` - Yetki çıkarma

## 🎨 Sayfalar

1. **Register** - Şirket kaydı formu
2. **Login** - Giriş formu
3. **Dashboard** - Ana sayfa
4. **User Management** - Kullanıcı yönetimi
5. **My Permissions** - Kişisel yetkiler

## 🔒 Güvenlik Özellikleri

- JWT token tabanlı kimlik doğrulama
- Cookie tabanlı session yönetimi
- Şifre hashleme (bcryptjs)
- CORS koruması
- Route bazlı yetki kontrolü
- Super Admin özel kontrolleri

## 📝 Notlar

- USER_MANAGEMENT yetkisi sadece Super Admin tarafından verilebilir
- Kullanıcılar sadece aynı şirketteki diğer kullanıcıları yönetebilir
- Super Admin'ler tüm şirketlere erişebilir
- Frontend otomatik olarak authentication durumunu kontrol eder 