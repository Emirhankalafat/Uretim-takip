import axios from 'axios'
import csrfTokenManager from '../utils/csrfToken'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

// Performance ve Cache sistemi
const apiCache = new Map()
const performanceMetrics = {
  slowCalls: [],
  addSlowCall(url, duration, status) {
    if (duration > 1000) {
      this.slowCalls.push({
        url,
        duration: Math.round(duration),
        status,
        timestamp: new Date().toISOString()
      })
      
      // Son 50 yavaş çağrıyı tut
      if (this.slowCalls.length > 50) {
        this.slowCalls = this.slowCalls.slice(-50)
      }
      
      console.warn(`🐌 Slow API call: ${url} - ${duration.toFixed(2)}ms`)
    }
  }
}

// Cache utilities
const CACHE_DURATION = 5 * 60 * 1000 // 5 dakika
const getCacheKey = (config) => `${config.method}_${config.url}_${JSON.stringify(config.params || {})}`
const isCacheValid = (timestamp) => Date.now() - timestamp < CACHE_DURATION

// Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
})

// Store referansı
let store = null
export const setApiStore = (storeInstance) => {
  store = storeInstance
}

// CSRF token alma
export const fetchCsrfToken = async () => {
  try {
    const isAdminPanel = window.location.pathname.startsWith('/admin')
    const endpoint = isAdminPanel ? '/admin/csrf-token' : '/auth/csrf-token'
    const response = await api.get(endpoint)
    const token = response.data.csrfToken
    
    csrfTokenManager.clearToken()
    csrfTokenManager.setToken(token)
    
    if (import.meta.env.DEV) {
      console.log('[CSRF] Yeni token alındı:', token ? token.substring(0, 16) + '...' : 'YOK')
    }
    
    return token
  } catch (error) {
    if (error.response?.status === 429) {
      console.error('[CSRF] Rate limit aşıldı!')
    } else {
      console.error('[CSRF] Token alma hatası:', error)
    }
    return null
  }
}

// Refresh token sistemi için değişkenler
let isRefreshingToken = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error)
    } else {
      resolve(token)
    }
  })
  
  failedQueue = []
}

// Login'e yönlendirme
const redirectToLogin = () => {
  if (store) {
    store.dispatch({ type: 'auth/logout' })
  }
  
  // Admin panelinde değilse normal login'e yönlendir
  if (!window.location.pathname.startsWith('/admin')) {
    window.location.href = '/login'
  }
}

// CSRF retry flag
let csrfRetrying = false

