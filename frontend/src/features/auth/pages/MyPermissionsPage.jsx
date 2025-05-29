import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import api from '../../../services/api'

// Yetki çevirileri ve açıklamaları (UserManagementPage'den import edilebilir)
const permissionTranslations = {
  // Kullanıcı Yetkileri
  'USER_READ': { 
    name: 'Kullanıcı Görüntüleme', 
    description: 'Kullanıcı listesini ve profillerini görüntüleyebilirsiniz' 
  },
  'USER_CREATE': { 
    name: 'Kullanıcı Oluşturma', 
    description: 'Yeni kullanıcı hesapları oluşturabilirsiniz' 
  },
  'USER_UPDATE': { 
    name: 'Kullanıcı Güncelleme', 
    description: 'Mevcut kullanıcı bilgilerini düzenleyebilirsiniz' 
  },
  'USER_DELETE': { 
    name: 'Kullanıcı Silme', 
    description: 'Kullanıcı hesaplarını silebilirsiniz' 
  },
  'USER_MANAGEMENT': { 
    name: 'Kullanıcı Yönetimi', 
    description: 'Tüm kullanıcı yönetimi işlemlerini yapabilirsiniz' 
  },

  // Müşteri Yetkileri
  'CUSTOMER_READ': { 
    name: 'Müşteri Görüntüleme', 
    description: 'Müşteri listesini ve bilgilerini görüntüleyebilirsiniz' 
  },
  'CUSTOMER_CREATE': { 
    name: 'Müşteri Oluşturma', 
    description: 'Yeni müşteri kayıtları oluşturabilirsiniz' 
  },
  'CUSTOMER_UPDATE': { 
    name: 'Müşteri Güncelleme', 
    description: 'Mevcut müşteri bilgilerini düzenleyebilirsiniz' 
  },
  'CUSTOMER_DELETE': { 
    name: 'Müşteri Silme', 
    description: 'Müşteri kayıtlarını silebilirsiniz' 
  },

  // Ürün Yetkileri
  'PRODUCT_READ': { 
    name: 'Ürün Görüntüleme', 
    description: 'Ürün listesini ve detaylarını görüntüleyebilirsiniz' 
  },
  'PRODUCT_CREATE': { 
    name: 'Ürün Oluşturma', 
    description: 'Yeni ürün kayıtları oluşturabilirsiniz' 
  },
  'PRODUCT_UPDATE': { 
    name: 'Ürün Güncelleme', 
    description: 'Mevcut ürün bilgilerini düzenleyebilirsiniz' 
  },
  'PRODUCT_DELETE': { 
    name: 'Ürün Silme', 
    description: 'Ürün kayıtlarını silebilirsiniz' 
  },

  // Ürün Adımları Yetkileri
  'PRODUCT_STEP_READ': { 
    name: 'Ürün Adımı Görüntüleme', 
    description: 'Ürün üretim adımlarını görüntüleyebilirsiniz' 
  },
  'PRODUCT_STEP_CREATE': { 
    name: 'Ürün Adımı Oluşturma', 
    description: 'Yeni ürün adımları oluşturabilirsiniz' 
  },
  'PRODUCT_STEP_UPDATE': { 
    name: 'Ürün Adımı Güncelleme', 
    description: 'Mevcut ürün adımlarını düzenleyebilirsiniz' 
  },
  'PRODUCT_STEP_DELETE': { 
    name: 'Ürün Adımı Silme', 
    description: 'Ürün adımlarını silebilirsiniz' 
  },

  // Sipariş Yetkileri
  'ORDER_READ': { 
    name: 'Sipariş Görüntüleme', 
    description: 'Sipariş listesini ve detaylarını görüntüleyebilirsiniz' 
  },
  'ORDER_CREATE': { 
    name: 'Sipariş Oluşturma', 
    description: 'Yeni siparişler oluşturabilirsiniz' 
  },
  'ORDER_UPDATE': { 
    name: 'Sipariş Güncelleme', 
    description: 'Mevcut sipariş bilgilerini düzenleyebilirsiniz' 
  },
  'ORDER_DELETE': { 
    name: 'Sipariş Silme', 
    description: 'Siparişleri silebilirsiniz' 
  },

  // Sipariş Adımları Yetkileri
  'ORDER_STEP_READ': { 
    name: 'Sipariş Adımı Görüntüleme', 
    description: 'Sipariş adımlarını ve durumlarını görüntüleyebilirsiniz' 
  },
  'ORDER_STEP_UPDATE': { 
    name: 'Sipariş Adımı Güncelleme', 
    description: 'Sipariş adımlarını güncelleyebilir ve durum değiştirebilirsiniz' 
  },

  // İşlerim (MyJobs) Yetkileri
  'MYJOBS_READ': { 
    name: 'İşlerimi Görüntüleme', 
    description: 'Kendinize atanan görevleri ve işleri görüntüleyebilirsiniz' 
  },
  'MYJOBS_UPDATE': { 
    name: 'İşlerimi Güncelleme', 
    description: 'Atanan görevlerin durumunu güncelleyebilir ve tamamlayabilirsiniz' 
  },

  // Kategori Yetkileri
  'CATEGORY_READ': { 
    name: 'Kategori Görüntüleme', 
    description: 'Kategori listesini ve detaylarını görüntüleyebilirsiniz' 
  },
  'CATEGORY_CREATE': { 
    name: 'Kategori Oluşturma', 
    description: 'Yeni kategori kayıtları oluşturabilirsiniz' 
  },
  'CATEGORY_UPDATE': { 
    name: 'Kategori Güncelleme', 
    description: 'Mevcut kategori bilgilerini düzenleyebilirsiniz' 
  },
  'CATEGORY_DELETE': { 
    name: 'Kategori Silme', 
    description: 'Kategori kayıtlarını silebilirsiniz' 
  },

  // Rapor Yetkileri
  'REPORT_READ': { 
    name: 'Rapor Görüntüleme', 
    description: 'Sistem raporlarını görüntüleyebilirsiniz' 
  },
  'REPORT_CREATE': { 
    name: 'Rapor Oluşturma', 
    description: 'Yeni raporlar oluşturabilirsiniz' 
  },

  // Sistem Yetkileri
  'SYSTEM_SETTINGS': { 
    name: 'Sistem Ayarları', 
    description: 'Sistem genelindeki ayarları yönetebilirsiniz' 
  },
  'COMPANY_SETTINGS': { 
    name: 'Şirket Ayarları', 
    description: 'Şirket bilgilerini ve ayarlarını düzenleyebilirsiniz' 
  },

  // Admin Yetkileri
  'ADMIN_PANEL': { 
    name: 'Admin Paneli', 
    description: 'Yönetici paneline erişebilirsiniz' 
  },
  'PERMISSION_MANAGEMENT': { 
    name: 'Yetki Yönetimi', 
    description: 'Kullanıcı yetkilerini yönetebilirsiniz' 
  }
}

