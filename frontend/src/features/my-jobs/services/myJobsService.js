import api from '../../../services/api'

const myJobsService = {
  // Kendi işlerini getirme
  getMyJobs: async () => {
    const response = await api.get('/my-jobs')
    return response.data
  },

  // Belirli işin detayını getirme
  getMyJobDetail: async (stepId) => {
    const response = await api.get(`/my-jobs/${stepId}`)
    return response.data
  },

  // İşi başlatma
  startMyJob: async (stepId) => {
    const response = await api.post(`/my-jobs/${stepId}/start`)
    return response.data
  },

  // İşi tamamlama
  completeMyJob: async (stepId, notes = '') => {
    const response = await api.post(`/my-jobs/${stepId}/complete`, { notes })
    return response.data
  },

  // İş notlarını güncelleme
  updateMyJobNotes: async (stepId, notes) => {
    const response = await api.put(`/my-jobs/${stepId}/notes`, { notes })
    return response.data
  }
}

export default myJobsService 