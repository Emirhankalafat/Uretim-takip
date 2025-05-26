# Üretim Takip Sistemi - Frontend

Modern React tabanlı üretim takip sistemi frontend uygulaması.

## 🚀 Teknoloji Stack

- **React 19** - UI framework
- **Vite** - Build tool ve dev server
- **TailwindCSS** - Utility-first CSS framework
- **Redux Toolkit** - State management
- **React Router v6** - Client-side routing
- **Axios** - HTTP client
- **React Hook Form** - Form management

## 📁 Proje Yapısı

```
src/
├── features/            # Özellik bazlı modüller
│   ├── auth/           # Authentication modülü
│   │   ├── components/ # Auth bileşenleri
│   │   ├── pages/      # Auth sayfaları (Login, Register, MyPermissions)
│   │   ├── hooks/      # Auth custom hooks
│   │   ├── services/   # Auth API servisleri
│   │   └── authSlice.js # Redux slice
│   └── users/          # User management modülü
│       ├── components/ # User bileşenleri
│       ├── pages/      # User sayfaları (UserManagement)
│       └── services/   # User API servisleri
├── components/         # Global bileşenler
├── layouts/            # Sayfa düzenleri (MainLayout)
├── routes/             # React Router route tanımları
├── services/           # Global API servisleri
├── hooks/              # Global custom hooks
├── utils/              # Yardımcı fonksiyonlar
├── store/              # Redux store konfigürasyonu
├── pages/              # Genel sayfalar (Dashboard)
├── App.jsx             # Ana uygulama bileşeni
└── main.jsx            # React başlangıç noktası
```

## 🔧 Kurulum

1. **Bağımlılıkları yükleyin:**
   ```bash
   npm install
   ```

2. **Geliştirme sunucusunu başlatın:**
   ```bash
   npm run dev
   ```

3. **Tarayıcıda açın:**
   ```
   http://localhost:5173
   ```

## 📱 Sayfalar

### 🔐 Authentication
- **Login** (`/login`) - Kullanıcı girişi
- **Register** (`/register`) - Yeni kullanıcı kaydı

### 🏠 Dashboard
- **Dashboard** (`/dashboard`) - Ana sayfa, istatistikler ve hızlı işlemler

### 👤 User Management
- **My Permissions** (`/my-permissions`) - Kullanıcının kendi yetkileri
- **User Management** (`/user-management`) - Kullanıcı yönetimi (sadece admin)

## 🔒 Yetkilendirme

### Route Koruması
- **PublicRoute**: Giriş yapmış kullanıcıları dashboard'a yönlendirir
- **ProtectedRoute**: Giriş yapmamış kullanıcıları login'e yönlendirir
- **AdminRoute**: Admin olmayan kullanıcıları dashboard'a yönlendirir

### Kullanıcı Rolleri
- **User**: Temel kullanıcı (dashboard, my-permissions)
- **Admin**: Yönetici (tüm sayfalar + user management)

## 🎨 UI/UX Özellikleri

- **Responsive Design**: Mobil ve desktop uyumlu
- **Modern Interface**: TailwindCSS ile profesyonel tasarım
- **Loading States**: Yükleme durumları
- **Error Handling**: Hata yönetimi
- **Form Validation**: React Hook Form ile form doğrulama
- **Toast Notifications**: Kullanıcı bildirimleri

## 🔧 API Entegrasyonu

### Base URL
```javascript
const API_BASE_URL = 'http://localhost:3000/api'
```

### Authentication Endpoints
- `POST /auth/login` - Kullanıcı girişi
- `POST /auth/register` - Kullanıcı kaydı
- `GET /auth/profile` - Kullanıcı profili
- `GET /auth/permissions` - Kullanıcı yetkileri

### User Management Endpoints
- `GET /users` - Tüm kullanıcılar
- `GET /users/:id` - Kullanıcı detayı
- `POST /users` - Yeni kullanıcı
- `PUT /users/:id` - Kullanıcı güncelleme
- `DELETE /users/:id` - Kullanıcı silme
- `PUT /users/:id/permissions` - Kullanıcı yetkileri güncelleme

## 🛠 Geliştirme

### Available Scripts

```bash
# Geliştirme sunucusu
npm run dev

# Production build
npm run build

# Linting
npm run lint

# Preview production build
npm run preview
```

### State Management

Redux Toolkit kullanılarak state yönetimi:

```javascript
// Auth state
{
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null
}
```

### Form Validation

React Hook Form ile form doğrulama:

```javascript
const {
  register,
  handleSubmit,
  formState: { errors },
} = useForm()
```

## 🔐 Güvenlik

- **JWT Token**: localStorage'da saklanır
- **Axios Interceptors**: Otomatik token ekleme
- **Route Guards**: Sayfa erişim kontrolü
- **Input Validation**: Form doğrulama
- **XSS Protection**: React'ın built-in koruması

## 📦 Build ve Deploy

```bash
# Production build
npm run build

# Build dosyaları dist/ klasöründe oluşur
```

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.