// Yetki çevirisi fonksiyonu
const getPermissionTranslation = (permissionName) => {
  return permissionTranslations[permissionName] || {
    name: permissionName,
    description: 'Bu yetki için açıklama bulunmuyor'
  }
}

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
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Yetkiler yükleniyor...</p>
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
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-purple-600 rounded-xl shadow-soft p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Yetkilerim</h1>
            <p className="text-blue-100 mt-1">Hesabınıza tanımlı yetkiler ve erişim izinleri</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="bg-white bg-opacity-20 rounded-lg px-3 py-1">
              <span className="text-sm font-medium">
                {user?.is_SuperAdmin ? 'Tüm Yetkiler' : `${permissions.length} Yetki`}
              </span>
            </div>
            {user?.is_SuperAdmin && (
              <div className="bg-red-500 bg-opacity-80 rounded-lg px-3 py-1">
                <span className="text-sm font-medium">SuperAdmin</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SuperAdmin Special Message */}
      {user?.is_SuperAdmin && (
        <div className="bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-200 rounded-xl p-6 shadow-soft">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-2xl">👑</span>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-red-800 mb-2">SuperAdmin Yetkileri</h3>
              <p className="text-red-700 mb-4">
                <strong>Tebrikler!</strong> Size SuperAdmin yetkisi verilmiş durumda. Bu, sistemdeki en yüksek yetki seviyesidir.
              </p>
              
              <div className="bg-white bg-opacity-50 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-red-800 mb-3">🚀 SuperAdmin olarak yapabilecekleriniz:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-green-600">✅</span>
                    <span className="text-sm text-red-700">Tüm kullanıcıları yönetebilirsiniz</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-600">✅</span>
                    <span className="text-sm text-red-700">Yetki ataması yapabilirsiniz</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-600">✅</span>
                    <span className="text-sm text-red-700">Sistem ayarlarını değiştirebilirsiniz</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-600">✅</span>
                    <span className="text-sm text-red-700">Tüm modüllere erişebilirsiniz</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-600">✅</span>
                    <span className="text-sm text-red-700">Şirket ayarlarını düzenleyebilirsiniz</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-600">✅</span>
                    <span className="text-sm text-red-700">Tüm raporlara erişebilirsiniz</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-red-100 border border-red-300 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <span className="text-red-600">⚠️</span>
                  <span className="text-sm font-medium text-red-800">
                    Büyük güç, büyük sorumluluk getirir. Lütfen yetkilerinizi dikkatli kullanın.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Info Card */}
      <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
        <div className="flex items-center space-x-4">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl ${
            user?.is_SuperAdmin ? 'bg-red-500' : 'bg-primary-500'
          }`}>
            {user?.Name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">{user?.Name || 'Kullanıcı'}</h2>
            <p className="text-gray-500">{user?.Mail || 'email@example.com'}</p>
            <div className="flex items-center space-x-2 mt-2">
              {user?.is_SuperAdmin ? (
                <span className="bg-red-100 text-red-800 text-sm px-3 py-1 rounded-full font-medium">
                  👑 SuperAdmin - Tüm Yetkiler
                </span>
              ) : (
                <span className="bg-primary-100 text-primary-800 text-sm px-3 py-1 rounded-full font-medium">
                  🔐 {permissions.length} Aktif Yetki
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Permissions Section */}
      {!user?.is_SuperAdmin && (
        <div className="bg-white rounded-xl shadow-soft border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Yetki Detayları</h2>
            <p className="text-gray-600 text-sm">
              Aşağıdaki yetkilerle bu işlemleri gerçekleştirebilirsiniz
            </p>
          </div>

          <div className="p-6">
            {permissions.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
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
              <div className="space-y-6">
                {Object.entries(groupedPermissions).map(([type, typePermissions]) => (
                  <div key={type} className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                      {type === 'USER' && '👤 Kullanıcı Yetkileri'}
                      {type === 'ADMIN' && '⚙️ Yönetici Yetkileri'}
                      {type === 'PRODUCTION' && '🏭 Üretim Yetkileri'}
                      {type === 'REPORT' && '📊 Rapor Yetkileri'}
                      {type === 'SYSTEM' && '🔧 Sistem Yetkileri'}
                      {!['USER', 'ADMIN', 'PRODUCTION', 'REPORT', 'SYSTEM'].includes(type) && `📋 ${type} Yetkileri`}
                      <span className="ml-2 bg-primary-100 text-primary-800 text-xs px-2 py-1 rounded-full">
                        {typePermissions.length} yetki
                      </span>
                    </h3>
                    
                    <div className="grid grid-cols-1 gap-3">
                      {typePermissions.map((permission) => {
                        const translation = getPermissionTranslation(permission.Name)
                        
                        return (
                          <div
                            key={permission.id}
                            className="bg-green-50 border border-green-200 rounded-lg p-4 hover:bg-green-75 transition-colors"
                          >
                            <div className="flex items-start space-x-3">
                              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-white text-sm font-bold">✓</span>
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-green-800 mb-1">
                                  {translation.name}
                                </h4>
                                <p className="text-green-700 text-sm mb-2">
                                  {translation.description}
                                </p>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-gray-500 font-mono">
                                    {permission.Name}
                                  </span>
                                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                    Aktif
                                  </span>
                                </div>
                              </div>
                            </div>
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

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm">ℹ️</span>
          </div>
          <div>
            <h3 className="font-semibold text-blue-800 mb-2">Yetki Sistemi Hakkında</h3>
            <p className="text-blue-700 text-sm leading-relaxed mb-3">
              Bu sayfada hesabınıza tanımlı tüm yetkiler listelenmektedir. Yetkiler sistem yöneticisi tarafından atanır ve 
              gerçek zamanlı olarak güncellenir. Herhangi bir yetki problemi yaşıyorsanız sistem yöneticisi ile iletişime geçin.
            </p>
            <div className="flex flex-wrap gap-3 text-xs text-blue-600">
              <span className="flex items-center space-x-1">
                <span>🔄</span><span>Otomatik güncelleme</span>
              </span>
              <span className="flex items-center space-x-1">
                <span>🔒</span><span>Güvenli erişim</span>
              </span>
              <span className="flex items-center space-x-1">
                <span>⚡</span><span>Gerçek zamanlı</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg animate-slide-up">
          <div className="flex items-center space-x-2">
            <span>⚠️</span>
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-2 text-white hover:text-gray-200">
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default MyPermissionsPage 