import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation, useNavigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { store } from './store'
import AppRoutes from './routes/AppRoutes'
import authService from './features/auth/services/authService'
import { initializeStart, initializeSuccess, initializeFailure } from './features/auth/authSlice'
import { setApiStore } from './services/api'

// Store'u API'ye set et
setApiStore(store)

// Auth Initialize Component
const AuthInitializer = ({ children }) => {
  const dispatch = useDispatch()
  const location = useLocation()
  const navigate = useNavigate()
  const { initialized, loading } = useSelector((state) => state.auth)

  useEffect(() => {
    const initializeAuth = async () => {
      // Public sayfalar listesi
      const publicPaths = [
        '/', 
        '/login', 
        '/register', 
        '/forgot-password',
        '/auth/reset-password',
        '/reset-password', // Alternative path
        '/auth/confirm', 
        '/confirm', 
        '/auth/accept-invite', 
        '/auth/invite-success'
      ]
      
      // Query parameter'lı path'ler için kontrol
      const currentPath = location.pathname
      const isPublicPath = publicPaths.includes(currentPath) || 
                          currentPath.startsWith('/auth/reset-password') ||
                          currentPath.startsWith('/reset-password')
      
      if (isPublicPath) {
        // Public sayfalarda backend'den auth durumunu kontrol et
        dispatch(initializeStart())
        
        try {
          const userData = await authService.initialize()
          
          if (userData && userData.user) {
            // Login olmuş kullanıcılar tüm public sayfalarda dashboard'a yönlendirilir
            console.log(`✅ Login olmuş kullanıcı public sayfada - Dashboard'a yönlendiriliyor: ${currentPath}`)
            dispatch(initializeSuccess(userData))
            navigate('/dashboard', { replace: true })
          } else {
            // Auth yok - public sayfada kal
            console.log(`🔓 Public sayfa - Auth yok, sayfada kalınıyor: ${currentPath}`)
            dispatch(initializeSuccess(null))
          }
        } catch (error) {
          // Auth başarısız - public sayfada kal
          console.log(`🔓 Public sayfa auth hatası: ${error.message}`)
          dispatch(initializeSuccess(null))
          
          // Public sayfalarda herhangi bir yönlendirme yapma
          // Sadece ciddi server hataları için login'e yönlendir
          if (error.response?.status >= 500) {
            console.log(`🚨 Sunucu hatası nedeniyle login'e yönlendiriliyor`)
            navigate('/login', { replace: true })
          }
        }
        
        return
      }

      // Protected sayfalarda normal auth kontrolü yap
      console.log(`🔒 Protected sayfa: ${location.pathname} - Auth kontrolü yapılıyor`)
      dispatch(initializeStart())
      try {
        const userData = await authService.initialize()
        dispatch(initializeSuccess(userData))
      } catch (error) {
        console.log('❌ Protected sayfa auth başarısız, kullanıcı giriş yapmamış')
        dispatch(initializeFailure())
      }
    }

    if (!initialized) {
      initializeAuth()
    }
  }, [dispatch, initialized, location.pathname, navigate])

  // Auth initialize edilene kadar loading göster
  if (!initialized && loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  return children
}

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <AuthInitializer>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                style: {
                  background: '#10B981',
                },
              },
              error: {
                style: {
                  background: '#EF4444',
                },
              },
            }}
          />
          <AppRoutes />
        </AuthInitializer>
      </BrowserRouter>
    </Provider>
  )
}

export default App
