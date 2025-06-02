import api from '../../../services/api'

const paymentService = {
  // 3D Secure ödeme başlatma
  start3DSecurePayment: async (paymentData) => {
    const response = await api.post('/payment/3dsecure', paymentData)
    return response.data
  },

  // Kullanıcının kayıtlı kartı var mı kontrol et
  checkUserCard: async (userId) => {
    const response = await api.get(`/payment/cards/check/${userId}`)
    return response.data
  },

  // Kullanıcının tüm kartlarını getir
  getUserCards: async (userId) => {
    const response = await api.get(`/payment/cards/${userId}`)
    return response.data
  },

  // Yeni kart kaydet
  saveUserCard: async (cardData) => {
    const response = await api.post('/payment/cards/save', { cardData })
    return response.data
  },

  // Ödeme geçmişini getir
  getPaymentHistory: async (userId) => {
    const response = await api.get(`/payment/history/${userId}`)
    return response.data
  }
}

export default paymentService 