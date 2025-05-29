import api from '../../../services/api'

const orderService = {
  // Siparişleri listeleme
  getOrders: async (params = {}) => {
    const response = await api.get('/orders', { params })
    return response.data
  },

  // Tek sipariş getirme
  getOrderById: async (id) => {
    const response = await api.get(`/orders/${id}`)
    return response.data
  },

  // Sipariş oluşturma
  createOrder: async (orderData) => {
    const response = await api.post('/orders', orderData)
    return response.data
  },

  // Sipariş güncelleme
  updateOrder: async (id, orderData) => {
    const response = await api.put(`/orders/${id}`, orderData)
    return response.data
  },

  // Sipariş silme
  deleteOrder: async (id) => {
    const response = await api.delete(`/orders/${id}`)
    return response.data
  },

  // Product steps'i şablon olarak getirme
  getProductStepsTemplate: async (productId) => {
    const response = await api.get(`/orders/product-steps-template/${productId}`)
    return response.data
  }
}

export default orderService 