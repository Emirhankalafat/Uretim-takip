import axios from 'axios'

const API_BASE_URL = 'http://localhost:3001/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Cookie'leri gönder
})

// Store referansı için
let store = null

// Store'u set etmek için fonksiyon
export const setApiStore = (storeInstance) => {
  store = storeInstance
}

// Request interceptor - Cookie kullandığımız için token header'ına gerek yok
api.interceptors.request.use(
  (config) => {
    // Cookie otomatik olarak gönderilecek
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Refresh token için flag
let isRefreshingToken = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  
  failedQueue = []
}

// Response interceptor - Refresh token sistemi ile
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // 401 hatası ve henüz refresh token denenmemişse
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Eğer refresh token endpoint'inde hata varsa direkt logout yap
      if (originalRequest.url?.includes('/refresh-token')) {
        if (store) {
          store.dispatch({ type: 'auth/logout' })
        }
        redirectToLogin()
        return Promise.reject(error)
      }

      if (isRefreshingToken) {
        // Eğer refresh işlemi devam ediyorsa, bu isteği kuyruğa ekle
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(() => {
          return api(originalRequest)
        }).catch(err => {
          return Promise.reject(err)
        })
      }

      originalRequest._retry = true
      isRefreshingToken = true

      try {
        // Refresh token isteği
        await api.post('/auth/refresh-token')
        
        isRefreshingToken = false
        processQueue(null)
        
        // Orijinal isteği tekrar dene
        return api(originalRequest)
      } catch (refreshError) {
        isRefreshingToken = false
        processQueue(refreshError)
        
        // Refresh token da başarısızsa logout yap
        if (store) {
          store.dispatch({ type: 'auth/logout' })
        }
        redirectToLogin()
        
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

const redirectToLogin = () => {
  // Sadece login sayfasında değilsek yönlendir
  if (!window.location.pathname.includes('/login')) {
    // React Router'ı kullanarak yönlendir
    window.history.replaceState({}, '', '/login')
    // Popstate event'i tetikle ki React Router algılasın
    window.dispatchEvent(new PopStateEvent('popstate'))
  }
}

export default api 