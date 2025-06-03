import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Suspense, lazy } from 'react'

// Layout
import MainLayout from '../layouts/MainLayout'

// Public Pages
const HomePage = lazy(() => import('../pages/HomePage'))
const LoginPage = lazy(() => import('../features/auth/pages/LoginPage'))
const RegisterPage = lazy(() => import('../features/auth/pages/RegisterPage'))
const ConfirmPage = lazy(() => import('../features/auth/pages/ConfirmPage'))
const AcceptInvitePage = lazy(() => import('../features/auth/pages/AcceptInvitePage'))
const InviteSuccessPage = lazy(() => import('../features/auth/pages/InviteSuccessPage'))
const ForgotPasswordPage = lazy(() => import('../features/auth/pages/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('../features/auth/pages/ResetPasswordPage'))

// Protected Pages
const DashboardPage = lazy(() => import('../pages/DashboardPage'))
const MyPermissionsPage = lazy(() => import('../features/auth/pages/MyPermissionsPage'))
const UserManagementPage = lazy(() => import('../features/users/pages/UserManagementPage'))
const UserInvitePage = lazy(() => import('../features/users/pages/UserInvitePage'))
const CategoriesPage = lazy(() => import('../features/categories/pages/CategoriesPage'))
const ProductsPage = lazy(() => import('../features/products/pages/ProductsPage'))
const ProductStepsPage = lazy(() => import('../features/product-steps/pages/ProductStepsPage'))
const ProductStepsTablePage = lazy(() => import('../features/product-steps/pages/ProductStepsTablePage'))
const CustomersPage = lazy(() => import('../features/customers/pages/CustomersPage'))
const OrdersPage = lazy(() => import('../features/orders/pages/OrdersPage'))
const OrderDetailPage = lazy(() => import('../features/orders/pages/OrderDetailPage'))
const MyJobsPage = lazy(() => import('../features/my-jobs/pages/MyJobsPage'))

// Payment Pages
const CheckoutFormPage = lazy(() => import('../features/payment/pages/CheckoutFormPage'))
const PaymentSuccessPage = lazy(() => import('../features/payment/pages/PaymentSuccessPage'))
const PaymentFailPage = lazy(() => import('../features/payment/pages/PaymentFailPage'))

// Admin Pages
const AdminLoginPage = lazy(() => import('../features/admin/pages/AdminLoginPage'))
const AdminDashboardPage = lazy(() => import('../features/admin/pages/AdminDashboardPage'))
import AdminLayout from '../layouts/AdminLayout'
const AdminUsersPage = lazy(() => import('../features/admin/pages/AdminUsersPage'))
const AdminCompaniesPage = lazy(() => import('../features/admin/pages/AdminCompaniesPage'))
const AdminLogsPage = lazy(() => import('../features/admin/pages/AdminLogsPage'))
const AdminPaymentsPage = lazy(() => import('../features/admin/pages/AdminPaymentsPage'))

// Reports Page
const ReportsPage = lazy(() => import('../features/reports/pages/ReportsPage'))

// Company Edit Page
const CompanyEditPage = lazy(() => import('../features/company/pages/CompanyEditPage'))

// Loading Component
const LoadingScreen = ({ message = "Sayfa yükleniyor..." }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">{message}</p>
      </div>
    </div>
  )
}

// Protected Route Component - Auth gerekli, yoksa login'e yönlendir
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, initialized, loading } = useSelector((state) => state.auth)
  
  // Henüz initialize edilmediyse bekle
  if (!initialized) {
    return <LoadingScreen message="Kimlik doğrulanıyor..." />
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  return (
    <Suspense fallback={<LoadingScreen message="Sayfa yükleniyor..." />}>
      <MainLayout>{children}</MainLayout>
    </Suspense>
  )
}

// Admin Route Component
const AdminRoute = ({ children }) => {
  const { isAuthenticated, user, initialized } = useSelector((state) => state.auth)
  
  // Henüz initialize edilmediyse bekle
  if (!initialized) {
    return <LoadingScreen message="Kimlik doğrulanıyor..." />
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }
  
  return (
    <Suspense fallback={<LoadingScreen message="Sayfa yükleniyor..." />}>
      <MainLayout>{children}</MainLayout>
    </Suspense>
  )
}

// Public Route Component - AuthInitializer ile koordineli çalışır
const PublicRoute = ({ children }) => {
  const { initialized } = useSelector((state) => state.auth)
  
  // AuthInitializer zaten tüm kontrolü yapıyor
  // Buraya geldiyse sayfayı gösterebiliriz
  return (
    <Suspense fallback={<LoadingScreen message="Sayfa yükleniyor..." />}>
      {children}
    </Suspense>
  )
}

