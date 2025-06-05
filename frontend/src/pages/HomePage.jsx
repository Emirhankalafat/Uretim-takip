import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { 
  ChartBarIcon, 
  CogIcon, 
  UserGroupIcon, 
  ClipboardDocumentListIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'

const HomePage = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth)
  const userLoggedIn = isAuthenticated

  const features = [
    {
      icon: ChartBarIcon,
      title: 'Model Yönetimi',
      description: 'Üretim modellerinizi ve süreçlerinizi tanımlayın ve yönetin.',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: CogIcon,
      title: 'Bağlam Takibi',
      description: 'Üretim süreçlerindeki bağlamları ve ilişkileri takip edin.',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: UserGroupIcon,
      title: 'Protokol Yönetimi',
      description: 'Üretim protokollerini ve standartlarını yönetin.',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: ClipboardDocumentListIcon,
      title: 'Süreç Raporlama',
      description: 'MCP süreçlerinizi detaylı raporlarla analiz edin.',
      color: 'from-orange-500 to-red-500'
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
                  Üretim Takip Sistemi
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
                Dijitalleştirin
              </span>
            </h1>
            <p className="text-xl text-purple-100 mb-8 max-w-3xl mx-auto leading-relaxed">
              Modern üretim takip sistemi ile üretim süreçlerinizi yönetin, 
              verimliliği artırın ve maliyetleri optimize edin.
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

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-br from-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Sistem Özellikleri
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Üretim süreçlerinizi yönetmek için ihtiyacınız olan tüm araçlar
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

      {/* Footer */}
      <footer className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-3xl font-bold mb-4">
              <SparklesIcon className="h-8 w-8 inline mr-2 text-purple-400" />
              <span className="bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                Üretim Takip Sistemi
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