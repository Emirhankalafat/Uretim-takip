import api from '../../../services/api'

const customerService = {
  // Müşterileri listeleme
  getCustomers: async (params = {}) => {
    const response = await api.get('/customers', { params })
    return response.data
  },

  // Tek müşteri getirme
  getCustomerById: async (id) => {
    const response = await api.get(`/customers/${id}`)
    return response.data
  },

  // Müşteri oluşturma
  createCustomer: async (customerData) => {
    const response = await api.post('/customers', customerData)
    return response.data
  },

  // Müşteri güncelleme
  updateCustomer: async (id, customerData) => {
    const response = await api.put(`/customers/${id}`, customerData)
    return response.data
  },

  // Müşteri silme
  deleteCustomer: async (id) => {
    const response = await api.delete(`/customers/${id}`)
    return response.data
  }
}

export default customerService 