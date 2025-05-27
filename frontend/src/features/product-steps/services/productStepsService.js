import api from '../../../services/api'

const productStepsService = {
  // Ürün adımlarını listeleme
  getProductSteps: async (params = {}) => {
    const response = await api.get('/product-steps', { params })
    return response.data
  },

  // Belirli ürünün adımlarını getirme
  getStepsByProduct: async (productId) => {
    const response = await api.get(`/product-steps/product/${productId}`)
    return response.data
  },

  // Tek adım getirme
  getProductStepById: async (id) => {
    const response = await api.get(`/product-steps/${id}`)
    return response.data
  },

  // Ürün adımı oluşturma
  createProductStep: async (stepData) => {
    const response = await api.post('/product-steps', stepData)
    return response.data
  },

  // Ürün adımı güncelleme
  updateProductStep: async (id, stepData) => {
    const response = await api.put(`/product-steps/${id}`, stepData)
    return response.data
  },

  // Ürün adımı silme
  deleteProductStep: async (id) => {
    const response = await api.delete(`/product-steps/${id}`)
    return response.data
  },

  // Adım sırasını güncelleme
  reorderProductSteps: async (productId, steps) => {
    const response = await api.put(`/product-steps/product/${productId}/reorder`, { steps })
    return response.data
  }
}

export default productStepsService 