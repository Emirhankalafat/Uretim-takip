import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'

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
      const response = await fetch('/api/permissions/my-permissions', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setPermissions(data.data.permissions || [])
      } else {
        setError('Yetkiler yüklenirken hata oluştu')
      }
    } catch (error) {
      setError('Yetkiler yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Yetkiler yükleniyor...</p>
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
    <div className="py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Yetkilerim</h1>
                <p className="mt-1 text-sm text-gray-600">
                  Hesabınıza tanımlı yetkiler ve erişim izinleri
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {permissions.length} Yetki
                </span>
                {user?.is_SuperAdmin && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    SuperAdmin
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="px-6 py-4">
            {/* User Info */}
            <div className="mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-12 w-12">
                    <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-lg font-medium text-primary-700">
                        {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      {user?.name || 'İsimsiz Kullanıcı'}
                    </h3>
                    <p className="text-sm text-gray-500">{user?.email}</p>
                    <div className="mt-1">
                      {user?.is_SuperAdmin ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          SuperAdmin
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Kullanıcı
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-6 rounded-md bg-red-50 p-4">
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

            {/* Permissions */}
            <div>
              {permissions.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-lg mb-2">🔒</div>
                  <div className="text-gray-500 text-sm">
                    Henüz herhangi bir yetki tanımlanmamış.
                  </div>
                  <div className="text-gray-400 text-xs mt-1">
                    Yetki almak için sistem yöneticisi ile iletişime geçin.
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupedPermissions).map(([type, typePermissions]) => (
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
                        {typePermissions.map((permission) => (
                          <div
                            key={permission.id}
                            className="bg-green-50 border border-green-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-start">
                              <div className="flex-shrink-0">
                                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                                  <span className="text-green-600 text-sm">✓</span>
                                </div>
                              </div>
                              <div className="ml-3 flex-1">
                                <h4 className="text-sm font-medium text-green-800">
                                  {permission.Name}
                                </h4>
                                <p className="text-xs text-green-600 mt-1">
                                  Tip: {permission.Type}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  ID: {permission.id}
                                </p>
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

            {/* Help Section */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex">
                  <div className="text-blue-600 mr-3">ℹ️</div>
                  <div>
                    <h3 className="text-sm font-medium text-blue-800">
                      Yetki Hakkında
                    </h3>
                    <p className="text-sm text-blue-700 mt-1">
                      Bu yetkiler size sistemde hangi işlemleri yapabileceğinizi belirler. 
                      Yeni yetki almak veya mevcut yetkilerinizle ilgili sorularınız için sistem yöneticisi ile iletişime geçin.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MyPermissionsPage 