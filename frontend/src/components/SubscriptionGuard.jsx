import { useSelector } from 'react-redux'
import { cloneElement } from 'react'
import toast from 'react-hot-toast'

const SubscriptionGuard = ({ children, requiresActiveSubscription = false, actionName = 'Bu işlem', tooltipPosition = 'center', showTooltip = true }) => {
  const { user } = useSelector((state) => state.auth)

  // Kullanıcının şirket profil bilgilerini al (dashboard'dan cache'lenmiş olabilir)
  const profileData = useSelector((state) => state.profile?.data)
  
  // Eğer subscription kontrolü gerekmiyorsa doğrudan render et
  if (!requiresActiveSubscription) {
    return children
  }

  // Eğer kullanıcı login olmuş ama profil verisi henüz yüklenmemişse, güvenli tarafta kal (restricted mode)
  if (user && !profileData?.company_stats) {
    // Profile loading... butonları gri göster
    const handleLoadingClick = (e) => {
      e.preventDefault()
      e.stopPropagation()
      
      toast.error(
        'Profil bilgileri yükleniyor, lütfen bekleyin...',
        {
          duration: 2000,
          icon: '⏳',
          id: 'profile-loading',
        }
      )
    }

    return (
      <div className="relative inline-block">
        <div className="group">
          {cloneElement(children, {
            className: `${children.props.className || ''} opacity-40 cursor-not-allowed grayscale`.trim(),
            onClick: handleLoadingClick,
            disabled: true,
            style: {
              ...children.props.style,
              pointerEvents: 'auto',
            }
          })}
          
          {showTooltip && (
            <div className="invisible group-hover:visible absolute bottom-full mb-2 px-3 py-2 text-sm text-white bg-gray-800 rounded-lg shadow-lg whitespace-nowrap z-[9998] left-1/2 transform -translate-x-1/2">
              ⏳ Profil yükleniyor...
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
            </div>
          )}
        </div>
      </div>
    )
  }

  const subscriptionPackage = profileData.company_stats.subscription_package

  // Basic kullanıcılar için butonları gri yap ve tooltip ekle
  if (subscriptionPackage === 'basic') {
    const handleRestrictedClick = (e) => {
      e.preventDefault()
      e.stopPropagation()
      
      toast.error(
        `${actionName} için premium veya trial üyelik gereklidir.`,
        {
          duration: 3000,
          icon: '🔒',
          id: 'subscription-restriction',
        }
      )
    }

    // Children'ı clone edip disabled state ve tooltip ekle
    return (
      <div className="relative inline-block">
        <div className="group">
          {cloneElement(children, {
            className: `${children.props.className || ''} opacity-40 cursor-not-allowed grayscale`.trim(),
            onClick: handleRestrictedClick,
            disabled: true,
            style: {
              ...children.props.style,
              pointerEvents: 'auto',
            }
          })}
          
          {/* Tooltip */}
          {showTooltip && (
            <div className={`invisible group-hover:visible absolute bottom-full mb-2 px-3 py-2 text-sm text-white bg-gray-800 rounded-lg shadow-lg whitespace-nowrap z-[9998] ${
              tooltipPosition === 'left' ? 'right-0' : 
              tooltipPosition === 'right' ? 'left-0' : 
              'left-1/2 transform -translate-x-1/2'
            }`}>
              🔒 Premium gereklidir
              <div className={`absolute top-full border-4 border-transparent border-t-gray-800 ${
                tooltipPosition === 'left' ? 'right-2' : 
                tooltipPosition === 'right' ? 'left-2' : 
                'left-1/2 transform -translate-x-1/2'
              }`}></div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Trial ve premium kullanıcılar normal şekilde kullanabilir
  return children
}

export default SubscriptionGuard 