import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { logout } from '../features/auth/authSlice';
import authService from '../features/auth/services/authService';
import usePermissions from '../hooks/usePermissions';
import NotificationIcon from '../features/notifications/components/NotificationIcon';
import NotificationDropdown from '../features/notifications/components/NotificationDropdown';

const MainLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const { hasPermission } = usePermissions();

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout hatası:', error);
    } finally {
      dispatch(logout());
      navigate('/login');
    }
  };

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
    {
      name: 'Raporlar',
      href: '/reports',
      icon: '📊',
      requirePermission: 'REPORT_READ',
      gradient: 'from-pink-500 to-pink-600'
    },
  ];

  const isActive = (href) => location.pathname === href;

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
                  if (item.requireSuperAdmin && !user?.is_SuperAdmin) return null;
                  if (item.requirePermission && !user?.is_SuperAdmin && !hasPermission(item.requirePermission)) return null;
                  
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
                  );
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
                if (item.requireSuperAdmin && !user?.is_SuperAdmin) return null;
                if (item.requirePermission && !user?.is_SuperAdmin && !hasPermission(item.requirePermission)) return null;
                
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
                );
              })}
            </nav>
            
            {/* User info section in sidebar */}
            <div className="px-4 mt-6">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200 shadow-soft">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-bold shadow-medium">
                    {user?.Name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user?.Name || user?.email || 'Kullanıcı'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user?.Mail || user?.email}
                    </p>
                    {user?.is_SuperAdmin && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-danger-100 to-danger-200 text-danger-800 border border-danger-300 mt-1">
                        SuperAdmin
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="md:pl-72 flex flex-col flex-1 overflow-hidden">
        <header className="sticky top-0 z-30 flex h-16 w-full flex-shrink-0 items-center justify-between border-b border-gray-200 bg-white shadow-sm px-4 sm:px-6 lg:px-8">
          {/* Mobile sidebar open button */}
          <button
            type="button"
            className="rounded-md px-3 py-2 text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 md:hidden hover:bg-gray-100 hover:text-gray-700"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>

          {/* Spacer to push right items to the right */}
          <div className="flex-1" />

          <div className="flex items-center gap-x-3 sm:gap-x-4 md:gap-x-6">
            <div className="relative">
              <NotificationIcon onClick={() => setIsNotificationDropdownOpen(prev => !prev)} />
              {isNotificationDropdownOpen && (
                <NotificationDropdown isOpen={isNotificationDropdownOpen} onClose={() => setIsNotificationDropdownOpen(false)} />
              )}
            </div>

            {/* User profile and logout */}
            {user && (
              <div className="flex items-center">
                <span className="hidden sm:inline-block text-sm font-medium text-gray-700 mr-2 sm:mr-3">
                  {user.Name || user.email || 'Kullanıcı'}
                </span>
                <button
                  onClick={handleLogout}
                  title="Çıkış Yap"
                  className="p-1.5 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
                >
                  <span className="sr-only">Çıkış Yap</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </header>

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
  );
};

export default MainLayout; 