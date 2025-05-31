import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import LoginPage from '../features/auth/pages/LoginPage'
import RegisterPage from '../features/auth/pages/RegisterPage'
import MyPermissionsPage from '../features/auth/pages/MyPermissionsPage'
import ConfirmPage from '../features/auth/pages/ConfirmPage'
import AcceptInvitePage from '../features/auth/pages/AcceptInvitePage'
import InviteSuccessPage from '../features/auth/pages/InviteSuccessPage'
import ForgotPasswordPage from '../features/auth/pages/ForgotPasswordPage'
import ResetPasswordPage from '../features/auth/pages/ResetPasswordPage'
import UserManagementPage from '../features/users/pages/UserManagementPage'
import UserInvitePage from '../features/users/pages/UserInvitePage'
import CategoriesPage from '../features/categories/pages/CategoriesPage'
import ProductsPage from '../features/products/pages/ProductsPage'
import ProductStepsPage from '../features/product-steps/pages/ProductStepsPage'
import ProductStepsTablePage from '../features/product-steps/pages/ProductStepsTablePage'
import CustomersPage from '../features/customers/pages/CustomersPage'
import OrdersPage from '../features/orders/pages/OrdersPage'
import OrderDetailPage from '../features/orders/pages/OrderDetailPage'
import MyJobsPage from '../features/my-jobs/pages/MyJobsPage'
import DashboardPage from '../pages/DashboardPage'
import HomePage from '../pages/HomePage'
import MainLayout from '../layouts/MainLayout'

// Protected Route Component - Auth gerekli, yoksa login'e yönlendir
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, initialized } = useSelector((state) => state.auth)
  
  // Henüz initialize edilmediyse bekle
  if (!initialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    )
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  return <MainLayout>{children}</MainLayout>
}

// Admin Route Component
const AdminRoute = ({ children }) => {
  const { isAuthenticated, user } = useSelector((state) => state.auth)
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }
  
  return <MainLayout>{children}</MainLayout>
}

// Public Route Component - AuthInitializer ile koordineli çalışır
const PublicRoute = ({ children }) => {
  const { initialized, loading } = useSelector((state) => state.auth)
  
  // Henüz initialize edilmediyse bekle (AuthInitializer çalışıyor)
  if (!initialized && loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    )
  }
  
  // AuthInitializer zaten gerekli yönlendirmeleri yapıyor
  // Buraya geldiyse sayfayı gösterebiliriz
  return children
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