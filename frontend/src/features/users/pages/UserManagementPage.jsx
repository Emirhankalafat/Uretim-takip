import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'
import userService from '../services/userService'
import usePermissions from '../../../hooks/usePermissions'

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
      const response = await fetch('/api/permissions/permissions', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setAvailablePermissions(data.data || [])
      }
    } catch (error) {
      console.error('Yetkiler yüklenirken hata:', error)
    }
  }

  const fetchUserPermissions = async (userId) => {
    try {
      setPermissionLoading(true)
      const response = await fetch(`/api/permissions/user/${userId}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setUserPermissions(data.data.permissions || [])
      }
    } catch (error) {
      console.error('Kullanıcı yetkileri yüklenirken hata:', error)
      setUserPermissions([])
    } finally {
      setPermissionLoading(false)
    }
  }

  const handleAddPermission = async (userId, permissionId) => {
    try {
      const response = await fetch('/api/permissions/add-permission', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, permissionId })
      })
      
      if (response.ok) {
        await fetchUserPermissions(userId)
        await fetchUsers() // Kullanıcı listesini güncelle
        setError(null)
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Yetki eklenirken hata oluştu')
      }
    } catch (error) {
      setError('Yetki eklenirken hata oluştu')
    }
  }

  const handleRemovePermission = async (userId, permissionId) => {
    try {
      const response = await fetch('/api/permissions/remove-permission', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, permissionId })
      })
      
      if (response.ok) {
        await fetchUserPermissions(userId)
        await fetchUsers() // Kullanıcı listesini güncelle
        setError(null)
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Yetki çıkarılırken hata oluştu')
      }
    } catch (error) {
      setError('Yetki çıkarılırken hata oluştu')
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Yetkiler kontrol ediliyor...</p>
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Kullanıcılar yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Header */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Yetki Yönetimi</h1>
                <p className="mt-1 text-sm text-gray-600">
                  Kullanıcıların yetkilerini görüntüleyin ve düzenleyin
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {users.length} Kullanıcı
                </span>
                {currentUser?.is_SuperAdmin && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    SuperAdmin
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mx-6 mt-4 rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="text-sm text-red-700">{error}</div>
                <button 
                  onClick={() => setError(null)}
                  className="ml-auto text-red-400 hover:text-red-600 text-lg font-bold"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {/* Users Table */}
          <div className="px-6 py-4">
            {users.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 text-sm">
                  Henüz kullanıcı bulunmuyor.
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Kullanıcı
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        E-posta
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Durum
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Yetki Sayısı
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Kayıt Tarihi
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        İşlemler
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr 
                        key={user.id} 
                        className={`hover:bg-gray-50 cursor-pointer ${
                          selectedUser?.id === user.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                        }`}
                        onClick={() => selectUser(user)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                                <span className="text-sm font-medium text-primary-700">
                                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {user.name || 'İsimsiz Kullanıcı'}
                              </div>
                              <div className="text-sm text-gray-500">
                                ID: {user.id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col space-y-1">
                            {user.is_SuperAdmin ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                SuperAdmin
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Kullanıcı
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {user.permissionCount || 0} Yetki
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString('tr-TR') : 'Bilinmiyor'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <span className="text-primary-600 text-sm font-medium">
                            {selectedUser?.id === user.id ? 'Seçili' : 'Seç'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Permission Management Section */}
        {selectedUser && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">
                    {selectedUser.name} - Yetki Yönetimi
                  </h2>
                  <p className="text-sm text-gray-500">{selectedUser.email}</p>
                </div>
                <div className="flex items-center space-x-2">
                  {selectedUser.is_SuperAdmin && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      SuperAdmin
                    </span>
                  )}
                  <button
                    onClick={clearSelection}
                    className="text-gray-400 hover:text-gray-600 text-xl font-bold"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>

            <div className="px-6 py-4">
              {permissionLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-600">Yetkiler yükleniyor...</p>
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
                    <div key={type} className="space-y-3">
                      <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                        {type === 'USER' && '👤 Kullanıcı Yetkileri'}
                        {type === 'ADMIN' && '⚙️ Yönetici Yetkileri'}
                        {type === 'PRODUCTION' && '🏭 Üretim Yetkileri'}
                        {type === 'REPORT' && '📊 Rapor Yetkileri'}
                        {type === 'SYSTEM' && '🔧 Sistem Yetkileri'}
                        {!['USER', 'ADMIN', 'PRODUCTION', 'REPORT', 'SYSTEM'].includes(type) && `📋 ${type}`}
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {permissions.map((permission) => {
                          const hasThisPermission = userPermissions.some(up => 
                            Number(up.id) === Number(permission.id)
                          )
                          
                          const canModify = currentUser?.is_SuperAdmin || 
                            (permission.Name !== 'USER_MANAGEMENT' && !selectedUser.is_SuperAdmin)
                          
                          return (
                            <div key={permission.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                              <div className="flex justify-between items-start mb-3">
                                <div className="flex-1">
                                  <h4 className="text-sm font-medium text-gray-900 mb-1">
                                    {permission.Name}
                                  </h4>
                                  <p className="text-xs text-gray-500">
                                    ID: {permission.id}
                                  </p>
                                </div>
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  hasThisPermission 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {hasThisPermission ? '✓ Var' : '✗ Yok'}
                                </span>
                              </div>
                              
                              {canModify && (
                                <button
                                  onClick={() => hasThisPermission 
                                    ? handleRemovePermission(selectedUser.id, permission.id)
                                    : handleAddPermission(selectedUser.id, permission.id)
                                  }
                                  className={`w-full px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                    hasThisPermission
                                      ? 'text-red-700 bg-red-50 hover:bg-red-100 border border-red-200'
                                      : 'text-green-700 bg-green-50 hover:bg-green-100 border border-green-200'
                                  }`}
                                >
                                  {hasThisPermission ? '✗ Çıkar' : '+ Ekle'}
                                </button>
                              )}
                              
                              {!canModify && (
                                <div className="text-xs text-gray-400 text-center py-2">
                                  {permission.Name === 'USER_MANAGEMENT' ? 'Sadece SuperAdmin değiştirebilir' : 'Değiştirilemez'}
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

        {/* Help Text */}
        {!selectedUser && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <div className="text-blue-600 mr-3">ℹ️</div>
              <div>
                <h3 className="text-sm font-medium text-blue-800">Nasıl Kullanılır?</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Yukarıdaki tabloda bir kullanıcıya tıklayarak o kullanıcının yetkilerini yönetebilirsiniz. 
                  Yetkiler gerçek zamanlı olarak eklenir ve çıkarılır.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default UserManagementPage 