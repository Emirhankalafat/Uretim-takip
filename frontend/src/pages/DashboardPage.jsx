import { useSelector } from 'react-redux'
import { useState, useEffect } from 'react'
import userService from '../features/users/services/userService'
import api from '../services/api'

const DashboardPage = () => {
  const { user } = useSelector((state) => state.auth)
  const [profileData, setProfileData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Dashboard profil verilerini al
  useEffect(() => {
    fetchDashboardProfile()
  }, [])

  const fetchDashboardProfile = async () => {
    try {
      setLoading(true)
      setError(null)
      // Kullanıcı bilgisi varsa profil verilerini çek
      if (user) {
        const response = await api.get('/auth/dashboard-profile')
        setProfileData(response.data.profile)
      }
    } catch (error) {
      console.error('Dashboard profil verileri alınamadı:', error)
      setError('Dashboard verileri yüklenirken bir hata oluştu.')
    } finally {
      setLoading(false)
    }
  }

  // Loading durumunda
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Dashboard yükleniyor...</p>
        </div>
      </div>
    )
  }

  // Hata durumunda
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Bir hata oluştu</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={fetchDashboardProfile}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    )
  }

  // Trial süresi hesaplama
  const getTrialInfo = () => {
    if (profileData?.company_stats?.subscription_end) {
      const currentDate = new Date()
      const endDate = new Date(profileData.company_stats.subscription_end)
      
      // Zaman farkını hesapla (milisaniye cinsinden)
      const timeDiff = endDate.getTime() - currentDate.getTime()
      
      // Gün cinsine çevir ve yukarı yuvarla
      const remainingDays = Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)))
      
      return {
        remainingDays,
        isExpired: remainingDays === 0,
        totalDays: 14, // Trial süresi 14 gün
        package: profileData.company_stats.subscription_package
      }
    }
    
    return {
      remainingDays: 0,
      isExpired: true,
      totalDays: 14,
      package: 'trial'
    }
  }

  const trialInfo = getTrialInfo()

  // Normal kullanıcı için kişisel bilgiler
  const UserDashboard = () => (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Hoş geldin, {user?.name || 'Kullanıcı'}!
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Kişisel dashboard'unuz
          </p>
        </div>

        {/* Kullanıcı Bilgileri */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Kişisel Bilgiler
              </h3>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="flex items-center">
                <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-lg font-medium text-primary-700">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-900">
                    {user?.name || 'İsimsiz Kullanıcı'}
                  </div>
                  <div className="text-sm text-gray-500">
                    Kullanıcı
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">E-posta:</span>
                  <span className="text-sm font-medium text-gray-900">{profileData?.mail || user?.email || 'Belirtilmemiş'}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Şirket:</span>
                  <span className="text-sm font-medium text-gray-900">{profileData?.company_name || 'Belirtilmemiş'}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Kayıt Tarihi:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {profileData?.created_at ? new Date(profileData.created_at).toLocaleDateString('tr-TR') : 'Bilinmiyor'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Kullanıcı Tipi:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {profileData?.is_SuperAdmin ? 'Super Admin' : 'Kullanıcı'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Hızlı İşlemler */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Hızlı İşlemler
              </h3>
            </div>
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 gap-4">
                <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <span className="text-2xl mr-3">🔐</span>
                  <div className="text-left">
                    <div className="text-sm font-medium text-gray-900">
                      Yetkilerim
                    </div>
                    <div className="text-sm text-gray-500">
                      Sahip olduğum yetkileri görüntüle
                    </div>
                  </div>
                </button>

                <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <span className="text-2xl mr-3">📊</span>
                  <div className="text-left">
                    <div className="text-sm font-medium text-gray-900">
                      Raporlarım
                    </div>
                    <div className="text-sm text-gray-500">
                      Oluşturduğum raporları görüntüle
                    </div>
                  </div>
                </button>

                <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <span className="text-2xl mr-3">⚙️</span>
                  <div className="text-left">
                    <div className="text-sm font-medium text-gray-900">
                      Profil Ayarları
                    </div>
                    <div className="text-sm text-gray-500">
                      Kişisel bilgilerimi düzenle
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Son Aktiviteler */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Son Aktivitelerim
            </h3>
          </div>
          <div className="px-6 py-4">
            <div className="text-center py-8 text-gray-500">
              <span className="text-4xl mb-4 block">📝</span>
              <p>Henüz aktivite bulunmuyor.</p>
              <p className="text-sm mt-2">İşlemleriniz burada görünecek.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  // Super Admin için sistem dashboard'u
  const AdminDashboard = () => (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Hoş geldin, {user?.name || 'Admin'}!
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Sistem yönetimi dashboard'u
          </p>
          {user?.is_SuperAdmin && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 mt-2">
              SuperAdmin
            </span>
          )}
        </div>

        {/* Trial Uyarısı */}
        <div className={`mb-8 rounded-lg p-4 ${trialInfo.isExpired ? 'bg-red-50 border border-red-200' : trialInfo.remainingDays <= 7 ? 'bg-yellow-50 border border-yellow-200' : 'bg-blue-50 border border-blue-200'}`}>
          <div className="flex items-center">
            <span className="text-2xl mr-3">
              {trialInfo.isExpired ? '⚠️' : trialInfo.remainingDays <= 7 ? '⏰' : 'ℹ️'}
            </span>
            <div>
              <h3 className={`text-sm font-medium ${trialInfo.isExpired ? 'text-red-800' : trialInfo.remainingDays <= 7 ? 'text-yellow-800' : 'text-blue-800'}`}>
                {trialInfo.isExpired ? 'Trial Süresi Doldu!' : `Trial Süresi: ${trialInfo.remainingDays} Gün Kaldı`}
              </h3>
              <p className={`text-sm ${trialInfo.isExpired ? 'text-red-700' : trialInfo.remainingDays <= 7 ? 'text-yellow-700' : 'text-blue-700'}`}>
                {trialInfo.isExpired 
                  ? 'Lütfen lisansınızı yenileyin veya satın alın.'
                  : `${trialInfo.totalDays} günlük trial sürenizin ${trialInfo.remainingDays} günü kaldı.`
                }
              </p>
            </div>
          </div>
        </div>

        {/* Sistem İstatistikleri */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {loading ? (
            <div className="col-span-4 text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">İstatistikler yükleniyor...</p>
            </div>
          ) : (
            <>
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <span className="text-2xl">👥</span>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Toplam Kullanıcı
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {profileData?.company_stats?.total_users || 0}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <span className="text-2xl">✅</span>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Aktif Kullanıcı
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {profileData?.company_stats?.active_users || 0}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <span className="text-2xl">👑</span>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Onaylı Kullanıcı
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {profileData?.company_stats?.confirmed_users || 0}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <span className="text-2xl">⏳</span>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Trial Günü
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {trialInfo.remainingDays}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sistem Yönetimi */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Sistem Yönetimi
              </h3>
            </div>
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 gap-4">
                <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <span className="text-2xl mr-3">👥</span>
                  <div className="text-left">
                    <div className="text-sm font-medium text-gray-900">
                      Kullanıcı Yönetimi
                    </div>
                    <div className="text-sm text-gray-500">
                      Kullanıcıları ve yetkilerini yönet
                    </div>
                  </div>
                </button>

                <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <span className="text-2xl mr-3">📊</span>
                  <div className="text-left">
                    <div className="text-sm font-medium text-gray-900">
                      Sistem Raporları
                    </div>
                    <div className="text-sm text-gray-500">
                      Detaylı sistem raporlarını görüntüle
                    </div>
                  </div>
                </button>

                <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <span className="text-2xl mr-3">⚙️</span>
                  <div className="text-left">
                    <div className="text-sm font-medium text-gray-900">
                      Sistem Ayarları
                    </div>
                    <div className="text-sm text-gray-500">
                      Genel sistem konfigürasyonu
                    </div>
                  </div>
                </button>

                <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <span className="text-2xl mr-3">🔒</span>
                  <div className="text-left">
                    <div className="text-sm font-medium text-gray-900">
                      Güvenlik Ayarları
                    </div>
                    <div className="text-sm text-gray-500">
                      Güvenlik ve erişim kontrolü
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Sistem Durumu */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Sistem Durumu
              </h3>
            </div>
            <div className="px-6 py-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-xl mr-3">🟢</span>
                    <div>
                      <div className="text-sm font-medium text-gray-900">Sistem Durumu</div>
                      <div className="text-sm text-gray-500">Tüm servisler çalışıyor</div>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-green-600">Çevrimiçi</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-xl mr-3">📡</span>
                    <div>
                      <div className="text-sm font-medium text-gray-900">API Durumu</div>
                      <div className="text-sm text-gray-500">Tüm endpoint'ler aktif</div>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-green-600">Aktif</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-xl mr-3">💾</span>
                    <div>
                      <div className="text-sm font-medium text-gray-900">Veritabanı</div>
                      <div className="text-sm text-gray-500">Bağlantı sağlıklı</div>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-green-600">Bağlı</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-xl mr-3">💳</span>
                    <div>
                      <div className="text-sm font-medium text-gray-900">Lisans Durumu</div>
                      <div className="text-sm text-gray-500">Trial sürümü</div>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-blue-600">
                    {trialInfo.remainingDays} gün kaldı
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  // Kullanıcı tipine göre dashboard'u render et
  return user?.is_SuperAdmin ? <AdminDashboard /> : <UserDashboard />
}

export default DashboardPage 