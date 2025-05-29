import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useState, useEffect } from 'react'
import { 
  ChartBarIcon, 
  CogIcon, 
  UserGroupIcon, 
  ClipboardDocumentListIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  StarIcon,
  BoltIcon,
  ShieldCheckIcon,
  ClockIcon,
  UsersIcon,
  TrophyIcon,
  RocketLaunchIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'

const HomePage = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth)
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProjects: 0,
    totalReports: 0
  })

  // Auth durumu: Redux state'i güvenilir
  const userLoggedIn = isAuthenticated

  // Animasyonlu istatistikler
  useEffect(() => {
    const animateStats = () => {
      const targetStats = {
        totalUsers: 12547,
        totalProjects: 8934,
        totalReports: 45872
      }
      
      const duration = 2000 // 2 saniye
      const steps = 50
      const interval = duration / steps
      
      let step = 0
      const timer = setInterval(() => {
        step++
        const progress = step / steps
        
        setStats({
          totalUsers: Math.floor(targetStats.totalUsers * progress),
          totalProjects: Math.floor(targetStats.totalProjects * progress),
          totalReports: Math.floor(targetStats.totalReports * progress)
        })
        
        if (step >= steps) {
          clearInterval(timer)
          setStats(targetStats)
        }
      }, interval)
      
      return () => clearInterval(timer)
    }
    
    const timer = setTimeout(animateStats, 500)
    return () => clearTimeout(timer)
  }, [])

  const features = [
    {
      icon: ChartBarIcon,
      title: 'Gerçek Zamanlı Analiz',
      description: 'Üretim verilerinizi anında görselleştirin ve trendleri takip edin.',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: CogIcon,
      title: 'Akıllı Optimizasyon',
      description: 'AI destekli önerilerle üretim süreçlerinizi optimize edin.',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: UserGroupIcon,
      title: 'Ekip Koordinasyonu',
      description: 'Tüm ekibinizi tek platformda yönetin ve iş birliğini artırın.',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: ClipboardDocumentListIcon,
      title: 'Detaylı Raporlama',
      description: 'Özelleştirilebilir raporlarla performansınızı ölçün.',
      color: 'from-orange-500 to-red-500'
    }
  ]

  const benefits = [
    {
      icon: BoltIcon,
      text: 'Gerçek zamanlı üretim takibi',
      color: 'text-yellow-500'
    },
    {
      icon: ShieldCheckIcon,
      text: 'Kurumsal güvenlik standartları',
      color: 'text-green-500'
    },
    {
      icon: ClockIcon,
      text: 'Otomatik raporlama sistemi',
      color: 'text-blue-500'
    },
    {
      icon: UsersIcon,
      text: 'Kullanıcı dostu arayüz',
      color: 'text-purple-500'
    },
    {
      icon: TrophyIcon,
      text: 'Mobil uyumlu tasarım',
      color: 'text-orange-500'
    },
    {
      icon: RocketLaunchIcon,
      text: '7/24 teknik destek',
      color: 'text-indigo-500'
    }
  ]

  const pricingPlans = [
    {
      name: 'Başlangıç',
      price: 'Ücretsiz',
      period: '',
      features: [
        '5 kullanıcıya kadar',
        '10 proje limiti',
        'Temel raporlama',
        'E-posta desteği'
      ],
      buttonText: 'Ücretsiz Başla',
      buttonStyle: 'bg-gray-600 hover:bg-gray-700 text-white',
      popular: false
    },
    {
      name: 'Premium',
      price: '₺299',
      period: '/ay',
      features: [
        'Sınırsız kullanıcı',
        'Sınırsız proje',
        'Gelişmiş analitik',
        'API erişimi',
        'Öncelikli destek',
        'Özel entegrasyonlar'
      ],
      buttonText: 'Premium\'a Geç',
      buttonStyle: 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white',
      popular: true
    },
    {
      name: 'Kurumsal',
      price: 'Özel Fiyat',
      period: '',
      features: [
        'Premium\'un tüm özellikleri',
        'Özel kurulum',
        'Dedicated hesap yöneticisi',
        'SLA garantisi',
        'Özel eğitim'
      ],
      buttonText: 'İletişime Geç',
      buttonStyle: 'bg-gray-800 hover:bg-gray-900 text-white',
      popular: false
    }
  ]

  const testimonials = [
    {
      name: 'Ahmet Kaya',
      company: 'TechPro Manufacturing',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&crop=face',
      text: 'Bu sistem sayesinde üretim verimliliğimiz %40 arttı. Harika bir çözüm!'
    },
    {
      name: 'Elif Özkan',
      company: 'InnovaSteel',
      image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=64&h=64&fit=crop&crop=face',
      text: 'Kullanıcı dostu arayüzü ve güçlü raporlama özellikleri bizi çok etkiledi.'
    },
    {
      name: 'Mehmet Demir',
      company: 'ProManufacture Ltd.',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=face',
      text: 'Gerçek zamanlı takip özelliği operasyonlarımızı tamamen değiştirdi.'
    }
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
                  Üretim Takip Pro
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {userLoggedIn ? (
                <>
                  <span className="text-purple-200 text-sm">
                    Hoş geldiniz, {user?.name || user?.email}
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
                Üretim Süreçlerinizi
              </span>
              <span className="block bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Geleceğe Taşıyın
              </span>
            </h1>
            <p className="text-xl text-purple-100 mb-8 max-w-3xl mx-auto leading-relaxed">
              AI destekli modern üretim takip sistemi ile üretim süreçlerinizi optimize edin, 
              verimliliği maksimuma çıkarın ve maliyetleri minimize edin.
            </p>
            
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 max-w-4xl mx-auto">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                <div className="text-3xl font-bold text-white mb-2">{stats.totalUsers.toLocaleString()}</div>
                <div className="text-purple-200">Aktif Kullanıcı</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                <div className="text-3xl font-bold text-white mb-2">{stats.totalProjects.toLocaleString()}</div>
                <div className="text-purple-200">Tamamlanan Proje</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                <div className="text-3xl font-bold text-white mb-2">{stats.totalReports.toLocaleString()}</div>
                <div className="text-purple-200">Oluşturulan Rapor</div>
              </div>
            </div>

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

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-br from-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Güçlü Özellikler
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Üretim süreçlerinizi yönetmek için ihtiyacınız olan tüm modern araçlar
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="group text-center p-8 rounded-2xl bg-white shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-2 border border-gray-100">
                <div className={`inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r ${feature.color} rounded-2xl mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Neden Bizi Seçmelisiniz?
                </span>
              </h2>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Modern teknoloji ve yapay zeka ile geliştirilen sistemimiz, üretim süreçlerinizi 
                daha verimli, kontrollü ve karlı hale getirir.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                    <benefit.icon className={`h-6 w-6 ${benefit.color} mr-3 flex-shrink-0`} />
                    <span className="text-gray-700 font-medium">{benefit.text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-8 rounded-3xl shadow-2xl border border-purple-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                {userLoggedIn ? 'Sisteme Devam Et' : 'Hemen Başlayın'}
              </h3>
              <div className="space-y-4">
                {userLoggedIn ? (
                  <Link
                    to="/dashboard"
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-4 rounded-xl font-medium transition-all transform hover:scale-105 block text-center shadow-lg"
                  >
                    Dashboard'a Git
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/register"
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-4 rounded-xl font-medium transition-all transform hover:scale-105 block text-center shadow-lg"
                    >
                      Ücretsiz Hesap Oluştur
                    </Link>
                    <Link
                      to="/login"
                      className="w-full border-2 border-purple-300 hover:border-purple-400 bg-white text-purple-600 px-6 py-4 rounded-xl font-medium transition-all hover:bg-purple-50 block text-center"
                    >
                      Mevcut Hesabınızla Giriş Yapın
                    </Link>
                  </>
                )}
              </div>
              <p className="text-sm text-gray-500 text-center mt-6">
                {userLoggedIn ? 
                  `Hoş geldiniz, ${user?.name || user?.email}` : 
                  '✓ Kredi kartı gerektirmez ✓ 14 gün ücretsiz deneme ✓ İstediğiniz zaman iptal edin'
                }
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                Fiyatlandırma Planları
              </span>
            </h2>
            <p className="text-xl text-purple-200 max-w-2xl mx-auto">
              İhtiyacınıza en uygun planı seçin ve hemen başlayın
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <div key={index} className={`relative bg-white/10 backdrop-blur-md rounded-3xl p-8 border transition-all transform hover:scale-105 ${plan.popular ? 'border-purple-400 ring-2 ring-purple-400' : 'border-white/20'}`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center">
                      <StarIcon className="h-4 w-4 mr-1" />
                      En Popüler
                    </span>
                  </div>
                )}
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-white mb-4">{plan.name}</h3>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-white">{plan.price}</span>
                    <span className="text-purple-200">{plan.period}</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center text-purple-100">
                        <CheckCircleIcon className="h-5 w-5 text-green-400 mr-3 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <button className={`w-full px-6 py-3 rounded-xl font-medium transition-all transform hover:scale-105 ${plan.buttonStyle}`}>
                    {plan.buttonText}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gradient-to-br from-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Müşteri Yorumları
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Binlerce memnun müşterimizin deneyimlerini keşfedin
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-2">
                <div className="flex items-center mb-6">
                  <img 
                    src={testimonial.image} 
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full mr-4"
                  />
                  <div>
                    <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
                    <p className="text-gray-600 text-sm">{testimonial.company}</p>
                  </div>
                </div>
                <p className="text-gray-700 italic leading-relaxed">"{testimonial.text}"</p>
                <div className="flex mt-4">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-3xl font-bold mb-4">
              <SparklesIcon className="h-8 w-8 inline mr-2 text-purple-400" />
              <span className="bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                Üretim Takip Pro
              </span>
            </h3>
            <p className="text-purple-200 mb-8 max-w-2xl mx-auto">
              Üretim süreçlerinizi dijitalleştirin, verimliliği artırın ve geleceğin fabrikasını bugünden kurun.
            </p>
            <div className="flex justify-center space-x-8 mb-8">
              {userLoggedIn ? (
                <Link to="/dashboard" className="text-purple-200 hover:text-white transition-colors font-medium">
                  Dashboard
                </Link>
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
                © 2024 Üretim Takip Pro. Tüm hakları saklıdır. | AI destekli üretim çözümleri
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default HomePage 