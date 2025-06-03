import { useState, useEffect, useRef } from 'react'
import { useMyJobs } from '../hooks/useMyJobs'
import Toast from '../../../components/Toast'

const MyJobsPage = () => {
  const [jobs, setJobs] = useState({
    current: [],
    inProgress: [],
    upcoming: [],
    completed: []
  })
  const [summary, setSummary] = useState({})
  const [selectedJob, setSelectedJob] = useState(null)
  const [showJobDetail, setShowJobDetail] = useState(false)
  const [toast, setToast] = useState(null)
  const [activeTab, setActiveTab] = useState('current')
  const [notes, setNotes] = useState('')
  const [isInitialized, setIsInitialized] = useState(false)
  const hasFetched = useRef(false) // Duplicate request'leri engellemek için

  const {
    loading,
    error,
    setError,
    canViewMyJobs,
    fetchMyJobs,
    fetchMyJobDetail,
    startJob,
    completeJob,
    updateJobNotes
  } = useMyJobs()

  useEffect(() => {
    const initializeJobs = async () => {
      if (canViewMyJobs && !hasFetched.current) {
        hasFetched.current = true
        await loadMyJobs()
        setIsInitialized(true)
      } else if (!canViewMyJobs) {
        setIsInitialized(true)
      }
    }

    initializeJobs()
  }, [canViewMyJobs])

  const loadMyJobs = async () => {
    const response = await fetchMyJobs()
    if (response) {
      setJobs(response.jobs)
      setSummary(response.summary)
    }
  }

  const handleStartJob = async (stepId) => {
    const success = await startJob(stepId)
    if (success) {
      setToast({
        type: 'success',
        message: 'İş başarıyla başlatıldı!'
      })
      loadMyJobs()
      setShowJobDetail(false)
    }
  }

  const handleCompleteJob = async (stepId) => {
    const response = await completeJob(stepId, notes)
    if (response) {
      setToast({
        type: 'success',
        message: response.orderCompleted 
          ? 'İş tamamlandı! Sipariş de tamamlandı.' 
          : 'İş başarıyla tamamlandı!'
      })
      loadMyJobs()
      setShowJobDetail(false)
      setNotes('')
    }
  }

  const handleUpdateNotes = async (stepId) => {
    const success = await updateJobNotes(stepId, notes)
    if (success) {
      setToast({
        type: 'success',
        message: 'Notlar güncellendi!'
      })
      setSelectedJob(prev => prev ? { ...prev, notes } : null)
    }
  }

  const showJobDetails = async (job) => {
    const jobDetail = await fetchMyJobDetail(job.id)
    if (jobDetail) {
      setSelectedJob(jobDetail)
      setNotes(jobDetail.notes || '')
      setShowJobDetail(true)
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'URGENT': return 'from-red-500 to-red-600'
      case 'HIGH': return 'from-orange-500 to-orange-600'
      case 'NORMAL': return 'from-blue-500 to-blue-600'
      case 'LOW': return 'from-gray-500 to-gray-600'
      default: return 'from-blue-500 to-blue-600'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'WAITING': return 'bg-yellow-100 text-yellow-800'
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800'
      case 'COMPLETED': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const tabs = [
    { key: 'current', label: 'Sıram Geldi', count: summary.current || 0, color: 'text-green-600' },
    { key: 'inProgress', label: 'Devam Ediyor', count: summary.inProgress || 0, color: 'text-blue-600' },
    { key: 'upcoming', label: 'Gelecek İşler', count: summary.upcoming || 0, color: 'text-orange-600' },
    { key: 'completed', label: 'Tamamlanan', count: summary.completed || 0, color: 'text-gray-600' }
  ]

  if (isInitialized && !canViewMyJobs) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">🚫</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erişim Reddedildi</h2>
          <p className="text-gray-600">Bu sayfayı görüntülemek için gerekli yetkiniz bulunmuyor.</p>
        </div>
      </div>
    )
  }

  if (!isInitialized || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">İşler yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Bir hata oluştu</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => {
              setError(null)
              hasFetched.current = false
              loadMyJobs()
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-soft p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">İşlerim</h1>
            <p className="text-blue-100 mt-1">Bana atanan işleri yönet</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{summary.total || 0}</div>
            <div className="text-blue-100 text-sm">Toplam İş</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors relative ${
                  activeTab === tab.key
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    activeTab === tab.key ? 'bg-primary-100 text-primary-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Jobs List */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Yükleniyor...</h3>
                <p className="text-sm text-gray-600">İşler getiriliyor</p>
              </div>
            </div>
          ) : jobs[activeTab]?.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📋</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Bu kategoride iş yok</h3>
              <p className="text-gray-600">
                {activeTab === 'current' && 'Henüz sırası gelen iş bulunmuyor.'}
                {activeTab === 'inProgress' && 'Şu anda devam eden iş bulunmuyor.'}
                {activeTab === 'upcoming' && 'Gelecekte yapılacak iş bulunmuyor.'}
                {activeTab === 'completed' && 'Henüz tamamlanan iş bulunmuyor.'}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {jobs[activeTab]?.map((job) => (
                <div
                  key={job.id}
                  className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-6 hover:shadow-medium transition-all duration-300 cursor-pointer"
                  onClick={() => showJobDetails(job)}
                >
                  {/* Job Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${getPriorityColor(job.order.priority)}`}></div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{job.step_name}</h3>
                        <p className="text-sm text-gray-600">#{job.order.order_number}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                      {job.status === 'WAITING' ? 'Bekliyor' : 
                       job.status === 'IN_PROGRESS' ? 'Devam Ediyor' : 'Tamamlandı'}
                    </span>
                  </div>

                  {/* Job Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="w-4 h-4 mr-2">👤</span>
                      <span>{job.order?.customer?.Name || "Bilinmiyor"}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="w-4 h-4 mr-2">📦</span>
                      <span>{job.product?.name || "Bilinmiyor"}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="w-4 h-4 mr-2">🔢</span>
                      <span>Adım {job.step_number}</span>
                    </div>
                  </div>

                  {/* Action Indicator */}
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      {job.isMyTurn ? '✅ Sıra sende' : '⏳ Sıra bekliyor'}
                    </div>
                    <div className="text-xs text-gray-400">
                      Detay için tıkla →
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Job Detail Modal */}
      {showJobDetail && selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">{selectedJob.step_name}</h2>
                <button
                  onClick={() => setShowJobDetail(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Job Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sipariş</label>
                  <p className="text-gray-900">{selectedJob.order?.order_number || "-"}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Müşteri</label>
                  <p className="text-gray-900">{selectedJob.order?.customer?.Name || "Bilinmiyor"}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ürün</label>
                  <p className="text-gray-900">{selectedJob.product?.name || "Bilinmiyor"}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Adım Sırası</label>
                  <p className="text-gray-900">{selectedJob.step_number}</p>
                </div>
              </div>

              {/* Description */}
              {selectedJob.step_description && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                  <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{selectedJob.step_description}</p>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notlar</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="İş ile ilgili notlarınızı buraya yazabilirsiniz..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows="4"
                />
                <button
                  onClick={() => handleUpdateNotes(selectedJob.id)}
                  className="mt-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Notları Kaydet
                </button>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                {selectedJob.status === 'WAITING' && selectedJob.isMyTurn && (
                  <button
                    onClick={() => handleStartJob(selectedJob.id)}
                    className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-4 rounded-lg font-medium hover:from-green-600 hover:to-green-700 transition-all"
                  >
                    🚀 İşi Başlat
                  </button>
                )}
                
                {selectedJob.status === 'IN_PROGRESS' && (
                  <button
                    onClick={() => handleCompleteJob(selectedJob.id)}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-all"
                  >
                    ✅ İşi Tamamla
                  </button>
                )}

                {!selectedJob.isMyTurn && selectedJob.status === 'WAITING' && (
                  <div className="flex-1 bg-gray-100 text-gray-600 py-3 px-4 rounded-lg text-center">
                    ⏳ Önceki adımların tamamlanması bekleniyor
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}

export default MyJobsPage 