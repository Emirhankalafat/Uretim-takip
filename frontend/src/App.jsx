import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
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
  const { initialized, loading } = useSelector((state) => state.auth)

  useEffect(() => {
    const initializeAuth = async () => {
      dispatch(initializeStart())
      try {
        const userData = await authService.initialize()
        dispatch(initializeSuccess(userData))
      } catch (error) {
        dispatch(initializeFailure())
      }
    }

    if (!initialized) {
      initializeAuth()
    }
  }, [dispatch, initialized])

  // Auth initialize edilene kadar loading göster (tüm sayfalarda)
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
