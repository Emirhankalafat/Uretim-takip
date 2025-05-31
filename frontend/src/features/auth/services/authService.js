import api from '../../../services/api'
import csrfTokenManager from '../../../utils/csrfToken'

export const authService = {
  // App başlangıcında kullanıcının giriş durumunu kontrol et
  initialize: async () => {
    try {
      const response = await api.get('/auth/auth-status')
      
      // Eğer kullanıcı giriş yapmışsa CSRF token al
      if (response.data.user && !csrfTokenManager.hasToken()) {
        await api.get('/auth/csrf-token').then(csrfResponse => {
          if (csrfResponse.data.csrfToken) {
            csrfTokenManager.setToken(csrfResponse.data.csrfToken);
          }
        }).catch(error => {
          console.warn('CSRF token alınamadı:', error);
        });
      }
      
      return response.data
    } catch (error) {
      // Cookie geçersiz veya yok
      csrfTokenManager.clearToken();
      return null
    }
  },

  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials)
    
    // Login response'dan CSRF token'ı al
    if (response.data.csrfToken) {
      csrfTokenManager.setToken(response.data.csrfToken);
    }
    
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
    
    // Logout sonrası CSRF token'ı temizle
    csrfTokenManager.clearToken();
    
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

  // CSRF token al
  getCsrfToken: async () => {
    const response = await api.get('/auth/csrf-token')
    if (response.data.csrfToken) {
      csrfTokenManager.setToken(response.data.csrfToken);
    }
    return response.data
  },

  // Şifre sıfırlama talebi
  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email })
    return response.data
  },

  // Reset token doğrulama
  verifyResetToken: async (token) => {
    const response = await api.get(`/auth/verify-reset-token?token=${token}`)
    return response.data
  },

  // Şifre sıfırlama
  resetPassword: async (token, newPassword) => {
    const response = await api.post('/auth/reset-password', { 
      token, 
      newPassword 
    })
    return response.data
  },
}

export default authService 