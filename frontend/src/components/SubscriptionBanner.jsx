import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

const SubscriptionBanner = () => {
  const navigate = useNavigate()
  const [isVisible, setIsVisible] = useState(true)
  
  // Kullanıcının şirket profil bilgilerini al
  const profileData = useSelector((state) => state.profile?.data)
  
  // Eğer profil verisi yoksa veya basic değilse gösterme
  if (!profileData?.company_stats || profileData.company_stats.subscription_package !== 'basic' || !isVisible) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-[9999] animate-bounce-slow">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg shadow-lg p-4 max-w-sm">
        <button
          onClick={() => setIsVisible(false)}
          className="absolute -top-2 -right-2 w-6 h-6 bg-gray-600 hover:bg-gray-700 rounded-full flex items-center justify-center text-white text-sm transition-colors"
        >
          ×
        </button>
        
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-xl">🚀</span>
          </div>
          
          <div className="flex-1">
            <h4 className="font-semibold text-sm">Premium'a Geç!</h4>
            <p className="text-xs text-blue-100 mt-1">
              Tüm özelliklerin kilidini aç
            </p>
          </div>
        </div>
        
        <button
          onClick={() => navigate('/payment')}
          className="w-full mt-3 bg-white text-blue-600 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors"
        >
          Hemen Yükselt - ₺99/ay
        </button>
        
        <div className="flex items-center justify-center space-x-2 mt-2 text-xs text-blue-200">
          <span>✨ Sınırsız</span>
          <span>•</span>
          <span>📊 Analitik</span>
          <span>•</span>
          <span>🎯 Destek</span>
        </div>
      </div>
    </div>
  )
}

export default SubscriptionBanner 