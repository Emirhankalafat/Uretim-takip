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

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Store varsa logout action'ını dispatch et
      if (store) {
        store.dispatch({ type: 'auth/logout' })
      }
      
      // Sadece login sayfasında değilsek yönlendir
      if (!window.location.pathname.includes('/login')) {
        // React Router'ı kullanarak yönlendir
        window.history.replaceState({}, '', '/login')
        // Popstate event'i tetikle ki React Router algılasın
        window.dispatchEvent(new PopStateEvent('popstate'))
      }
    }
    return Promise.reject(error)
  }
)

export default api 