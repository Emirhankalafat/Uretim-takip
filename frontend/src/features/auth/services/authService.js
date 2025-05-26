import api from '../../../services/api'

export const authService = {
  // App başlangıcında kullanıcının giriş durumunu kontrol et
  initialize: async () => {
    try {
      const response = await api.get('/auth/profile')
      return response.data
    } catch (error) {
      // Cookie geçersiz veya yok
      return null
    }
  },

  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials)
    return response.data
  },

  register: async (userData) => {
    const response = await api.post('/auth/register', userData)
    return response.data
  },

  getProfile: async () => {
    const response = await api.get('/auth/profile')
    return response.data
  },

  logout: async () => {
    const response = await api.post('/auth/logout')
    return response.data
  },

  getPermissions: async () => {
    const response = await api.get('/permissions/my-permissions')
    return response.data
  },

  // Hesap doğrulama
  confirmAccount: async (token) => {
    const response = await api.get(`/auth/confirm?token=${token}`)
    return response.data
  },

  // Davet kontrolü
  checkInvite: async (token) => {
    const response = await api.get(`/user/check-invite?token=${token}`)
    return response.data
  },

  // Daveti kabul et
  acceptInvite: async (data) => {
    const response = await api.post('/user/accept-invite', data)
    return response.data
  },
}

export default authService 