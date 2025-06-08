// notificationService.js (frontend)
import api from '../../../services/api'; // Adjust path if your global api instance is elsewhere

export const notificationApiService = {
  getNotifications: async (page = 1, limit = 10) => {
    const response = await api.get(`/notifications?page=${page}&limit=${limit}`);
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  },

  markAsRead: async (notificationId) => {
    try {
      const response = await api.post(`/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      // CSRF hatası durumunda bir kez daha dene
      if (error.response?.status === 403 && error.response?.data?.message?.includes('CSRF')) {
        console.warn('[Notifications] CSRF hatası, tekrar deneniyor...', notificationId);
        try {
          const response = await api.post(`/notifications/${notificationId}/read`);
          return response.data;
        } catch (retryError) {
          console.error('[Notifications] Retry sonrası hata:', retryError);
          throw retryError;
        }
      }
      throw error;
    }
  },

  markAllAsRead: async () => {
    const response = await api.post('/notifications/read-all');
    return response.data;
  },

  createTestNotification: async (data = {}) => {
    const response = await api.post('/notifications/test', data);
    return response.data;
  },
};
