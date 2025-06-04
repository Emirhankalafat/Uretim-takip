import axios from 'axios'
import csrfTokenManager from '../utils/csrfToken'

const API_BASE_URL = import.meta.env.VITE_API_URL

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
    csrfTokenManager.clearToken(); // Önce eski tokenı sil
    csrfTokenManager.setToken(token)
    console.log('[CSRF] Yeni token alındı:', token ? token.substring(0, 16) + '...' : 'YOK')
    return token
  } catch (error) {
    if (error.response?.status === 429) {
      console.error('[CSRF] Rate limit aşıldı! /auth/csrf-token endpointine çok fazla istek atıldı.')
    } else {
      console.error('[CSRF] CSRF token alma hatası:', error)
    }
    return null
  }
}

// CSRF işlemleri için istek kuyruğu
let csrfQueue = Promise.resolve();

// Request interceptor - CSRF token'ı header'a ekle
api.interceptors.request.use(
  async (config) => {
    const needsCsrfToken = ['post', 'put', 'delete', 'patch'].includes(config.method?.toLowerCase())
    const isAuthEndpoint = config.url?.includes('/auth/login') || 
                          config.url?.includes('/auth/register') ||
                          config.url?.includes('/auth/refresh-token') ||
                          config.url?.includes('/auth/logout') ||
                          config.url?.includes('/auth/confirm')
    if (needsCsrfToken && !isAuthEndpoint) {
      // Kuyruğa ekle, sırayla token kullan
      await (csrfQueue = csrfQueue.then(async () => {
        if (csrfTokenManager.hasToken()) {
          const token = csrfTokenManager.getToken()
          config.headers['X-CSRF-Token'] = token
          csrfTokenManager.clearToken();
          if (import.meta.env.DEV) {
            console.log(`[CSRF] Token gönderildi: ${token ? token.substring(0, 16) + '...' : 'YOK'} -> ${config.method?.toUpperCase()} ${config.url}`)
          }
        } else {
          if (import.meta.env.DEV) {
            console.warn('[CSRF] Token yok, istek gönderiliyor!')
          }
        }
      }))
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

// 403 sonrası sonsuz döngüyü engellemek için flag
let csrfRetrying = false;

// Response interceptor - Refresh token sistemi ve CSRF token güncelleme
api.interceptors.response.use(
  (response) => {
    const newToken = response.headers['x-new-csrf-token'];
    if (newToken) {
      csrfTokenManager.clearToken();
      csrfTokenManager.setToken(newToken);
      if (import.meta.env.DEV) {
        console.log(`[CSRF] Yeni token response ile geldi: ${newToken.substring(0, 16)}...`)
      }
    } else {
      csrfTokenManager.updateFromResponse(response);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config
    // 403 hatası CSRF token sorunu olabilir
    if (error.response?.status === 403 && error.response?.data?.message?.includes('CSRF')) {
      if (csrfRetrying) {
        console.error('[CSRF] 403 sonrası tekrar denendi, sonsuz döngü engellendi!')
        csrfRetrying = false;
        return Promise.reject(error);
      }
      csrfRetrying = true;
      if (import.meta.env.DEV) {
        console.log('[CSRF] 403 hatası, yeni token alınacak ve istek tekrar denenecek...');
      }
      try {
        await fetchCsrfToken();
        csrfRetrying = false;
        return api(originalRequest);
      } catch (csrfError) {
        csrfRetrying = false;
        console.error('[CSRF] Token yenileme hatası:', csrfError);
        return Promise.reject(error);
      }
    }
    csrfRetrying = false;
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

      // Auth-status endpoint'inde 401 hatası varsa özel kontrol
      if (originalRequest.url?.includes('/auth/auth-status')) {
        // Public sayfalarda auth-status 401 hatası normaldir, refresh token deneme
        const publicPaths = [
          '/', 
          '/login', 
          '/register', 
          '/forgot-password',
          '/auth/reset-password',
          '/reset-password',
          '/auth/confirm', 
          '/confirm', 
          '/auth/accept-invite', 
          '/auth/invite-success'
        ]
        const currentPath = window.location.pathname
        const isPublicPage = publicPaths.includes(currentPath) || 
                            currentPath.startsWith('/auth/reset-password') ||
                            currentPath.startsWith('/reset-password')
        
        if (isPublicPage) {
          console.log(`🔓 Public sayfada auth-status 401 hatası: ${currentPath} - Refresh token denenmeyecek`)
          return Promise.reject(error)
        }
        
        // Initialize edilmemişse de refresh token deneme
        if (store && !store.getState().auth.initialized) {
          console.log('🔓 App henüz initialize edilmemiş, auth-status 401 hatası normal - Refresh token denenmeyecek')
          return Promise.reject(error)
        }
      }

      // Confirm endpoint'inde 401 hatası varsa refresh token deneme (hesap doğrulama için normal)
      if (originalRequest.url?.includes('/auth/confirm')) {
        return Promise.reject(error)
      }

      // Public sayfalarda herhangi bir 401 hatası varsa refresh token deneme
      const publicPaths = [
        '/', 
        '/login', 
        '/register', 
        '/forgot-password',
        '/auth/reset-password',
        '/reset-password',
        '/auth/confirm', 
        '/confirm', 
        '/auth/accept-invite', 
        '/auth/invite-success'
      ]
      const currentPath = window.location.pathname
      const isPublicPage = publicPaths.includes(currentPath) || 
                          currentPath.startsWith('/auth/reset-password') ||
                          currentPath.startsWith('/reset-password')
      
      if (isPublicPage) {
        console.log(`🔓 Public sayfada 401 hatası: ${currentPath} - Refresh token denenmeyecek`)
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
  // Public sayfalar listesi
  const publicPaths = [
    '/', 
    '/login', 
    '/register', 
    '/forgot-password',
    '/auth/reset-password',
    '/reset-password',
    '/auth/confirm', 
    '/confirm', 
    '/auth/accept-invite', 
    '/auth/invite-success'
  ]
  const currentPath = window.location.pathname
  const isPublicPage = publicPaths.includes(currentPath) || 
                      currentPath.startsWith('/auth/reset-password') ||
                      currentPath.startsWith('/reset-password')
  
  // Public sayfalarda redirect yapma
  if (isPublicPage) {
    console.log(`🔓 Public sayfada redirect yapılmıyor: ${currentPath}`)
    return
  }
  
  // Sadece login sayfasında değilsek yönlendir
  if (!window.location.pathname.includes('/login')) {
    console.log(`🔒 Protected sayfadan login'e yönlendiriliyor: ${currentPath}`)
    // React Router'ı kullanarak yönlendir
    window.history.replaceState({}, '', '/login')
    // Popstate event'i tetikle ki React Router algılasın
    window.dispatchEvent(new PopStateEvent('popstate'))
  }
}

export default api 