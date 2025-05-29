import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'
import userService from '../services/userService'
import usePermissions from '../../../hooks/usePermissions'
import api from '../../../services/api'
import Toast from '../../../components/Toast'

const UserManagementPage = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedUser, setSelectedUser] = useState(null)
  const [availablePermissions, setAvailablePermissions] = useState([])
  const [userPermissions, setUserPermissions] = useState([])
  const [permissionLoading, setPermissionLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const [isUpdating, setIsUpdating] = useState(false)
  
  // Local state for permission changes (before saving)
  const [localPermissions, setLocalPermissions] = useState([])
  const [hasChanges, setHasChanges] = useState(false)
  
  const { user: currentUser } = useSelector((state) => state.auth)
  const { hasPermission, loading: permissionsLoading } = usePermissions()

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
      const permissions = response.data.data.permissions || []
      setUserPermissions(permissions)
      setLocalPermissions(permissions.map(p => p.id))
      setHasChanges(false)
    } catch (error) {
      console.error('Kullanıcı yetkileri yüklenirken hata:', error)
      setUserPermissions([])
      setLocalPermissions([])
    } finally {
      setPermissionLoading(false)
    }
  }

  const selectUser = async (user) => {
    if (hasChanges) {
      const confirm = window.confirm('Kaydedilmemiş değişiklikleriniz var. Devam etmek istediğinizden emin misiniz?')
      if (!confirm) return
    }
    
    setSelectedUser(user)
    await fetchUserPermissions(user.id)
  }

  const clearSelection = () => {
    if (hasChanges) {
      const confirm = window.confirm('Kaydedilmemiş değişiklikleriniz var. Devam etmek istediğinizden emin misiniz?')
      if (!confirm) return
    }
    
    setSelectedUser(null)
    setUserPermissions([])
    setLocalPermissions([])
    setHasChanges(false)
    setError(null)
  }

  // READ yetkisini otomatik işaretleme fonksiyonu
  const autoCheckReadPermission = (permissionName, isChecked, currentLocalPermissions) => {
    const readPermissionName = permissionName.replace(/_CREATE|_UPDATE|_DELETE/, '_READ')
    const readPermission = availablePermissions.find(p => p.Name === readPermissionName)
    
    if (readPermission && isChecked && !currentLocalPermissions.includes(readPermission.id)) {
      return [...currentLocalPermissions, readPermission.id]
    }
    
    return currentLocalPermissions
  }

  // READ yetkisi kaldırıldığında CRUD yetkilerini kaldırma fonksiyonu
  const autoRemoveCRUDPermissions = (permissionName, currentLocalPermissions) => {
    const modulePrefix = permissionName.replace('_READ', '')
    const crudPermissions = availablePermissions.filter(p => 
      p.Name.startsWith(modulePrefix) && 
      (p.Name.includes('_CREATE') || p.Name.includes('_UPDATE') || p.Name.includes('_DELETE'))
    )
    
    const crudPermissionIds = crudPermissions.map(p => p.id)
    return currentLocalPermissions.filter(id => !crudPermissionIds.includes(id))
  }

  const handlePermissionChange = (permissionId, isChecked) => {
    const permission = availablePermissions.find(p => p.id === permissionId)
    if (!permission) return
    
    let newLocalPermissions = isChecked 
      ? [...localPermissions, permissionId]
      : localPermissions.filter(id => id !== permissionId)

    // CREATE, UPDATE, DELETE yetkilerinde READ'i otomatik ekle
    if (isChecked && (permission.Name.includes('_CREATE') || permission.Name.includes('_UPDATE') || permission.Name.includes('_DELETE'))) {
      newLocalPermissions = autoCheckReadPermission(permission.Name, isChecked, newLocalPermissions)
    }

    // READ yetkisi kaldırıldığında tüm CRUD yetkilerini kaldır
    if (!isChecked && permission.Name.includes('_READ')) {
      newLocalPermissions = autoRemoveCRUDPermissions(permission.Name, newLocalPermissions)
    }

    setLocalPermissions(newLocalPermissions)
    
    // Değişiklik kontrolü
    const originalIds = userPermissions.map(p => p.id)
    const hasAnyChanges = newLocalPermissions.length !== originalIds.length || 
                         newLocalPermissions.some(id => !originalIds.includes(id))
    setHasChanges(hasAnyChanges)
  }

  const saveChanges = async () => {
    if (!selectedUser) return
    
    try {
      setIsUpdating(true)
      
      const originalIds = userPermissions.map(p => p.id)
      const toAdd = localPermissions.filter(id => !originalIds.includes(id))
      const toRemove = originalIds.filter(id => !localPermissions.includes(id))

      // Yetkileri ekle
      for (const permissionId of toAdd) {
        await api.post('/permissions/add-permission', { 
          userId: selectedUser.id, 
          permissionId 
        })
      }

      // Yetkileri çıkar
      for (const permissionId of toRemove) {
        await api.post('/permissions/remove-permission', { 
          userId: selectedUser.id, 
          permissionId 
        })
      }

      // Güncel verileri yeniden yükle
      await fetchUserPermissions(selectedUser.id)
      await fetchUsers()
      
      setToast({
        type: 'success',
        message: 'Yetkiler başarıyla güncellendi!'
      })
      setHasChanges(false)
      
    } catch (error) {
      setToast({
        type: 'error',
        message: error.response?.data?.message || 'Yetkiler güncellenirken hata oluştu'
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const discardChanges = () => {
    setLocalPermissions(userPermissions.map(p => p.id))
    setHasChanges(false)
  }

  useEffect(() => {
    fetchUsers()
    fetchAvailablePermissions()
  }, [])

  // Yetki kontrolü - usePermissions loading bitene kadar bekle
  if (permissionsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Yetkiler kontrol ediliyor...</p>
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
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Kullanıcılar yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-purple-600 rounded-xl shadow-soft p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Kullanıcı Yönetimi</h1>
            <p className="text-blue-100 mt-1">Kullanıcıları yönetin ve yetkileri düzenleyin</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="bg-white bg-opacity-20 rounded-lg px-3 py-1">
              <span className="text-sm font-medium">{users.length} Kullanıcı</span>
            </div>
            {currentUser?.is_SuperAdmin && (
              <div className="bg-red-500 bg-opacity-80 rounded-lg px-3 py-1">
                <span className="text-sm font-medium">SuperAdmin</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users List */}
        <div className="bg-white rounded-xl shadow-soft border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Kullanıcılar</h2>
            <p className="text-gray-600 text-sm">Yetki düzenlemek için kullanıcı seçin</p>
          </div>

          <div className="p-6">
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {users.map((user) => (
                <div
                  key={user.id}
                  onClick={() => selectUser(user)}
                  className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${
                    selectedUser?.id === user.id
                      ? 'border-primary-300 bg-primary-50'
                      : 'border-gray-200 bg-gray-50 hover:border-primary-200 hover:bg-primary-25'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                        user.is_SuperAdmin 
                          ? 'bg-red-500' 
                          : 'bg-primary-500'
                      }`}>
                        {user.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-gray-900">{user.name}</h3>
                          {user.is_SuperAdmin && (
                            <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                              SuperAdmin
                            </span>
                          )}
                        </div>
                        <p className="text-gray-500 text-sm">{user.email}</p>
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                          {user.permissionCount} yetki
                        </span>
                      </div>
                    </div>
                    {selectedUser?.id === user.id && (
                      <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Permission Management */}
        {selectedUser && (
          <div className="bg-white rounded-xl shadow-soft border border-gray-100">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {selectedUser.name} - Yetkiler
                  </h2>
                  <p className="text-gray-600 text-sm">{selectedUser.email}</p>
                </div>
                <button
                  onClick={clearSelection}
                  className="text-gray-400 hover:text-gray-600 text-xl"
                >
                  ×
                </button>
              </div>
              
              {/* Save/Discard Buttons */}
              {hasChanges && (
                <div className="mt-4 flex space-x-3">
                  <button
                    onClick={saveChanges}
                    disabled={isUpdating}
                    className={`flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors ${
                      isUpdating ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {isUpdating ? 'Kaydediliyor...' : '💾 Değişiklikleri Kaydet'}
                  </button>
                  <button
                    onClick={discardChanges}
                    disabled={isUpdating}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    ↩️ İptal Et
                  </button>
                </div>
              )}
            </div>

            <div className="p-6">
              {permissionLoading ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">Yetkiler yükleniyor...</p>
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
                      <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                        {type === 'USER' && '👤 Kullanıcı Yetkileri'}
                        {type === 'ADMIN' && '⚙️ Yönetici Yetkileri'}
                        {type === 'PRODUCTION' && '🏭 Üretim Yetkileri'}
                        {type === 'REPORT' && '📊 Rapor Yetkileri'}
                        {type === 'SYSTEM' && '🔧 Sistem Yetkileri'}
                        {!['USER', 'ADMIN', 'PRODUCTION', 'REPORT', 'SYSTEM'].includes(type) && `📋 ${type} Yetkileri`}
                      </h3>
                      
                      <div className="grid grid-cols-1 gap-2">
                        {permissions.map((permission) => {
                          const isChecked = localPermissions.includes(permission.id)
                          
                          // Yetki kontrolü
                          const canModify = currentUser?.is_SuperAdmin || 
                            (permission.Name !== 'USER_MANAGEMENT' && !selectedUser.is_SuperAdmin)
                          
                          return (
                            <label key={permission.id} className={`flex items-center space-x-3 p-3 rounded-lg border transition-all cursor-pointer ${
                              isChecked 
                                ? 'bg-primary-50 border-primary-200' 
                                : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                            } ${!canModify ? 'opacity-50 cursor-not-allowed' : ''}`}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => canModify && handlePermissionChange(permission.id, e.target.checked)}
                                disabled={!canModify}
                                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                              />
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-gray-900">
                                    {permission.Name}
                                  </span>
                                  <span className={`text-xs px-2 py-1 rounded-full ${
                                    isChecked 
                                      ? 'bg-primary-100 text-primary-800' 
                                      : 'bg-gray-100 text-gray-600'
                                  }`}>
                                    {isChecked ? '✓ Aktif' : '✗ Pasif'}
                                  </span>
                                </div>
                                {!canModify && (
                                  <span className="text-xs text-red-600">
                                    {permission.Name === 'USER_MANAGEMENT' ? 'Sadece SuperAdmin değiştirebilir' : 'Değiştirilemez'}
                                  </span>
                                )}
                              </div>
                            </label>
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

      {/* Toast */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Error */}
      {error && (
        <Toast
          type="error"
          message={error}
          onClose={() => setError(null)}
        />
      )}
    </div>
  )
}

export default UserManagementPage 