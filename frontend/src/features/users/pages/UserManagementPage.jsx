import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'
import userService from '../services/userService'
import usePermissions from '../../../hooks/usePermissions'
import api from '../../../services/api'

const UserManagementPage = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedUser, setSelectedUser] = useState(null)
  const [availablePermissions, setAvailablePermissions] = useState([])
  const [userPermissions, setUserPermissions] = useState([])
  const [permissionLoading, setPermissionLoading] = useState(false)
  const { user: currentUser } = useSelector((state) => state.auth)
  const { hasPermission, loading: permissionsLoading } = usePermissions()

  // Define functions before useEffect and conditional returns
  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await userService.getAllUsers()
      const usersWithPermissionCount = (response.data?.users || []).map(user => ({
        ...user,
        name: user.Name,
        email: user.Mail,
        permissionCount: user.permissions?.length || 0
      }))
      setUsers(usersWithPermissionCount)
    } catch (error) {
      setError(error.response?.data?.message || 'Kullanıcılar yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailablePermissions = async () => {
    try {
      const response = await api.get('/permissions/permissions')
      setAvailablePermissions(response.data.data || [])
    } catch (error) {
      console.error('Yetkiler yüklenirken hata:', error)
    }
  }

  const fetchUserPermissions = async (userId) => {
    try {
      setPermissionLoading(true)
      const response = await api.get(`/permissions/user/${userId}`)
      setUserPermissions(response.data.data.permissions || [])
    } catch (error) {
      console.error('Kullanıcı yetkileri yüklenirken hata:', error)
      setUserPermissions([])
    } finally {
      setPermissionLoading(false)
    }
  }

  const handleAddPermission = async (userId, permissionId) => {
    try {
      await api.post('/permissions/add-permission', { userId, permissionId })
      await fetchUserPermissions(userId)
      await fetchUsers() // Kullanıcı listesini güncelle
      setError(null)
    } catch (error) {
      setError(error.response?.data?.message || 'Yetki eklenirken hata oluştu')
    }
  }

  const handleRemovePermission = async (userId, permissionId) => {
    try {
      await api.post('/permissions/remove-permission', { userId, permissionId })
      await fetchUserPermissions(userId)
      await fetchUsers() // Kullanıcı listesini güncelle
      setError(null)
    } catch (error) {
      setError(error.response?.data?.message || 'Yetki çıkarılırken hata oluştu')
    }
  }

  const selectUser = async (user) => {
    setSelectedUser(user)
    await fetchUserPermissions(user.id)
  }

  const clearSelection = () => {
    setSelectedUser(null)
    setUserPermissions([])
    setError(null)
  }

  // Move useEffect to the top, before any conditional returns
  useEffect(() => {
    fetchUsers()
    fetchAvailablePermissions()
  }, [])

  // Yetki kontrolü - usePermissions loading bitene kadar bekle
  if (permissionsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 spinner mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Yetkiler kontrol ediliyor...</p>
          <p className="text-gray-400 text-sm mt-2">Lütfen bekleyiniz</p>
        </div>
      </div>
    )
  }

  // Yetki kontrolü - USER_MANAGEMENT yetkisi veya SuperAdmin olmalı
  if (!currentUser?.is_SuperAdmin && !hasPermission('USER_MANAGEMENT')) {
    return <Navigate to="/dashboard" replace />
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 spinner mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Kullanıcılar yükleniyor...</p>
          <p className="text-gray-400 text-sm mt-2">Veriler getiriliyor</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl shadow-strong p-8 text-white">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-xl flex items-center justify-center animate-float">
            <span className="text-3xl">👥</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold">Kullanıcı Yönetimi</h1>
            <p className="text-primary-100 mt-2">Kullanıcıları yönetin ve yetkileri düzenleyin</p>
            <div className="flex items-center space-x-4 mt-4">
              <div className="bg-white bg-opacity-20 rounded-lg px-3 py-1">
                <span className="text-sm font-medium">{users.length} Kullanıcı</span>
              </div>
              {currentUser?.is_SuperAdmin && (
                <div className="bg-danger-500 bg-opacity-80 rounded-lg px-3 py-1">
                  <span className="text-sm font-medium">SuperAdmin</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-gradient-to-r from-danger-50 to-danger-100 border border-danger-200 rounded-xl p-4 shadow-soft animate-slide-up">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-danger-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">⚠</span>
              </div>
              <div className="text-danger-800 font-medium">{error}</div>
            </div>
            <button 
              onClick={() => setError(null)}
              className="text-danger-400 hover:text-danger-600 text-xl font-bold transition-colors"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Users List */}
        <div className="bg-white rounded-2xl shadow-strong border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                  <span className="text-white text-lg">👤</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Kullanıcılar</h2>
                  <p className="text-gray-500 text-sm">Yetki düzenlemek için kullanıcı seçin</p>
                </div>
              </div>
              <div className="bg-gradient-to-r from-primary-100 to-primary-200 text-primary-800 px-3 py-1 rounded-full text-sm font-medium">
                {users.length} kişi
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {users.map((user) => (
                <div
                  key={user.id}
                  onClick={() => selectUser(user)}
                  className={`card-hover cursor-pointer p-4 rounded-xl border-2 transition-all duration-300 ${
                    selectedUser?.id === user.id
                      ? 'border-primary-300 bg-gradient-to-r from-primary-50 to-primary-100 shadow-medium'
                      : 'border-gray-200 bg-gradient-to-r from-gray-50 to-white hover:border-primary-200 hover:shadow-soft'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shadow-soft ${
                        user.is_SuperAdmin 
                          ? 'bg-gradient-to-r from-danger-500 to-danger-600' 
                          : 'bg-gradient-to-r from-primary-500 to-primary-600'
                      }`}>
                        {user.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-gray-900">{user.name}</h3>
                          {user.is_SuperAdmin && (
                            <span className="permission-badge bg-gradient-to-r from-danger-100 to-danger-200 text-danger-800 border border-danger-300">
                              SuperAdmin
                            </span>
                          )}
                        </div>
                        <p className="text-gray-500 text-sm">{user.email}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="permission-badge bg-gradient-to-r from-success-100 to-success-200 text-success-800 border border-success-300">
                            {user.permissionCount} yetki
                          </span>
                        </div>
                      </div>
                    </div>
                    {selectedUser?.id === user.id && (
                      <div className="w-3 h-3 bg-primary-500 rounded-full animate-pulse"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Permission Management Section */}
        {selectedUser && (
          <div className="bg-white rounded-2xl shadow-strong border border-gray-100 animate-slide-up">
            <div className="p-6 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shadow-medium ${
                    selectedUser.is_SuperAdmin 
                      ? 'bg-gradient-to-r from-danger-500 to-danger-600' 
                      : 'bg-gradient-to-r from-primary-500 to-primary-600'
                  }`}>
                    {selectedUser.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {selectedUser.name} - Yetki Yönetimi
                    </h2>
                    <p className="text-gray-500">{selectedUser.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {selectedUser.is_SuperAdmin && (
                    <span className="permission-badge bg-gradient-to-r from-danger-100 to-danger-200 text-danger-800 border border-danger-300">
                      SuperAdmin
                    </span>
                  )}
                  <button
                    onClick={clearSelection}
                    className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6">
              {permissionLoading ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 spinner mx-auto mb-4"></div>
                  <p className="text-gray-600 font-medium">Yetkiler yükleniyor...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Group permissions by type */}
                  {Object.entries(
                    availablePermissions.reduce((groups, permission) => {
                      const type = permission.Type || 'Diğer'
                      if (!groups[type]) groups[type] = []
                      groups[type].push(permission)
                      return groups
                    }, {})
                  ).map(([type, permissions]) => (
                    <div key={type} className="space-y-4">
                      <div className="flex items-center space-x-3 pb-3 border-b border-gray-200">
                        <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                          <span className="text-white text-sm">
                            {type === 'USER' && '👤'}
                            {type === 'ADMIN' && '⚙️'}
                            {type === 'PRODUCTION' && '🏭'}
                            {type === 'REPORT' && '📊'}
                            {type === 'SYSTEM' && '🔧'}
                            {!['USER', 'ADMIN', 'PRODUCTION', 'REPORT', 'SYSTEM'].includes(type) && '📋'}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">
                          {type === 'USER' && 'Kullanıcı Yetkileri'}
                          {type === 'ADMIN' && 'Yönetici Yetkileri'}
                          {type === 'PRODUCTION' && 'Üretim Yetkileri'}
                          {type === 'REPORT' && 'Rapor Yetkileri'}
                          {type === 'SYSTEM' && 'Sistem Yetkileri'}
                          {!['USER', 'ADMIN', 'PRODUCTION', 'REPORT', 'SYSTEM'].includes(type) && `${type} Yetkileri`}
                        </h3>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-3">
                        {permissions.map((permission) => {
                          const hasThisPermission = userPermissions.some(up => 
                            Number(up.id) === Number(permission.id)
                          )
                          
                          // Yetki kontrolü - AYNEN KORUNDU
                          const canModify = currentUser?.is_SuperAdmin || 
                            (permission.Name !== 'USER_MANAGEMENT' && !selectedUser.is_SuperAdmin)
                          
                          return (
                            <div key={permission.id} className="card-hover bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-xl p-4 transition-all duration-300">
                              <div className="flex justify-between items-start mb-3">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <h4 className="font-semibold text-gray-900">
                                      {permission.Name}
                                    </h4>
                                    <span className={`permission-badge ${
                                      hasThisPermission 
                                        ? 'permission-badge-active' 
                                        : 'permission-badge-inactive'
                                    }`}>
                                      {hasThisPermission ? '✓ Aktif' : '✗ Pasif'}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-500">
                                    ID: {permission.id}
                                  </p>
                                </div>
                              </div>
                              
                              {canModify && (
                                <button
                                  onClick={() => hasThisPermission 
                                    ? handleRemovePermission(selectedUser.id, permission.id)
                                    : handleAddPermission(selectedUser.id, permission.id)
                                  }
                                  className={`btn-modern w-full px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                                    hasThisPermission
                                      ? 'bg-gradient-to-r from-danger-500 to-danger-600 text-white hover:from-danger-600 hover:to-danger-700 shadow-soft glow-danger'
                                      : 'bg-gradient-to-r from-success-500 to-success-600 text-white hover:from-success-600 hover:to-success-700 shadow-soft glow-success'
                                  }`}
                                >
                                  {hasThisPermission ? '✗ Yetkiyi Çıkar' : '+ Yetki Ekle'}
                                </button>
                              )}
                              
                              {!canModify && (
                                <div className="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-500 text-center py-3 rounded-lg border border-gray-300">
                                  <span className="text-sm font-medium">
                                    {permission.Name === 'USER_MANAGEMENT' ? '🔒 Sadece SuperAdmin değiştirebilir' : '🚫 Değiştirilemez'}
                                  </span>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default UserManagementPage 