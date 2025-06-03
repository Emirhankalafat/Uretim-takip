import { useSelector } from 'react-redux'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

const DashboardPage = () => {
  const { user } = useSelector((state) => state.auth)
  const navigate = useNavigate()
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

  // Subscription durumu analizi
  const getSubscriptionStatus = () => {
    const subscriptionPackage = profileData?.company_stats?.subscription_package || 'trial'
    const subscriptionEnd = profileData?.company_stats?.subscription_end
    
    if (!subscriptionEnd) {
      return { type: 'trial', needsUpgrade: true, remainingDays: 0 }
    }
    
    const currentDate = new Date()
    const endDate = new Date(subscriptionEnd)
    const timeDiff = endDate.getTime() - currentDate.getTime()
    const remainingDays = Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)))
    
    // Premium yenileme uyarısı için gün sayısı (değiştirilebilir)
    const PREMIUM_RENEWAL_WARNING_DAYS = 7
    
    if (subscriptionPackage === 'premium') {
      // Premium için: belirtilen gün kaldıysa yenileme önerisi
      return {
        type: 'premium',
        needsRenewal: remainingDays <= PREMIUM_RENEWAL_WARNING_DAYS,
        remainingDays,
        isExpired: remainingDays === 0
      }
    } else {
      // Trial/Basic için: premium'a geçiş önerisi
      return {
        type: subscriptionPackage,
        needsUpgrade: true,
        remainingDays,
        isExpired: remainingDays === 0
      }
    }
  }

  const subscriptionStatus = getSubscriptionStatus()

  // Ödeme sayfasına yönlendir
  const handleUpgradeClick = () => {
    navigate('/payment')
  }

  // Subscription Widget Component
  const SubscriptionWidget = () => {
    if (!subscriptionStatus) return null

    // Premium ve süresi yeterli
    if (subscriptionStatus.type === 'premium' && !subscriptionStatus.needsRenewal && !subscriptionStatus.isExpired) {
      return (
        <div className="mb-8 rounded-lg p-4 bg-green-50 border border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-2xl mr-3">✅</span>
              <div>
                <h3 className="text-sm font-medium text-green-800">Premium Üyelik Aktif</h3>
                <p className="text-sm text-green-700">
                  Premium üyeliğiniz {subscriptionStatus.remainingDays} gün daha geçerli.
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    }

    // Premium ama yenileme gerekiyor (son 7 gün)
    if (subscriptionStatus.type === 'premium' && subscriptionStatus.needsRenewal) {
      return (
        <div className="mb-8 rounded-lg p-4 bg-orange-50 border border-orange-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-2xl mr-3">⚠️</span>
              <div>
                <h3 className="text-sm font-medium text-orange-800">
                  {subscriptionStatus.isExpired ? 'Premium Üyelik Süresi Doldu!' : 'Premium Üyelik Yenilemesi'}
                </h3>
                <p className="text-sm text-orange-700">
                  {subscriptionStatus.isExpired 
                    ? 'Premium üyeliğinizin süresi doldu. Özellikleriniz askıya alınacak.'
                    : `Premium üyeliğinizin ${subscriptionStatus.remainingDays} günü kaldı. Şimdi yenileyin!`
                  }
                </p>
              </div>
            </div>
            <button
              onClick={handleUpgradeClick}
              className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors text-sm font-medium"
            >
              Üyeliği Yenile (30 Gün)
            </button>
          </div>
        </div>
      )
    }

    // Trial/Basic için premium'a geçiş
    return (
      <div className="mb-8 rounded-lg p-4 bg-blue-50 border border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-2xl mr-3">🚀</span>
            <div>
              <h3 className="text-sm font-medium text-blue-800">Premium'a Geçin!</h3>
              <p className="text-sm text-blue-700">
                {subscriptionStatus.type === 'trial' 
                  ? `Trial sürenizin ${subscriptionStatus.remainingDays} günü kaldı. Premium'a geçerek tüm özelliklerin keyfini çıkarın!`
                  : 'Basic planınızı Premium\'a yükselterek daha fazla özellik kazanın!'
                }
              </p>
              <div className="mt-2 text-xs text-blue-600">
                ✨ Sınırsız proje • 📊 Gelişmiş analitik • 🎯 Öncelikli destek
              </div>
            </div>
          </div>
          <button
            onClick={handleUpgradeClick}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Premium'a Geç (₺99/30gün)
          </button>
        </div>
      </div>
    )
  }

  // Normal kullanıcı için kişisel bilgiler
  const UserDashboard = () => (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Hoş geldin, {user?.Name || user?.name || 'Kullanıcı'}!
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Kişisel dashboard'unuz
          </p>
        </div>

        {/* Subscription Widget */}
        {user?.is_SuperAdmin && <SubscriptionWidget />}

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
                    {(user?.Name || user?.name || 'U').charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-900">
                    {user?.Name || user?.name || 'İsimsiz Kullanıcı'}
                  </div>
                  <div className="text-sm text-gray-500">
                    Kullanıcı
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">E-posta:</span>
                  <span className="text-sm font-medium text-gray-900">{profileData?.mail || user?.Mail || user?.email || 'Belirtilmemiş'}</span>
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
                    {profileData?.is_SuperAdmin || user?.is_SuperAdmin ? 'Super Admin' : 'Kullanıcı'}
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
                <button 
                  onClick={() => navigate('/my-permissions')}
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
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
                {/* Sadece rapor yetkisi olanlar için Raporlarım butonu */}
                {user?.permissions?.some(p => p.Name === 'REPORT_READ') || user?.is_SuperAdmin ? (
                  <button onClick={() => navigate('/reports')} className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <span className="text-2xl mr-3">📊</span>
                    <div className="text-left">
                      <div className="text-sm font-medium text-gray-900">
                        Raporlarım
                      </div>
                      <div className="text-sm text-gray-500">
                        Oluşturduğunuz raporları görüntüleyin
                      </div>
                    </div>
                  </button>
                ) : null}
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
        {/* Duyurular Alanı (placeholder) */}
        <div className="bg-white shadow rounded-lg mt-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Duyurular
            </h3>
          </div>
          <div className="px-6 py-4 text-gray-500 text-center">
            <span className="text-4xl mb-4 block">📢</span>
            <p>Henüz duyuru bulunmuyor.</p>
            <p className="text-sm mt-2">Burada sistem duyuruları görünecek.</p>
          </div>
        </div>

        {/* SuperAdmin için Şirket İsmini Düzenle butonu */}
        {user?.is_SuperAdmin && (
          <div className="mt-8 flex justify-end">
            <button
              onClick={() => navigate('/company-edit')}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-all shadow"
            >
              Şirket İsmini Düzenle
            </button>
          </div>
        )}
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
            Hoş geldin, {user?.Name || user?.name || 'Admin'}!
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

        {/* Subscription Widget */}
        <SubscriptionWidget />

        {/* Sistem İstatistikleri */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
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
                      Abonelik Durumu
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {subscriptionStatus?.type === 'premium'
                        ? `${subscriptionStatus.remainingDays} gün`
                        : subscriptionStatus?.type === 'basic'
                          ? 'Basic'
                          : 'Trial'}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Duyurular Alanı (SuperAdmin için) */}
        {user?.is_SuperAdmin && (
          <div className="bg-white shadow rounded-lg mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Duyurular</h3>
            </div>
            <div className="px-6 py-4 text-gray-500 text-center">
              <span className="text-4xl mb-4 block">📢</span>
              <p>Henüz duyuru bulunmuyor.</p>
              <p className="text-sm mt-2">Burada sistem duyuruları görünecek.</p>
            </div>
          </div>
        )}
        {/* Küçük Yönlendirme Kutucukları */}
        {user?.is_SuperAdmin && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <button onClick={() => navigate('/company-edit')} className="flex flex-col items-center justify-center bg-primary-50 border border-primary-200 rounded-lg p-4 hover:bg-primary-100 transition">
              <span className="text-2xl mb-2">🏢</span>
              <span className="font-medium text-primary-800">Şirketi Düzenle</span>
            </button>
            <button onClick={() => navigate('/reports')} className="flex flex-col items-center justify-center bg-pink-50 border border-pink-200 rounded-lg p-4 hover:bg-pink-100 transition">
              <span className="text-2xl mb-2">📊</span>
              <span className="font-medium text-pink-800">Raporlar</span>
            </button>
            <button onClick={() => navigate('/user-management')} className="flex flex-col items-center justify-center bg-blue-50 border border-blue-200 rounded-lg p-4 hover:bg-blue-100 transition">
              <span className="text-2xl mb-2">👥</span>
              <span className="font-medium text-blue-800">Kullanıcı Yönetimi</span>
            </button>
            <button onClick={() => navigate('/my-permissions')} className="flex flex-col items-center justify-center bg-green-50 border border-green-200 rounded-lg p-4 hover:bg-green-100 transition">
              <span className="text-2xl mb-2">🔐</span>
              <span className="font-medium text-green-800">Yetkilerim</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )

  // Kullanıcı tipine göre dashboard'u render et
  return user?.is_SuperAdmin ? <AdminDashboard /> : <UserDashboard />
}

export default DashboardPage 