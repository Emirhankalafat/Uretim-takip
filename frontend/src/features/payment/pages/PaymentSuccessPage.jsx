import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'

const PaymentSuccessPage = () => {
  const navigate = useNavigate()

  useEffect(() => {
    toast.success('Ödemeniz başarıyla tamamlandı! Premium üyeliğiniz aktif edildi.')
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
          <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Ödeme Başarılı!</h2>
        <p className="text-gray-600 mb-6">
          Premium üyeliğiniz başarıyla aktif edildi. Artık tüm premium özelliklerden yararlanabilirsiniz.
        </p>
        
        <div className="space-y-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            Dashboard'a Git
          </button>
          
          <button
            onClick={() => navigate('/payment')}
            className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
          >
            Ödeme Sayfasına Dön
          </button>
        </div>
        
        <div className="mt-6 text-sm text-gray-500">
          <p>Premium üyeliğiniz 1 ay boyunca geçerlidir.</p>
        </div>
      </div>
    </div>
  )
}

export default PaymentSuccessPage 