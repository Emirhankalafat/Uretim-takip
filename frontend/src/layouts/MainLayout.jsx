import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { logout } from '../features/auth/authSlice'
import authService from '../features/auth/services/authService'
import usePermissions from '../hooks/usePermissions'

const MainLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useSelector((state) => state.auth)
  const { hasPermission } = usePermissions()

  const handleLogout = async () => {
    try {
      // Backend'e logout isteği gönder (cookie'yi temizlemek için)
      await authService.logout()
    } catch (error) {
      console.error('Logout hatası:', error)
    } finally {
      // Her durumda Redux state'i temizle ve login'e yönlendir
      dispatch(logout())
      navigate('/login')
    }
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: '🏠', gradient: 'from-primary-500 to-primary-600' },
    { name: 'Yetkilerim', href: '/my-permissions', icon: '🔐', gradient: 'from-secondary-500 to-secondary-600' },
    { 
      name: 'İşlerim', 
      href: '/my-jobs', 
      icon: '💼', 
      requirePermission: 'MY_JOBS',
      gradient: 'from-indigo-500 to-indigo-600'
    },
    { 
      name: 'Siparişler', 
      href: '/orders', 
      icon: '📋', 
      requirePermission: 'ORDER_READ',
      gradient: 'from-emerald-500 to-emerald-600'
    },
    { 
      name: 'Kategoriler', 
      href: '/categories', 
      icon: '📂', 
      requirePermission: 'CATEGORY_READ',
      gradient: 'from-warning-500 to-warning-600'
    },
    { 
      name: 'Ürünler', 
      href: '/products', 
      icon: '📦', 
      requirePermission: 'PRODUCT_READ',
      gradient: 'from-success-500 to-success-600'
    },
    { 
      name: 'Müşteriler', 
      href: '/customers', 
      icon: '👥', 
      requirePermission: 'CUSTOMER_READ',
      gradient: 'from-blue-500 to-blue-600'
    },
    { 
      name: 'Ürün Adımları', 
      href: '/product-steps', 
      icon: '🔧', 
      requirePermission: 'PRODUCT_STEP_READ',
      gradient: 'from-info-500 to-info-600'
    },
    { 
      name: 'Yetkileri Yönet', 
      href: '/user-management', 
      icon: '👥', 
      requirePermission: 'USER_MANAGEMENT',
      gradient: 'from-danger-500 to-danger-600'
    },
    { 
      name: 'Kullanıcı Davet', 
      href: '/user-invite', 
      icon: '📧', 
      requireSuperAdmin: true,
      gradient: 'from-purple-500 to-purple-600'
    },
  ]

  const isActive = (href) => location.pathname === href

  return (
    <div className="h-screen flex overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 flex z-40 md:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white shadow-strong">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <span className="sr-only">Close sidebar</span>
                <span className="text-white text-2xl">×</span>
              </button>
            </div>
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex-shrink-0 flex items-center px-4 mb-8">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center animate-float">
                    <span className="text-white text-xl font-bold">🏭</span>
                  </div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                    Üretim Takip
                  </h1>
                </div>
              </div>
              <nav className="px-4 space-y-2">
                {navigation.map((item) => {
                  // Yetki kontrolü - AYNEN KORUNDU
                  if (item.requireSuperAdmin && !user?.is_SuperAdmin) return null
                  if (item.requirePermission && !user?.is_SuperAdmin && !hasPermission(item.requirePermission)) return null
                  
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`nav-item group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 ${
                        isActive(item.href)
                          ? 'bg-gradient-to-r from-primary-50 to-primary-100 text-primary-700 shadow-soft border border-primary-200 active'
                          : 'text-gray-600 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:text-gray-900 hover:shadow-soft'
                      }`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <div className={`mr-4 p-2 rounded-lg bg-gradient-to-r ${item.gradient} text-white shadow-soft group-hover:scale-110 transition-transform duration-300`}>
                        <span className="text-sm">{item.icon}</span>
                      </div>
                      <span className="flex-1">{item.name}</span>
                      {isActive(item.href) && (
                        <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></div>
                      )}
                    </Link>
                  )
                })}
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-72 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 bg-white shadow-strong border-r border-gray-200">
          <div className="flex-1 flex flex-col pt-8 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-6 mb-8">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center animate-float shadow-medium">
                  <span className="text-white text-2xl font-bold">🏭</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                    Üretim Takip
                  </h1>
                  <p className="text-xs text-gray-500 mt-1">Sistem Yönetimi</p>
                </div>
              </div>
            </div>
            <nav className="flex-1 px-4 space-y-2">
              {navigation.map((item) => {
                // Yetki kontrolü - AYNEN KORUNDU
                if (item.requireSuperAdmin && !user?.is_SuperAdmin) return null
                if (item.requirePermission && !user?.is_SuperAdmin && !hasPermission(item.requirePermission)) return null
                
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`nav-item group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 card-hover ${
                      isActive(item.href)
                        ? 'bg-gradient-to-r from-primary-50 to-primary-100 text-primary-700 shadow-medium border border-primary-200 active'
                        : 'text-gray-600 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:text-gray-900 hover:shadow-medium'
                    }`}
                  >
                    <div className={`mr-4 p-2 rounded-lg bg-gradient-to-r ${item.gradient} text-white shadow-soft group-hover:scale-110 transition-transform duration-300`}>
                      <span className="text-sm">{item.icon}</span>
                    </div>
                    <span className="flex-1">{item.name}</span>
                    {isActive(item.href) && (
                      <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></div>
                    )}
                  </Link>
                )
              })}
            </nav>
            
            {/* User info section */}
            <div className="px-4 mt-6">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200 shadow-soft">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-bold shadow-medium">
                    {user?.Name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user?.Name || 'Kullanıcı'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user?.Mail || 'email@example.com'}
                    </p>
                    {user?.is_SuperAdmin && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-danger-100 to-danger-200 text-danger-800 border border-danger-300 mt-1">
                        SuperAdmin
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="mt-3 w-full btn-modern bg-gradient-to-r from-gray-600 to-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-gray-700 hover:to-gray-800 shadow-soft"
                >
                  Çıkış Yap
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-72 flex flex-col flex-1">
        {/* Mobile header */}
        <div className="md:hidden bg-white shadow-soft border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              className="text-gray-500 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 p-2 rounded-lg"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="sr-only">Open sidebar</span>
              <span className="text-xl">☰</span>
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">🏭</span>
              </div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                Üretim Takip
              </h1>
            </div>
            <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-medium">
              {user?.Name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <div className="animate-fade-in">
                {children}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default MainLayout 