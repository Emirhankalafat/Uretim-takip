import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useState, useEffect } from 'react'
import { 
  ChartBarIcon, 
  CogIcon, 
  UserGroupIcon, 
  ClipboardDocumentListIcon,
  ArrowRightIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

const HomePage = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth)

  // Auth durumu: Redux state'i güvenilir
  const userLoggedIn = isAuthenticated

  const features = [
    {
      icon: ChartBarIcon,
      title: 'Üretim Takibi',
      description: 'Üretim süreçlerinizi gerçek zamanlı olarak takip edin ve analiz edin.'
    },
    {
      icon: CogIcon,
      title: 'Süreç Yönetimi',
      description: 'Üretim adımlarınızı optimize edin ve verimliliği artırın.'
    },
    {
      icon: UserGroupIcon,
      title: 'Ekip Yönetimi',
      description: 'Çalışanlarınızı yönetin ve görevleri kolayca atayın.'
    },
    {
      icon: ClipboardDocumentListIcon,
      title: 'Raporlama',
      description: 'Detaylı raporlar oluşturun ve performansı analiz edin.'
    }
  ]

  const benefits = [
    'Gerçek zamanlı üretim takibi',
    'Otomatik raporlama sistemi',
    'Kullanıcı dostu arayüz',
    'Mobil uyumlu tasarım',
    'Güvenli veri saklama',
    '7/24 teknik destek'
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-gray-900">
                  Üretim Takip Sistemi
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {userLoggedIn ? (
                <>
                  <span className="text-gray-700 text-sm">
                    Hoş geldiniz, {user?.name || user?.email}
                  </span>
                  <Link
                    to="/dashboard"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Dashboard
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Giriş Yap
                  </Link>
                  <Link
                    to="/register"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
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
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Üretim Süreçlerinizi
              <span className="text-blue-600 block">Dijitalleştirin</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Modern üretim takip sistemi ile üretim süreçlerinizi optimize edin, 
              verimliliği artırın ve maliyetleri düşürün.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {userLoggedIn ? (
                <Link
                  to="/dashboard"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-medium transition-colors inline-flex items-center justify-center"
                >
                  Dashboard'a Git
                  <ArrowRightIcon className="ml-2 h-5 w-5" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-medium transition-colors inline-flex items-center justify-center"
                  >
                    Ücretsiz Başlayın
                    <ArrowRightIcon className="ml-2 h-5 w-5" />
                  </Link>
                  <Link
                    to="/login"
                    className="border border-gray-300 hover:border-gray-400 text-gray-700 px-8 py-3 rounded-lg text-lg font-medium transition-colors inline-flex items-center justify-center"
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
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Güçlü Özellikler
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Üretim süreçlerinizi yönetmek için ihtiyacınız olan tüm araçlar
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-6 rounded-lg hover:shadow-lg transition-shadow">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-lg mb-4">
                  <feature.icon className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Neden Bizi Seçmelisiniz?
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Modern teknoloji ile geliştirilen sistemimiz, üretim süreçlerinizi 
                daha verimli ve kontrollü hale getirir.
              </p>
              <ul className="space-y-4">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-center">
                    <CheckCircleIcon className="h-6 w-6 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-xl">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                {userLoggedIn ? 'Sisteme Devam Et' : 'Hemen Başlayın'}
              </h3>
              <div className="space-y-4">
                {userLoggedIn ? (
                  <Link
                    to="/dashboard"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors block text-center"
                  >
                    Dashboard'a Git
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/register"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors block text-center"
                    >
                      Ücretsiz Hesap Oluştur
                    </Link>
                    <Link
                      to="/login"
                      className="w-full border border-gray-300 hover:border-gray-400 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors block text-center"
                    >
                      Mevcut Hesabınızla Giriş Yapın
                    </Link>
                  </>
                )}
              </div>
              <p className="text-sm text-gray-500 text-center mt-4">
                {userLoggedIn ? 
                  `Hoş geldiniz, ${user?.name || user?.email}` : 
                  'Kredi kartı gerektirmez • 14 gün ücretsiz deneme'
                }
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">Üretim Takip Sistemi</h3>
            <p className="text-gray-400 mb-6">
              Üretim süreçlerinizi dijitalleştirin ve verimliliği artırın.
            </p>
            <div className="flex justify-center space-x-6">
              {userLoggedIn ? (
                <Link to="/dashboard" className="text-gray-400 hover:text-white transition-colors">
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link to="/login" className="text-gray-400 hover:text-white transition-colors">
                    Giriş Yap
                  </Link>
                  <Link to="/register" className="text-gray-400 hover:text-white transition-colors">
                    Kayıt Ol
                  </Link>
                </>
              )}
            </div>
            <div className="mt-8 pt-8 border-t border-gray-800">
              <p className="text-gray-400 text-sm">
                © 2024 Üretim Takip Sistemi. Tüm hakları saklıdır.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default HomePage 