// Admin Protected Route
const AdminProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useSelector((state) => state.adminAuth)
  if (loading) {
    return <LoadingScreen message="Admin kimlik doğrulanıyor..." />
  }
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />
  }
  return (
    <Suspense fallback={<LoadingScreen message="Sayfa yükleniyor..." />}>
      <AdminLayout>{children}</AdminLayout>
    </Suspense>
  )
}

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        } 
      />
      <Route 
        path="/register" 
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        } 
      />
      <Route 
        path="/auth/confirm" 
        element={
          <PublicRoute>
            <ConfirmPage />
          </PublicRoute>
        } 
      />
      <Route 
        path="/confirm" 
        element={
          <PublicRoute>
            <ConfirmPage />
          </PublicRoute>
        } 
      />
      <Route 
        path="/auth/accept-invite" 
        element={
          <PublicRoute>
            <AcceptInvitePage />
          </PublicRoute>
        } 
      />
      <Route 
        path="/auth/invite-success" 
        element={
          <PublicRoute>
            <InviteSuccessPage />
          </PublicRoute>
        } 
      />
      <Route 
        path="/forgot-password" 
        element={
          <PublicRoute>
            <ForgotPasswordPage />
          </PublicRoute>
        } 
      />
      <Route 
        path="/auth/reset-password" 
        element={
          <PublicRoute>
            <ResetPasswordPage />
          </PublicRoute>
        } 
      />
      <Route 
        path="/reset-password" 
        element={
          <PublicRoute>
            <ResetPasswordPage />
          </PublicRoute>
        } 
      />
      
      {/* Payment Success/Fail Pages - Public routes */}
      <Route 
        path="/payment/success" 
        element={
          <PublicRoute>
            <PaymentSuccessPage />
          </PublicRoute>
        } 
      />
      <Route 
        path="/payment/fail" 
        element={
          <PublicRoute>
            <PaymentFailPage />
          </PublicRoute>
        } 
      />
      
      {/* Protected Routes */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/my-permissions" 
        element={
          <ProtectedRoute>
            <MyPermissionsPage />
          </ProtectedRoute>
        } 
      />
      
      {/* User Management Route */}
      <Route 
        path="/user-management" 
        element={
          <ProtectedRoute>
            <UserManagementPage />
          </ProtectedRoute>
        } 
      />
      
      {/* User Invite Route (SuperAdmin only) */}
      <Route 
        path="/user-invite" 
        element={
          <ProtectedRoute>
            <UserInvitePage />
          </ProtectedRoute>
        } 
      />
      
      {/* Payment Route - Secure Checkout Form */}
      <Route 
        path="/payment" 
        element={
          <ProtectedRoute>
            <CheckoutFormPage />
          </ProtectedRoute>
        } 
      />
      
      {/* Legacy manual payment route - redirect to secure payment */}
      <Route 
        path="/checkout" 
        element={<Navigate to="/payment" replace />}
      />
      
      {/* Categories Route */}
      <Route 
        path="/categories" 
        element={
          <ProtectedRoute>
            <CategoriesPage />
          </ProtectedRoute>
        } 
      />
      
      {/* Products Route */}
      <Route 
        path="/products" 
        element={
          <ProtectedRoute>
            <ProductsPage />
          </ProtectedRoute>
        } 
      />
      
      {/* Product Steps Route */}
      <Route 
        path="/product-steps" 
        element={
          <ProtectedRoute>
            <ProductStepsPage />
          </ProtectedRoute>
        } 
      />
      
      {/* Product Steps Table Route */}
      <Route 
        path="/product-steps-table" 
        element={
          <ProtectedRoute>
            <ProductStepsTablePage />
          </ProtectedRoute>
        } 
      />
      
      {/* Customers Route */}
      <Route 
        path="/customers" 
        element={
          <ProtectedRoute>
            <CustomersPage />
          </ProtectedRoute>
        } 
      />
      
      {/* Orders Route */}
      <Route 
        path="/orders" 
        element={
          <ProtectedRoute>
            <OrdersPage />
          </ProtectedRoute>
        } 
      />
      
      {/* Order Detail Route */}
      <Route 
        path="/orders/:id" 
        element={
          <ProtectedRoute>
            <OrderDetailPage />
          </ProtectedRoute>
        } 
      />
      
      {/* My Jobs Route */}
      <Route 
        path="/my-jobs" 
        element={
          <ProtectedRoute>
            <MyJobsPage />
          </ProtectedRoute>
        } 
      />
      
      {/* Home Route - Auth varsa dashboard'a yönlendir, yoksa kalsın */}
      <Route 
        path="/" 
        element={
          <PublicRoute>
            <HomePage />
          </PublicRoute>
        }
      />
      
      {/* Admin Login Route */}
      <Route
        path="/admin/login"
        element={
          <Suspense fallback={<LoadingScreen message="Sayfa yükleniyor..." />}>
            <AdminLoginPage />
          </Suspense>
        }
      />
      {/* Admin Panel Routes */}
      <Route
        path="/admin"
        element={
          <AdminProtectedRoute>
            <AdminDashboardPage />
          </AdminProtectedRoute>
        }
      />
      
      {/* Admin Users Route */}
      <Route
        path="/admin/users"
        element={
          <AdminProtectedRoute>
            <AdminUsersPage />
          </AdminProtectedRoute>
        }
      />
      {/* Admin Companies Route */}
      <Route
        path="/admin/companies"
        element={
          <AdminProtectedRoute>
            <AdminCompaniesPage />
          </AdminProtectedRoute>
        }
      />
      {/* Admin Logs Route */}
      <Route
        path="/admin/logs"
        element={
          <AdminProtectedRoute>
            <AdminLogsPage />
          </AdminProtectedRoute>
        }
      />
      {/* Admin Payments Route */}
      <Route
        path="/admin/payments"
        element={
          <AdminProtectedRoute>
            <AdminPaymentsPage />
          </AdminProtectedRoute>
        }
      />
      
      {/* Reports Route */}
      <Route 
        path="/reports" 
        element={
          <ProtectedRoute>
            <ReportsPage />
          </ProtectedRoute>
        } 
      />
      
      {/* Company Edit Route (SuperAdmin only) */}
      <Route 
        path="/company-edit" 
        element={
          <ProtectedRoute>
            <CompanyEditPage />
          </ProtectedRoute>
        } 
      />
      
      {/* 404 Route */}
      <Route 
        path="*" 
        element={
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
              <p className="text-gray-600 mb-4">Sayfa bulunamadı</p>
              <a 
                href="/" 
                className="text-primary-600 hover:text-primary-500"
              >
                Ana sayfaya dön
              </a>
            </div>
          </div>
        } 
      />
    </Routes>
  )
}

export default AppRoutes 