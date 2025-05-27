import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import api from '../../../services/api'

const MyPermissionsPage = () => {
  const [permissions, setPermissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { user } = useSelector((state) => state.auth)

  useEffect(() => {
    fetchPermissions()
  }, [])

  const fetchPermissions = async () => {
    try {
      setLoading(true)
      const response = await api.get('/permissions/my-permissions')
      setPermissions(response.data.data.permissions || [])
    } catch (error) {
      setError('Yetkiler yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-secondary-50 via-white to-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 spinner mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Yetkiler yükleniyor...</p>
          <p className="text-gray-400 text-sm mt-2">Veriler getiriliyor</p>
        </div>
      </div>
    )
  }

  // Group permissions by type
  const groupedPermissions = permissions.reduce((groups, permission) => {
    const type = permission.Type || 'Diğer'
    if (!groups[type]) groups[type] = []
    groups[type].push(permission)
    return groups
  }, {})

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-secondary-500 to-secondary-600 rounded-2xl shadow-strong p-8 text-white">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-xl flex items-center justify-center animate-float">
            <span className="text-3xl">🔐</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold">Yetkilerim</h1>
            <p className="text-secondary-100 mt-2">Hesabınıza tanımlı yetkiler ve erişim izinleri</p>
            <div className="flex items-center space-x-4 mt-4">
              <div className="bg-white bg-opacity-20 rounded-lg px-3 py-1">
                <span className="text-sm font-medium">{permissions.length} Yetki</span>
              </div>
              {user?.is_SuperAdmin && (
                <div className="bg-danger-500 bg-opacity-80 rounded-lg px-3 py-1">
                  <span className="text-sm font-medium">SuperAdmin</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* User Info Card */}
      <div className="bg-white rounded-2xl shadow-strong border border-gray-100 p-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gradient-to-r from-secondary-500 to-secondary-600 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-medium">
            {user?.Name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">{user?.Name || 'Kullanıcı'}</h2>
            <p className="text-gray-500">{user?.Mail || 'email@example.com'}</p>
            <div className="flex items-center space-x-2 mt-2">
              {user?.is_SuperAdmin && (
                <span className="permission-badge bg-gradient-to-r from-danger-100 to-danger-200 text-danger-800 border border-danger-300">
                  SuperAdmin
                </span>
              )}
              <span className="permission-badge bg-gradient-to-r from-secondary-100 to-secondary-200 text-secondary-800 border border-secondary-300">
                {permissions.length} Aktif Yetki
              </span>
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

      {/* Permissions */}
      <div className="bg-white rounded-2xl shadow-strong border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-secondary-500 to-secondary-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-lg">📋</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Yetki Detayları</h2>
              <p className="text-gray-500 text-sm">Sahip olduğunuz tüm yetkiler</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {permissions.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-gray-400 text-3xl">🔒</span>
              </div>
              <div className="text-gray-500 text-lg font-medium mb-2">
                Henüz herhangi bir yetki tanımlanmamış
              </div>
              <div className="text-gray-400 text-sm">
                Yetki almak için sistem yöneticisi ile iletişime geçin
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedPermissions).map(([type, typePermissions]) => (
                <div key={type} className="space-y-4">
                  <div className="flex items-center space-x-3 pb-3 border-b border-gray-200">
                    <div className="w-8 h-8 bg-gradient-to-r from-secondary-500 to-secondary-600 rounded-lg flex items-center justify-center">
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
                    <div className="bg-gradient-to-r from-secondary-100 to-secondary-200 text-secondary-800 px-3 py-1 rounded-full text-sm font-medium">
                      {typePermissions.length} yetki
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {typePermissions.map((permission) => (
                      <div
                        key={permission.id}
                        className="card-hover bg-gradient-to-r from-success-50 to-success-100 border border-success-200 rounded-xl p-4 transition-all duration-300 glow-success"
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-gradient-to-r from-success-500 to-success-600 rounded-full flex items-center justify-center shadow-soft">
                              <span className="text-white text-sm font-bold">✓</span>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-success-800 mb-1">
                              {permission.Name}
                            </h4>
                            <p className="text-xs text-success-600 mb-2">
                              Tip: {permission.Type}
                            </p>
                            <p className="text-xs text-gray-500">
                              ID: {permission.id}
                            </p>
                            <div className="mt-2">
                              <span className="permission-badge permission-badge-active">
                                Aktif Yetki
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-gradient-to-r from-primary-50 to-primary-100 border border-primary-200 rounded-xl p-6 shadow-soft">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm">ℹ️</span>
          </div>
          <div>
            <h3 className="font-semibold text-primary-800 mb-2">Yetki Sistemi Hakkında</h3>
            <p className="text-primary-700 text-sm leading-relaxed">
              Bu sayfada hesabınıza tanımlı tüm yetkiler listelenmektedir. Yetkiler sistem yöneticisi tarafından atanır ve 
              gerçek zamanlı olarak güncellenir. Herhangi bir yetki problemi yaşıyorsanız sistem yöneticisi ile iletişime geçin.
            </p>
            <div className="mt-3 flex items-center space-x-4 text-xs text-primary-600">
              <span>🔄 Otomatik güncelleme</span>
              <span>🔒 Güvenli erişim</span>
              <span>⚡ Gerçek zamanlı</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MyPermissionsPage 