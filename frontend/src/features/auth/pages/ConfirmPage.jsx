import { useEffect, useState, useRef } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import authService from '../services/authService'

const ConfirmPage = () => {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState('loading') // loading, success, error
  const [message, setMessage] = useState('')
  const hasConfirmed = useRef(false) // Duplicate request'leri engellemek için
  
  const token = searchParams.get('token')
  const urlStatus = searchParams.get('status') // Backend'ten gelen status
  const urlMessage = searchParams.get('message') // Backend'ten gelen message

  useEffect(() => {
    // Eğer URL'de status varsa, doğrudan onu kullan (backend redirect'ten geldi)
    if (urlStatus && urlMessage) {
      setStatus(urlStatus)
      setMessage(decodeURIComponent(urlMessage))
      return
    }

    const confirmAccount = async () => {
      if (!token) {
        setStatus('error')
        setMessage('Geçersiz doğrulama linki.')
        return
      }

      // Eğer zaten confirm işlemi yapıldıysa, tekrar yapma
      if (hasConfirmed.current) {
        console.log('Frontend - Confirm already in progress, skipping...')
        return
      }

      hasConfirmed.current = true

      console.log('Frontend - Token from URL:', token)
      console.log('Frontend - Token length:', token?.length)
      console.log('Frontend - Full URL:', window.location.href)

      try {
        await authService.confirmAccount(token)
        setStatus('success')
        setMessage('Hesabınız başarıyla doğrulandı! Artık giriş yapabilirsiniz.')
      } catch (error) {
        console.error('Frontend - Confirm error:', error)
        setStatus('error')
        setMessage(error.response?.data?.message || 'Doğrulama başarısız. Link geçersiz veya süresi dolmuş olabilir.')
        // Hata durumunda tekrar deneme imkanı için reset et
        hasConfirmed.current = false
      }
    }

    confirmAccount()
  }, [token, urlStatus, urlMessage])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-lg">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">
              Hesap Doğrulanıyor
            </h2>
            <p className="text-emerald-100">
              Lütfen bekleyin...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-lg">
            {status === 'success' ? (
              <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">
            {status === 'success' ? 'Doğrulama Başarılı!' : 'Doğrulama Başarısız'}
          </h2>
          <p className="text-emerald-100 mb-8">
            {message}
          </p>
        </div>
        
        <div className="bg-white rounded-2xl p-8 shadow-xl text-center">
          {status === 'success' ? (
            <div className="space-y-4">
              <p className="text-gray-600">
                Hesabınız aktifleştirildi. Artık sisteme giriş yapabilirsiniz.
              </p>
              <Link
                to="/login"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
              >
                Giriş Yap
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-600">
                Doğrulama linki geçersiz veya süresi dolmuş. Yeni bir doğrulama linki için destek ile iletişime geçin.
              </p>
              <Link
                to="/login"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
              >
                Giriş Sayfasına Dön
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ConfirmPage 