import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import paymentService from '../services/paymentService'

const PaymentPage = () => {
  const { user } = useSelector((state) => state.auth)
  
  // SuperAdmin kontrolü
  if (!user?.is_SuperAdmin) {
    return <Navigate to="/dashboard" replace />
  }
  
  const [loading, setLoading] = useState(false)
  const [cardData, setCardData] = useState({
    cardHolderName: '',
    cardNumber: '',
    expireMonth: '',
    expireYear: '',
    cvc: '',
    registerCard: false,
    // Billing Address
    billingContactName: '',
    billingCity: '',
    billingCountry: 'Turkey',
    billingAddress: ''
  })
  const [hasRegisteredCard, setHasRegisteredCard] = useState(false)
  const [userCards, setUserCards] = useState([])

  // Sayfa yüklendiğinde kullanıcının kartlarını kontrol et
  useEffect(() => {
    const checkUserCards = async () => {
      try {
        const cardCheckResponse = await paymentService.checkUserCard(user.id)
        setHasRegisteredCard(!!cardCheckResponse.cardUserKey)
        
        const cardsResponse = await paymentService.getUserCards(user.id)
        setUserCards(cardsResponse.cards || [])
      } catch (error) {
        console.error('Kart kontrolü hatası:', error)
      }
    }

    if (user?.id) {
      checkUserCards()
    }
  }, [user?.id])

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    
    // Kart numarası formatla
    if (name === 'cardNumber') {
      const formattedValue = value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim()
      if (formattedValue.replace(/\s/g, '').length <= 16) {
        setCardData(prev => ({ ...prev, [name]: formattedValue }))
      }
      return
    }
    
    // CVC maksimum 3 karakter
    if (name === 'cvc' && value.length > 3) {
      return
    }
    
    setCardData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!user?.is_SuperAdmin) {
      toast.error('Yalnızca süper admin kullanıcılar ödeme yapabilir!')
      return
    }

    setLoading(true)
    
    try {
      // Form submit yöntemi ile aynı sayfada İyzico'ya git
      const form = document.createElement('form')
      form.method = 'POST'
      form.action = `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/payment/3dsecure`
      form.target = '_self' // Aynı sayfada aç
      
      // Form verilerini ekle
      const formData = {
        cardHolderName: cardData.cardHolderName,
        cardNumber: cardData.cardNumber.replace(/\s/g, ''),
        expireMonth: cardData.expireMonth,
        expireYear: cardData.expireYear,
        cvc: cardData.cvc,
        registerCard: cardData.registerCard,
        billingContactName: cardData.billingContactName,
        billingCity: cardData.billingCity,
        billingCountry: cardData.billingCountry,
        billingAddress: cardData.billingAddress
      }

      // Form inputları oluştur
      for (const [key, value] of Object.entries(formData)) {
        const input = document.createElement('input')
        input.type = 'hidden'
        input.name = key
        input.value = value
        form.appendChild(input)
      }

      // JWT token'ı Authorization header yerine form data olarak gönder
      const accessToken = localStorage.getItem('accessToken')
      if (accessToken) {
        const tokenInput = document.createElement('input')
        tokenInput.type = 'hidden'
        tokenInput.name = 'authorization'
        tokenInput.value = `Bearer ${accessToken}`
        form.appendChild(tokenInput)
      }

      // Formu sayfaya ekle ve submit et
      document.body.appendChild(form)
      
      toast.success('3D Secure doğrulamasına yönlendiriliyorsunuz...')
      
      // Küçük bir delay ile submit et ki toast görünsün
      setTimeout(() => {
        form.submit()
      }, 500)
      
    } catch (error) {
      console.error('Ödeme hatası:', error)
      toast.error('Ödeme başlatılamadı')
      setLoading(false)
    }
  }

  const generateYears = () => {
    const currentYear = new Date().getFullYear()
    const years = []
    for (let i = 0; i <= 20; i++) {
      years.push(currentYear + i)
    }
    return years
  }

  const generateMonths = () => {
    return Array.from({ length: 12 }, (_, i) => {
      const month = i + 1
      return month.toString().padStart(2, '0')
    })
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Premium Üyelik Ödemesi</h1>
        
        {!user?.is_SuperAdmin && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Yetki Hatası</h3>
                <p className="mt-1 text-sm text-red-700">
                  Yalnızca süper admin kullanıcılar ödeme yapabilir.
                </p>
              </div>
            </div>
          </div>
        )}

        {hasRegisteredCard && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Kayıtlı Kart Bulundu</h3>
                <p className="mt-1 text-sm text-green-700">
                  Daha önce kaydettiğiniz kart bilgileri kullanılacak.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Ödeme Bilgileri</h3>
          <div className="bg-gray-50 rounded-md p-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Premium Üyelik (1 Ay)</span>
              <span className="text-xl font-bold text-gray-900">₺99,90</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="cardHolderName" className="block text-sm font-medium text-gray-700">
              Kart Üzerindeki İsim
            </label>
            <input
              type="text"
              id="cardHolderName"
              name="cardHolderName"
              value={cardData.cardHolderName}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Örn: Emirhan Kalafat"
            />
          </div>

          <div>
            <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700">
              Kart Numarası
            </label>
            <input
              type="text"
              id="cardNumber"
              name="cardNumber"
              value={cardData.cardNumber}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="0000 0000 0000 0000"
              maxLength="19"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="expireMonth" className="block text-sm font-medium text-gray-700">
                Ay
              </label>
              <select
                id="expireMonth"
                name="expireMonth"
                value={cardData.expireMonth}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Ay</option>
                {generateMonths().map(month => (
                  <option key={month} value={month}>{month}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="expireYear" className="block text-sm font-medium text-gray-700">
                Yıl
              </label>
              <select
                id="expireYear"
                name="expireYear"
                value={cardData.expireYear}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Yıl</option>
                {generateYears().map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="cvc" className="block text-sm font-medium text-gray-700">
                CVC
              </label>
              <input
                type="text"
                id="cvc"
                name="cvc"
                value={cardData.cvc}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="000"
                maxLength="3"
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              id="registerCard"
              name="registerCard"
              type="checkbox"
              checked={cardData.registerCard}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="registerCard" className="ml-2 block text-sm text-gray-900">
              Kartımı kaydet (gelecek ödemeler için)
            </label>
          </div>

          {/* Billing Address Section */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Fatura Adresi</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="billingContactName" className="block text-sm font-medium text-gray-700">
                  İsim Soyisim
                </label>
                <input
                  type="text"
                  id="billingContactName"
                  name="billingContactName"
                  value={cardData.billingContactName}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Emirhan Kalafat"
                />
              </div>

              <div>
                <label htmlFor="billingCity" className="block text-sm font-medium text-gray-700">
                  Şehir
                </label>
                <input
                  type="text"
                  id="billingCity"
                  name="billingCity"
                  value={cardData.billingCity}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="İstanbul"
                />
              </div>

              <div>
                <label htmlFor="billingCountry" className="block text-sm font-medium text-gray-700">
                  Ülke
                </label>
                <select
                  id="billingCountry"
                  name="billingCountry"
                  value={cardData.billingCountry}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Turkey">Türkiye</option>
                  <option value="Cyprus">Kıbrıs</option>
                  <option value="Germany">Almanya</option>
                  <option value="Netherlands">Hollanda</option>
                  <option value="France">Fransa</option>
                  <option value="United Kingdom">İngiltere</option>
                  <option value="United States">Amerika</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="billingAddress" className="block text-sm font-medium text-gray-700">
                  Adres
                </label>
                <textarea
                  id="billingAddress"
                  name="billingAddress"
                  value={cardData.billingAddress}
                  onChange={handleInputChange}
                  required
                  rows="3"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Kadıköy Mahallesi Örnek Sokak No:1 Daire:5"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !user?.is_SuperAdmin}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                İşleniyor...
              </div>
            ) : (
              'Ödemeyi Başlat (₺99,90)'
            )}
          </button>
        </form>

        {userCards.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Kayıtlı Kartlarım</h3>
            <div className="space-y-2">
              {userCards.map((card) => (
                <div key={card.id} className="bg-gray-50 rounded-md p-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{card.card_alias}</p>
                      <p className="text-sm text-gray-500">
                        **** **** **** {card.last_four} - {card.card_type}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(card.created_at).toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PaymentPage 