// Request interceptor
api.interceptors.request.use(
  async (config) => {
    // Performance tracking başlat
    config.startTime = Date.now()
    
    // Cache kontrolü (sadece GET istekleri için)
    if (config.method === 'get') {
      const cacheKey = getCacheKey(config)
      const cached = apiCache.get(cacheKey)
      
      if (cached && isCacheValid(cached.timestamp)) {
        // Cache hit - promise olarak döndür
        return Promise.resolve({
          ...config,
          cached: true,
          data: cached.data
        })
      }
    }
    
    // CSRF token ekleme
    const needsCsrfToken = ['post', 'put', 'delete', 'patch'].includes(config.method?.toLowerCase())
    const isAuthEndpoint = config.url?.includes('/auth/login') || 
                          config.url?.includes('/auth/register') ||
                          config.url?.includes('/auth/refresh-token') ||
                          config.url?.includes('/auth/logout') ||
                          config.url?.includes('/auth/confirm')
    
    // Admin endpoint kontrolü
    const isAdminEndpoint = config.url?.includes('/admin/')
    
    if (isAdminEndpoint && store) {
      const adminToken = store.getState().adminAuth?.token
      if (adminToken) {
        config.headers['Authorization'] = `Bearer ${adminToken}`
      }
    }
    
    if (needsCsrfToken && !isAuthEndpoint) {
      if (csrfTokenManager.hasToken()) {
        const token = csrfTokenManager.getToken()
        config.headers['X-CSRF-Token'] = token
        
        if (import.meta.env.DEV) {
          console.log(`[CSRF] Token eklendi: ${token.substring(0, 16)}... - ${config.method?.toUpperCase()} ${config.url}`)
        }
      } else {
        console.warn('[CSRF] Token bulunamadı, alınmaya çalışılıyor...')
        await fetchCsrfToken()
        
        if (csrfTokenManager.hasToken()) {
          config.headers['X-CSRF-Token'] = csrfTokenManager.getToken()
        }
      }
    }
    
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Performance tracking
    if (response.config.startTime) {
      const duration = Date.now() - response.config.startTime
      performanceMetrics.addSlowCall(response.config.url, duration, response.status)
    }
    
    // Cache kaydet (GET istekleri için)
    if (response.config.method === 'get' && !response.config.cached) {
      const cacheKey = getCacheKey(response.config)
      apiCache.set(cacheKey, {
        data: response.data,
        timestamp: Date.now()
      })
      
      // Cache boyut kontrolü
      if (apiCache.size > 100) {
        const firstKey = apiCache.keys().next().value
        apiCache.delete(firstKey)
      }
    }
    
    // Yeni CSRF token kontrolü
    const newToken = response.headers['x-new-csrf-token']
    if (newToken) {
      csrfTokenManager.setToken(newToken)
      if (import.meta.env.DEV) {
        console.log(`[CSRF] Yeni token response ile geldi: ${newToken.substring(0, 16)}...`)
      }
    }
    
    return response
  },
  async (error) => {
    const originalRequest = error.config
    
    // Performance tracking (hata durumunda da)
    if (originalRequest?.startTime) {
      const duration = Date.now() - originalRequest.startTime
      performanceMetrics.addSlowCall(originalRequest.url, duration, error.response?.status || 0)
    }
    
    // 403 CSRF hatası
    if (error.response?.status === 403 && error.response?.data?.message?.includes('CSRF')) {
      if (csrfRetrying) {
        console.error('[CSRF] 403 sonrası tekrar denendi, sonsuz döngü engellendi!')
        csrfRetrying = false
        return Promise.reject(error)
      }
      
      csrfRetrying = true
      if (import.meta.env.DEV) {
        console.log('[CSRF] 403 hatası, yeni token alınacak ve istek tekrar denenecek...')
      }
      
      try {
        await fetchCsrfToken()
        csrfRetrying = false
        return api(originalRequest)
      } catch (csrfError) {
        csrfRetrying = false
        console.error('[CSRF] Token yenileme hatası:', csrfError)
        return Promise.reject(error)
      }
    }
    
    csrfRetrying = false
    
    // 401 Unauthorized - Refresh token sistemi
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Login endpoint'inde 401 hatası varsa refresh token deneme
      if (originalRequest.url?.includes('/auth/login')) {
        return Promise.reject(error)
      }
      
      // Register endpoint'inde 401 hatası varsa refresh token deneme
      if (originalRequest.url?.includes('/auth/register')) {
        return Promise.reject(error)
      }
      
      // Auth-status endpoint'inde 401 hatası kontrolü
      if (originalRequest.url?.includes('/auth/auth-status')) {
        const publicPaths = [
          '/', '/login', '/register', '/forgot-password',
          '/auth/reset-password', '/reset-password', '/auth/confirm', 
          '/confirm', '/auth/accept-invite', '/auth/invite-success'
        ]
        const currentPath = window.location.pathname
        const isPublicPage = publicPaths.includes(currentPath) || 
                            currentPath.startsWith('/auth/reset-password') ||
                            currentPath.startsWith('/reset-password')
        
        if (isPublicPage) {
          return Promise.reject(error)
        }
      }
      
      if (isRefreshingToken) {
        // Refresh işlemi devam ediyorsa kuyruğa ekle
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        }).catch(err => {
          return Promise.reject(err)
        })
      }
      
      originalRequest._retry = true
      isRefreshingToken = true
      
      try {
        const response = await api.post('/auth/refresh-token')
        const { accessToken } = response.data
        
        processQueue(null, accessToken)
        isRefreshingToken = false
        
        // Orijinal isteği tekrar gönder
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        isRefreshingToken = false
        
        // Refresh token da geçersizse login'e yönlendir
        redirectToLogin()
        return Promise.reject(refreshError)
      }
    }
    
    return Promise.reject(error)
  }
)

// Cache yönetimi
export const clearApiCache = () => {
  apiCache.clear()
  console.log('[API] Cache temizlendi')
}

export const clearCacheByPattern = (pattern) => {
  for (const key of apiCache.keys()) {
    if (key.includes(pattern)) {
      apiCache.delete(key)
    }
  }
  console.log(`[API] Pattern "${pattern}" cache'leri temizlendi`)
}

// Performance metrikleri
export const getPerformanceMetrics = () => ({
  slowCalls: performanceMetrics.slowCalls,
  cacheSize: apiCache.size,
  cacheHitRate: apiCache.size > 0 ? 'Available' : 'No data'
})

export default api