import axios from 'axios'
import csrfTokenManager from '../utils/csrfToken'

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

// CSRF token almak için fonksiyon
export const fetchCsrfToken = async () => {
  try {
    const response = await api.get('/auth/csrf-token')
    const token = response.data.csrfToken
    csrfTokenManager.setToken(token)
    return token
  } catch (error) {
    console.error('CSRF token alma hatası:', error)
    return null
  }
}

// Request interceptor - CSRF token'ı header'a ekle
api.interceptors.request.use(
  (config) => {
    // POST, PUT, DELETE request'lerde CSRF token ekle
    const needsCsrfToken = ['post', 'put', 'delete', 'patch'].includes(config.method?.toLowerCase())
    
    // Auth endpoint'leri CSRF token'dan muaf
    const isAuthEndpoint = config.url?.includes('/auth/login') || 
                          config.url?.includes('/auth/register') ||
                          config.url?.includes('/auth/refresh-token') ||
                          config.url?.includes('/auth/logout') ||
                          config.url?.includes('/auth/confirm')
    
    if (needsCsrfToken && !isAuthEndpoint && csrfTokenManager.hasToken()) {
      config.headers['X-CSRF-Token'] = csrfTokenManager.getToken()
    }
    
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

// Response interceptor - Refresh token sistemi ve CSRF token güncelleme
api.interceptors.response.use(
  (response) => {
    // Response'dan yeni CSRF token'ı al ve güncelle
    csrfTokenManager.updateFromResponse(response);
    return response;
  },
  async (error) => {
    const originalRequest = error.config

    // 403 hatası CSRF token sorunu olabilir
    if (error.response?.status === 403 && error.response?.data?.message?.includes('CSRF')) {
      console.log('🔒 CSRF token hatası, yeni token alınıyor...');
      
      try {
        // Yeni CSRF token al
        await fetchCsrfToken();
        
        // Orijinal isteği tekrar dene
        return api(originalRequest);
      } catch (csrfError) {
        console.error('CSRF token yenileme hatası:', csrfError);
        return Promise.reject(error);
      }
    }

    // 401 hatası ve henüz refresh token denenmemişse
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Login endpoint'inde 401 hatası varsa refresh token deneme (yanlış şifre vs.)
      if (originalRequest.url?.includes('/auth/login')) {
        return Promise.reject(error)
      }

      // Register endpoint'inde 401 hatası varsa refresh token deneme
      if (originalRequest.url?.includes('/auth/register')) {
        return Promise.reject(error)
      }

      // Eğer refresh token endpoint'inde hata varsa direkt logout yap
      if (originalRequest.url?.includes('/refresh-token')) {
        if (store) {
          store.dispatch({ type: 'auth/logout' })
        }
        csrfTokenManager.clearToken(); // CSRF token'ı da temizle
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
        const refreshResponse = await api.post('/auth/refresh-token')
        
        // Refresh response'dan CSRF token'ı al
        if (refreshResponse.data.csrfToken) {
          csrfTokenManager.setToken(refreshResponse.data.csrfToken);
        }
        
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
        csrfTokenManager.clearToken(); // CSRF token'ı da temizle
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