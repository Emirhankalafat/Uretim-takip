import { useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'react-hot-toast'

const PaymentFailPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const toastShown = useRef(false)

  // URL'den errorMessage parametresini al
  const params = new URLSearchParams(location.search)
  const errorMessage = params.get('errorMessage')

  useEffect(() => {
    if (!toastShown.current) {
      toast.error(errorMessage ? `Ödeme başarısız: ${errorMessage}` : 'Ödeme işlemi başarısız oldu. Lütfen tekrar deneyiniz.')
      toastShown.current = true
    }
  }, [errorMessage])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
          <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Ödeme Başarısız</h2>
        <p className="text-gray-600 mb-6">
          {errorMessage
            ? <>Ödeme işleminiz tamamlanamadı.<br /><b>Hata:</b> {errorMessage}</>
            : 'Ödeme işleminiz tamamlanamadı. Lütfen kart bilgilerinizi kontrol edip tekrar deneyiniz.'}
        </p>
        
        <div className="space-y-3">
          <button
            onClick={() => navigate('/payment')}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            Tekrar Dene
          </button>
          
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
          >
            Dashboard'a Git
          </button>
        </div>
        
        <div className="mt-6 text-sm text-gray-500">
          <p>Sorun devam ederse lütfen destek ekibimizle iletişime geçin.</p>
        </div>
      </div>
    </div>
  )
}

export default PaymentFailPage 