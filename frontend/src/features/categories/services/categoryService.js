import api from '../../../services/api'

const categoryService = {
  // Kategorileri listeleme
  getCategories: async () => {
    const response = await api.get('/categories')
    return response.data
  },

  // Tek kategori getirme
  getCategoryById: async (id) => {
    const response = await api.get(`/categories/${id}`)
    return response.data
  },

  // Kategori oluşturma
  createCategory: async (categoryData) => {
    const response = await api.post('/categories', categoryData)
    return response.data
  },

  // Kategori güncelleme
  updateCategory: async (id, categoryData) => {
    const response = await api.put(`/categories/${id}`, categoryData)
    return response.data
  },

  // Kategori silme
  deleteCategory: async (id) => {
    const response = await api.delete(`/categories/${id}`)
    return response.data
  }
}

export default categoryService 