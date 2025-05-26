import api from '../../../services/api'

export const userService = {
  getAllUsers: async () => {
    const response = await api.get('/permissions/company-users')
    return response.data
  },

  getUserById: async (id) => {
    const response = await api.get(`/users/${id}`)
    return response.data
  },

  createUser: async (userData) => {
    const response = await api.post('/users', userData)
    return response.data
  },

  updateUser: async (id, userData) => {
    const response = await api.put(`/users/${id}`, userData)
    return response.data
  },

  deleteUser: async (id) => {
    const response = await api.delete(`/users/${id}`)
    return response.data
  },

  updateUserPermissions: async (id, permissions) => {
    const response = await api.put(`/users/${id}/permissions`, { permissions })
    return response.data
  },

  // Şirket kullanıcılarını getir
  getCompanyUsers: async () => {
    const response = await api.get('/user/company-users')
    return response.data
  },

  // Davetleri getir
  getInvites: async () => {
    const response = await api.get('/user/invites')
    return response.data
  },

  // Kullanıcı davet et
  inviteUser: async (email) => {
    const response = await api.post('/user/invite', { email })
    return response.data
  },
}

export default userService 