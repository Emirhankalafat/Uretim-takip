import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { 
  ChartBarIcon, 
  CogIcon, 
  UserGroupIcon, 
  ClipboardDocumentListIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  SparklesIcon,
  CubeIcon,
  DocumentTextIcon,
  BellIcon,
  ShieldCheckIcon,
  ComputerDesktopIcon,
  ServerIcon,
  ClipboardDocumentCheckIcon,
  UsersIcon,
  BuildingOfficeIcon,
  TagIcon
} from '@heroicons/react/24/outline'

const HomePage = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth)
  const userLoggedIn = isAuthenticated

  const mainFeatures = [
    {
      icon: ClipboardDocumentListIcon,
      title: 'Sipariş Yönetimi',
      description: 'Müşteri ve stok siparişlerini oluşturun, takip edin ve yönetin. Sipariş adımları ile detaylı süreç kontrolü.',
      color: 'from-blue-500 to-cyan-500',
      details: ['Müşteri siparişleri', 'Stok siparişleri', 'Sipariş adımları', 'Durum takibi', 'Deadline yönetimi']
    },
    {
      icon: UsersIcon,
      title: 'Kullanıcı Yönetimi',
      description: 'Çoklu kullanıcı desteği, rol tabanlı erişim kontrolü ve güvenli davet sistemi.',
      color: 'from-purple-500 to-pink-500',
      details: ['Çoklu kullanıcı', 'Rol tabanlı izinler', 'Davet sistemi', 'Kullanıcı aktivasyonu', 'Profil yönetimi']
    },
    {
      icon: CubeIcon,
      title: 'Ürün & Kategori Yönetimi',
      description: 'Kategoriler, ürünler ve üretim adımlarını organize edin. Detaylı ürün tanımlama sistemi.',
      color: 'from-green-500 to-emerald-500',
      details: ['Kategori yapısı', 'Ürün katalogu', 'Üretim adımları', 'Ürün detayları', 'Stok takibi']
    },
    {
      icon: BuildingOfficeIcon,
      title: 'Müşteri Yönetimi',
      description: 'Müşteri bilgilerini düzenleyin, sipariş geçmişini takip edin ve ilişkileri yönetin.',
      color: 'from-orange-500 to-red-500',
      details: ['Müşteri kayıtları', 'İletişim bilgileri', 'Sipariş geçmişi', 'Müşteri notları', 'Relationship tracking']
    }
  ]

  const systemFeatures = [
    {
      title: 'Gelişmiş Authentication',
      items: ['JWT + Refresh Token sistemi', 'CSRF koruması', 'Rate limiting', 'Redis session yönetimi']
    },
    {
      title: 'İzin Sistemi',
      items: ['Rol tabanlı erişim', 'Granüler izinler', 'SuperAdmin yetkileri', 'Modül bazlı kontrol']
    },
    {
      title: 'Bildirim Sistemi',
      items: ['Gerçek zamanlı bildirimler', 'Email entegrasyonu', 'Sipariş durumu bildirimleri', 'Görev atamaları']
    },
    {
      title: 'Şirket Yönetimi',
      items: ['Multi-tenant yapı', 'Şirket bazlı data isolation', 'Kullanıcı limitleri', 'Paket yönetimi']
    },
    {
      title: 'İş Takibi',
      items: ['Kişisel görev listesi', 'Atanan işler', 'İş durumu takibi', 'Deadline uyarıları']
    },
    {
      title: 'Raporlama',
      items: ['Sipariş raporları', 'Performans analizleri', 'Kullanıcı aktivite logları', 'İstatistikler']
    }
  ]

  const techStack = [
    { name: 'MCP Desteği', desc: 'Model Context Protocol entegrasyonu' },
    { name: 'React + Redux', desc: 'Modern frontend framework' },
    { name: 'Node.js + Express', desc: 'Scalable backend API' },
    { name: 'PostgreSQL + Prisma', desc: 'Güvenilir veritabanı' },
    { name: 'Redis', desc: 'Caching ve session yönetimi' },
    { name: 'JWT + CSRF', desc: 'Enterprise seviye güvenlik' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                  <SparklesIcon className="h-8 w-8 inline mr-2 text-purple-400" />
                  ÜretimGo
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {userLoggedIn ? (
                <>
                  <span className="text-purple-200 text-sm">
                    Hoş geldiniz, {user?.Name || user?.Mail}
                  </span>
                  <Link
                    to="/dashboard"
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all transform hover:scale-105"
                  >
                    Dashboard
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-purple-200 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Giriş Yap
                  </Link>
                  <Link
                    to="/register"
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all transform hover:scale-105"
                  >
                    Kayıt Ol
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
                Kapsamlı
              </span>
              <span className="block bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Üretim Takip Sistemi
              </span>
            </h1>
            <p className="text-xl text-purple-100 mb-8 max-w-4xl mx-auto leading-relaxed">
              Sipariş yönetiminden kullanıcı kontrolüne, ürün takibinden müşteri ilişkilerine kadar 
              tüm üretim süreçlerinizi tek platformda yönetin. <strong>MCP desteği</strong> ile AI entegrasyona hazır.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {userLoggedIn ? (
                <Link
                  to="/dashboard"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 rounded-xl text-lg font-medium transition-all transform hover:scale-105 shadow-2xl inline-flex items-center justify-center"
                >
                  Dashboard'a Git
                  <ArrowRightIcon className="ml-2 h-5 w-5" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 rounded-xl text-lg font-medium transition-all transform hover:scale-105 shadow-2xl inline-flex items-center justify-center"
                  >
                    Ücretsiz Başlayın
                    <ArrowRightIcon className="ml-2 h-5 w-5" />
                  </Link>
                  <Link
                    to="/login"
                    className="bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white px-8 py-4 rounded-xl text-lg font-medium transition-all transform hover:scale-105 inline-flex items-center justify-center"
                  >
                    Giriş Yap
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Features Section */}
      <section className="py-20 bg-gradient-to-br from-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Ana Sistem Modülleri
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Üretim süreçlerinizi yönetmek için ihtiyacınız olan tüm araçlar tek platformda
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {mainFeatures.map((feature, index) => (
              <div key={index} className="group p-8 rounded-2xl bg-white shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-2 border border-gray-100">
                <div className="flex items-start mb-6">
                  <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r ${feature.color} rounded-xl mr-4 group-hover:scale-110 transition-transform`}>
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed mb-4">
                      {feature.description}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {feature.details.map((detail, detailIndex) => (
                    <div key={detailIndex} className="flex items-center">
                      <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">{detail}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* System Features Section */}
      <section className="py-20 bg-gradient-to-br from-slate-100 to-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Gelişmiş Sistem Özellikleri
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Enterprise seviyede güvenlik ve performans özellikleri
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {systemFeatures.map((category, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
                  {category.title}
                </h3>
                <ul className="space-y-3">
                  {category.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start">
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Modern Teknoloji Stack'i
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Güncel ve güvenilir teknolojiler ile geliştirilmiş, MCP desteği ile AI-ready
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {techStack.map((tech, index) => (
              <div key={index} className="flex items-center p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900 mb-1">{tech.name}</h4>
                  <p className="text-gray-600 text-sm">{tech.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-pink-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-6">
            Üretim Süreçlerinizi Dijitalleştirin
          </h2>
          <p className="text-xl text-purple-100 mb-8">
            Sipariş yönetiminden kullanıcı kontrolüne, ürün takibinden müşteri ilişkilerine kadar 
            tüm süreçlerinizi tek platformda kontrol altına alın.
          </p>
          
          {userLoggedIn ? (
            <Link
              to="/dashboard"
              className="bg-white text-purple-600 hover:bg-gray-100 px-8 py-4 rounded-xl text-lg font-medium transition-all transform hover:scale-105 shadow-2xl inline-flex items-center justify-center"
            >
              Dashboard'a Git
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </Link>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="bg-white text-purple-600 hover:bg-gray-100 px-8 py-4 rounded-xl text-lg font-medium transition-all transform hover:scale-105 shadow-2xl inline-flex items-center justify-center"
              >
                Hemen Başlayın
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Link>
              <Link
                to="/login"
                className="bg-white/10 backdrop-blur-md border-2 border-white text-white hover:bg-white/20 px-8 py-4 rounded-xl text-lg font-medium transition-all transform hover:scale-105 inline-flex items-center justify-center"
              >
                Giriş Yap
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-3xl font-bold mb-4">
              <SparklesIcon className="h-8 w-8 inline mr-2 text-purple-400" />
              <span className="bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                ÜretimGo
              </span>
            </h3>
            <p className="text-purple-200 mb-8 max-w-3xl mx-auto">
              Kapsamlı üretim takip sistemi ile süreçlerinizi dijitalleştirin. 
              MCP desteği ile AI entegrasyona hazır, modern teknolojilerle geliştirilmiş.
            </p>
            
            <div className="flex justify-center space-x-8 mb-8">
              {userLoggedIn ? (
                <>
                  <Link to="/dashboard" className="text-purple-200 hover:text-white transition-colors font-medium">
                    Dashboard
                  </Link>
                  <Link to="/orders" className="text-purple-200 hover:text-white transition-colors font-medium">
                    Siparişler
                  </Link>
                  <Link to="/products" className="text-purple-200 hover:text-white transition-colors font-medium">
                    Ürünler
                  </Link>
                  <Link to="/customers" className="text-purple-200 hover:text-white transition-colors font-medium">
                    Müşteriler
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-purple-200 hover:text-white transition-colors font-medium">
                    Giriş Yap
                  </Link>
                  <Link to="/register" className="text-purple-200 hover:text-white transition-colors font-medium">
                    Kayıt Ol
                  </Link>
                </>
              )}
            </div>
            
            <div className="border-t border-purple-800 pt-8">
              <p className="text-purple-300 text-sm">
                © 2024 ÜretimGo - Kapsamlı Üretim Takip Sistemi. Tüm hakları saklıdır.
              </p>
              <p className="text-purple-400 text-xs mt-2">
                MCP Destekli • Enterprise-Ready • Modern Technology Stack
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default HomePage 