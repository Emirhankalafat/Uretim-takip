import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation, useNavigate } from 'react-router-dom'
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
        '/auth/confirm', 
        '/confirm', 
        '/auth/accept-invite', 
        '/auth/invite-success'
      ]
      
      const isPublicPath = publicPaths.includes(location.pathname)
      
      if (isPublicPath) {
        // Public sayfalarda backend'den auth durumunu kontrol et
        dispatch(initializeStart())
        
        try {
          const userData = await authService.initialize()
          
          if (userData && userData.user) {
            // Doğrulama başarılı - Dashboard'a yönlendir
            console.log(`✅ Public sayfa auth başarılı - Dashboard'a yönlendiriliyor`)
            dispatch(initializeSuccess(userData))
            navigate('/dashboard', { replace: true })
          } else {
            // Auth yok - public sayfada kal
            console.log(`🔓 Public sayfa - Auth yok, sayfada kalınıyor: ${location.pathname}`)
            dispatch(initializeSuccess(null))
          }
        } catch (error) {
          // Auth başarısız - public sayfada kal (login hariç)
          console.log(`🔓 Public sayfa auth hatası: ${error.message}`)
          dispatch(initializeSuccess(null))
          
          // Eğer hatanın sebebi unauthorized değilse ve login sayfası değilse login'e yönlendir
          if (error.response?.status !== 401 && location.pathname !== '/login') {
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
          <AppRoutes />
        </AuthInitializer>
      </BrowserRouter>
    </Provider>
  )
}

export default App
