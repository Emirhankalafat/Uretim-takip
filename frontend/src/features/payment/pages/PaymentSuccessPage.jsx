import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { toast } from 'react-hot-toast'
import api from '../../../services/api'
import { setProfile } from '../../../store/slices/profileSlice'

const PaymentSuccessPage = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const toastShown = useRef(false)

  useEffect(() => {
    if (!toastShown.current) {
      toast.success('🎉 Ödeme başarıyla tamamlandı! Premium üyeliğiniz aktifleştirildi.')
      toastShown.current = true
      
      // Profile bilgilerini yenile (subscription durumu güncellensin)
      const refreshProfile = async () => {
        try {
          const response = await api.get('/auth/dashboard-profile')
          dispatch(setProfile(response.data.profile))
        } catch (error) {
          console.error('Profile refresh failed:', error)
        }
      }
      refreshProfile()
    }
  }, [dispatch])

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
          Tebrikler! Premium üyeliğiniz başarıyla aktifleştirildi. Artık tüm premium özelliklerden yararlanabilirsiniz.
        </p>
        
        <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
          <h3 className="text-sm font-medium text-green-800 mb-2">Premium Özellikler</h3>
          <ul className="text-sm text-green-700 space-y-1">
            <li>✅ Sınırsız proje oluşturma</li>
            <li>✅ Gelişmiş analitik raporlar</li>
            <li>✅ Öncelikli müşteri desteği</li>
            <li>✅ Premium şablonlar</li>
          </ul>
        </div>
        
        <div className="space-y-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            Dashboard'a Git
          </button>
          
          <button
            onClick={() => navigate('/profile')}
            className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
          >
            Profili Görüntüle
          </button>
        </div>
        
        <div className="mt-6 text-sm text-gray-500">
          <p>Fatura bilgileriniz e-posta adresinize gönderilecektir.</p>
        </div>
      </div>
    </div>
  )
}

export default PaymentSuccessPage 