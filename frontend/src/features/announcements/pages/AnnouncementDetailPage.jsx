import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../../services/api'

const AnnouncementDetailPage = () => {
  const { announcementId } = useParams()
  const navigate = useNavigate()
  const [announcement, setAnnouncement] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchAnnouncementDetail()
  }, [announcementId])

  const fetchAnnouncementDetail = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get(`/user/announcements/${announcementId}`)
      setAnnouncement(response.data.data.announcement)
    } catch (error) {
      console.error('Duyuru detay getirme hatası:', error)
      if (error.response?.status === 404) {
        setError('Duyuru bulunamadı.')
      } else {
        setError('Duyuru detayı yüklenirken bir hata oluştu.')
      }
    } finally {
      setLoading(false)
    }
  }

  const getAnnouncementTypeConfig = (type) => {
    switch (type) {
      case 'INFO':
        return { 
          icon: '📢', 
          color: 'bg-blue-50 border-blue-200', 
          textColor: 'text-blue-800',
          bgColor: 'bg-blue-100'
        }
      case 'WARNING':
        return { 
          icon: '⚠️', 
          color: 'bg-yellow-50 border-yellow-200', 
          textColor: 'text-yellow-800',
          bgColor: 'bg-yellow-100'
        }
      case 'SUCCESS':
        return { 
          icon: '✅', 
          color: 'bg-green-50 border-green-200', 
          textColor: 'text-green-800',
          bgColor: 'bg-green-100'
        }
      case 'ERROR':
        return { 
          icon: '❌', 
          color: 'bg-red-50 border-red-200', 
          textColor: 'text-red-800',
          bgColor: 'bg-red-100'
        }
      case 'MAINTENANCE':
        return { 
          icon: '🔧', 
          color: 'bg-gray-50 border-gray-200', 
          textColor: 'text-gray-800',
          bgColor: 'bg-gray-100'
        }
      case 'UPDATE':
        return { 
          icon: '🔄', 
          color: 'bg-purple-50 border-purple-200', 
          textColor: 'text-purple-800',
          bgColor: 'bg-purple-100'
        }
      default:
        return { 
          icon: '📢', 
          color: 'bg-blue-50 border-blue-200', 
          textColor: 'text-blue-800',
          bgColor: 'bg-blue-100'
        }
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Duyuru yükleniyor...</p>
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

  if (!announcement) {
    return null
  }

  const typeConfig = getAnnouncementTypeConfig(announcement.type)

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
              <span>Geri Dön</span>
            </button>
            <h1 className="text-lg font-semibold text-gray-900">Duyuru Detayı</h1>
            <div className="w-20"></div> {/* Spacer */}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className={`bg-white rounded-lg shadow-sm border-2 ${typeConfig.color} overflow-hidden`}>
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-start space-x-4">
              <div className={`p-3 rounded-full ${typeConfig.bgColor}`}>
                <span className="text-2xl">{typeConfig.icon}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-2xl font-bold text-gray-900">{announcement.title}</h1>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${typeConfig.bgColor} ${typeConfig.textColor}`}>
                    {announcement.type}
                  </span>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>📅 {formatDate(announcement.created_at)}</span>
                  {announcement.validUntil && (
                    <span>⏰ Geçerli: {formatDate(announcement.validUntil)}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="prose max-w-none">
              <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-wrap">
                {announcement.content}
              </p>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Dashboard'a Dön
          </button>
        </div>
      </div>
    </div>
  )
}

export default AnnouncementDetailPage 