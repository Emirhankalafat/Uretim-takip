import api from '../../../services/api'

const productService = {
  // Ürünleri listeleme
  getProducts: async (params = {}) => {
    const response = await api.get('/products', { params })
    return response.data
  },

  // Tek ürün getirme
  getProductById: async (id) => {
    const response = await api.get(`/products/${id}`)
    return response.data
  },

  // Kategoriye göre ürünleri getirme
  getProductsByCategory: async (categoryId) => {
    const response = await api.get(`/products/category/${categoryId}`)
    return response.data
  },

  // Ürün oluşturma
  createProduct: async (productData) => {
    const response = await api.post('/products', productData)
    return response.data
  },

  // Ürün güncelleme
  updateProduct: async (id, productData) => {
    const response = await api.put(`/products/${id}`, productData)
    return response.data
  },

  // Ürün silme
  deleteProduct: async (id) => {
    const response = await api.delete(`/products/${id}`)
    return response.data
  }
}

export default productService 