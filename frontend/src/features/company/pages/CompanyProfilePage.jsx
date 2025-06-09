import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../../services/api'

const CompanyProfilePage = () => {
  const navigate = useNavigate()
  const [company, setCompany] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [saveLoading, setSaveLoading] = useState(false)

  useEffect(() => {
    fetchCompanyProfile()
  }, [])

  const fetchCompanyProfile = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get('/user/company/profile')
      setCompany(response.data.data.company)
      setEditName(response.data.data.company.Name)
    } catch (error) {
      console.error('Şirket profili getirme hatası:', error)
      setError('Şirket profili yüklenirken bir hata oluştu.')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveName = async () => {
    if (!editName.trim()) {
      alert('Şirket ismi boş olamaz.')
      return
    }

    try {
      setSaveLoading(true)
      const response = await api.put('/user/company/profile', {
        name: editName.trim()
      })
      setCompany(response.data.data.company)
      setIsEditing(false)
      alert('Şirket ismi başarıyla güncellendi.')
    } catch (error) {
      console.error('Şirket ismi güncelleme hatası:', error)
      if (error.response?.status === 403) {
        alert('Sadece SuperAdmin şirket ismini değiştirebilir.')
      } else {
        alert('Şirket ismi güncellenirken bir hata oluştu.')
      }
    } finally {
      setSaveLoading(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const copyApiKey = async () => {
    try {
      await navigator.clipboard.writeText(company.api_key)
      alert('API key kopyalandı!')
    } catch (error) {
      console.error('Kopyalama hatası:', error)
      alert('API key kopyalanamadı.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Şirket profili yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <span className="text-6xl mb-4 block">⚠️</span>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Hata</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Dashboard'a Dön
          </button>
        </div>
      </div>
    )
  }

  if (!company) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Dashboard'a Dön</span>
            </button>
            <h1 className="text-lg font-semibold text-gray-900">Şirket Profili</h1>
            <div className="w-32"></div> {/* Spacer */}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          
          {/* Company Info */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Şirket Bilgileri</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Company Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Şirket Adı
                </label>
                {isEditing ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Şirket adını girin"
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={handleSaveName}
                        disabled={saveLoading}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
                      >
                        {saveLoading ? 'Kaydediliyor...' : 'Kaydet'}
                      </button>
                      <button
                        onClick={() => {
                          setIsEditing(false)
                          setEditName(company.Name)
                        }}
                        className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors text-sm"
                      >
                        İptal
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-medium text-gray-900">{company.Name}</span>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Düzenle
                    </button>
                  </div>
                )}
              </div>



              {/* Created Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kayıt Tarihi
                </label>
                <span className="text-lg text-gray-900">{formatDate(company.Created_At)}</span>
              </div>

              {/* Subscription */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Abonelik Paketi
                </label>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  {company.Suspscription_package}
                </span>
              </div>
            </div>
          </div>

          {/* API Key Section */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">API Anahtarı</h2>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    API Key
                  </label>
                  <div className="font-mono text-sm bg-white p-3 rounded border break-all">
                    {company.api_key || 'API anahtarı bulunamadı'}
                  </div>
                </div>
                <button
                  onClick={copyApiKey}
                  className="ml-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm"
                >
                  Kopyala
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Bu anahtarı API istekleri için kullanabilirsiniz. Güvenli bir yerde saklayın.
              </p>
            </div>
          </div>

          {/* Statistics */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">İstatistikler</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600">{company._count?.users || 0}</div>
                <div className="text-sm text-gray-600">Aktif Kullanıcı</div>
                <div className="text-xs text-gray-500">/ {company.Max_User} maksimum</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600">{company._count?.products || 0}</div>
                <div className="text-sm text-gray-600">Ürün</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-3xl font-bold text-purple-600">{company._count?.orders || 0}</div>
                <div className="text-sm text-gray-600">Sipariş</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default CompanyProfilePage 