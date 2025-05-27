import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import LoginPage from '../features/auth/pages/LoginPage'
import RegisterPage from '../features/auth/pages/RegisterPage'
import MyPermissionsPage from '../features/auth/pages/MyPermissionsPage'
import ConfirmPage from '../features/auth/pages/ConfirmPage'
import AcceptInvitePage from '../features/auth/pages/AcceptInvitePage'
import InviteSuccessPage from '../features/auth/pages/InviteSuccessPage'
import UserManagementPage from '../features/users/pages/UserManagementPage'
import UserInvitePage from '../features/users/pages/UserInvitePage'
import CategoriesPage from '../features/categories/pages/CategoriesPage'
import ProductsPage from '../features/products/pages/ProductsPage'
import DashboardPage from '../pages/DashboardPage'
import MainLayout from '../layouts/MainLayout'

// Protected Route Component
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

// Public Route Component (redirect if authenticated)
const PublicRoute = ({ children }) => {
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
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }
  
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
      
      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      
      {/* 404 Route */}
      <Route 
        path="*" 
        element={
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
              <p className="text-gray-600 mb-4">Sayfa bulunamadı</p>
              <a 
                href="/dashboard" 
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