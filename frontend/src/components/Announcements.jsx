import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

const Announcements = () => {
  const navigate = useNavigate()
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  const fetchAnnouncements = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get('/user/announcements')
      setAnnouncements(response.data.data.announcements || [])
    } catch (error) {
      console.error('Duyuru getirme hatası:', error)
      setError('Duyurular yüklenirken bir hata oluştu.')
    } finally {
      setLoading(false)
    }
  }

  const getAnnouncementTypeIcon = (type) => {
    switch (type) {
      case 'INFO':
        return { icon: 'ℹ️', color: 'bg-blue-50 border-blue-200 text-blue-800' }
      case 'WARNING':
        return { icon: '⚠️', color: 'bg-yellow-50 border-yellow-200 text-yellow-800' }
      case 'SUCCESS':
        return { icon: '✅', color: 'bg-green-50 border-green-200 text-green-800' }
      case 'ERROR':
        return { icon: '❌', color: 'bg-red-50 border-red-200 text-red-800' }
      case 'MAINTENANCE':
        return { icon: '🔧', color: 'bg-gray-50 border-gray-200 text-gray-800' }
      case 'UPDATE':
        return { icon: '🔄', color: 'bg-purple-50 border-purple-200 text-purple-800' }
      default:
        return { icon: '📢', color: 'bg-blue-50 border-blue-200 text-blue-800' }
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
      <div className="px-6 py-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-sm text-gray-600">Duyurular yükleniyor...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-6 py-4 text-center text-red-600">
        <span className="text-2xl mb-2 block">⚠️</span>
        <p className="text-sm">{error}</p>
        <button 
          onClick={fetchAnnouncements}
          className="mt-2 text-xs text-blue-600 hover:underline"
        >
          Tekrar dene
        </button>
      </div>
    )
  }

  if (announcements.length === 0) {
    return (
      <div className="px-6 py-4 text-gray-500 text-center">
        <span className="text-4xl mb-4 block">📢</span>
        <p>Henüz duyuru bulunmuyor.</p>
        <p className="text-sm mt-2">Burada sistem duyuruları görünecek.</p>
      </div>
    )
  }

  return (
    <div className="px-6 py-4">
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {announcements.map((announcement) => {
          const typeConfig = getAnnouncementTypeIcon(announcement.type)
          
          return (
            <div 
              key={announcement.id} 
              onClick={() => navigate(`/announcements/${announcement.id}`)}
              className={`p-4 rounded-lg border ${typeConfig.color} cursor-pointer hover:shadow-md transition-shadow`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <span className="text-xl">{typeConfig.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium text-sm">{announcement.title}</h4>
                    </div>
                    <p className="text-sm opacity-90 mb-2">{announcement.content}</p>
                    <div className="flex items-center justify-between text-xs opacity-75">
                      <span>{formatDate(announcement.created_at)}</span>
                      {announcement.validUntil && (
                        <span>
                          Geçerli: {formatDate(announcement.validUntil)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      
      {announcements.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            {announcements.length} aktif duyuru görüntüleniyor
          </p>
        </div>
      )}
    </div>
  )
}

export default Announcements 