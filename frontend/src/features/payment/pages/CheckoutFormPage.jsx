import { useState } from 'react'
import { useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import paymentService from '../services/paymentService'

const CheckoutFormPage = () => {
  const { user } = useSelector((state) => state.auth)
  
  // SuperAdmin kontrolü
  if (!user?.is_SuperAdmin) {
    return <Navigate to="/dashboard" replace />
  }
  
  const [loading, setLoading] = useState(false)
  const [addressData, setAddressData] = useState({
    // Billing Address
    billingContactName: '',
    billingCity: '',
    billingCountry: 'Turkey',
    billingAddress: '',
    billingZipCode: '',
    // Shipping Address
    shippingContactName: '',
    shippingCity: '',
    shippingCountry: 'Turkey',
    shippingAddress: '',
    shippingZipCode: '',
    // Options
    registerCard: false,
    useShippingAsBilling: true
  })

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    
    setAddressData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleUseShippingAsBilling = (e) => {
    const useShipping = e.target.checked
    setAddressData(prev => ({
      ...prev,
      useShippingAsBilling: useShipping,
      // Eğer aynı adres kullanılacaksa kargo adresini fatura adresine kopyala
      ...(useShipping && {
        shippingContactName: prev.billingContactName,
        shippingCity: prev.billingCity,
        shippingCountry: prev.billingCountry,
        shippingAddress: prev.billingAddress,
        shippingZipCode: prev.billingZipCode
      })
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
      const paymentData = {
        billing: {
          contactName: addressData.billingContactName,
          city: addressData.billingCity,
          country: addressData.billingCountry,
          address: addressData.billingAddress,
          zipCode: addressData.billingZipCode
        },
        shipping: addressData.useShippingAsBilling ? {
          contactName: addressData.billingContactName,
          city: addressData.billingCity,
          country: addressData.billingCountry,
          address: addressData.billingAddress,
          zipCode: addressData.billingZipCode
        } : {
          contactName: addressData.shippingContactName,
          city: addressData.shippingCity,
          country: addressData.shippingCountry,
          address: addressData.shippingAddress,
          zipCode: addressData.shippingZipCode
        },
        product: {
          id: 'premium-membership',
          name: 'Premium Üyelik',
          category: 'Membership',
          price: '99.90',
          basketId: `basket-${user.id}-${Date.now()}`
        },
        registerCard: addressData.registerCard
      }

      console.log('🔍 Checkout Form Data:', paymentData)

      const result = await paymentService.initializeCheckoutForm(paymentData)
      
      if (result.success) {
        // Iyzico'nun hosted sayfasına yönlendir
        if (result.paymentPageUrl) {
          toast.success('Güvenli ödeme sayfasına yönlendiriliyorsunuz...')
          
          // Yeni sekmede açmak için
          window.location.href = result.paymentPageUrl
        } else if (result.checkoutFormContent) {
          // HTML content varsa sayfaya embed et
          const newWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes')
          newWindow.document.write(result.checkoutFormContent)
          newWindow.document.close()
        } else {
          throw new Error('Checkout form URL bulunamadı')
        }
      } else {
        throw new Error(result.error || 'Ödeme başlatılamadı')
      }
      
    } catch (error) {
      console.error('Checkout Form hatası:', error)
      toast.error(error.response?.data?.error || error.message || 'Ödeme başlatılamadı')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Premium Üyelik Ödemesi</h1>
        
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-blue-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-blue-800">Güvenli Ödeme</h3>
              <p className="text-sm text-blue-700">
                Kart bilgilerinizi güvenli İyzico sayfasına girececeksiniz. Bilgileriniz bizim sistemimizden geçmez.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">Sipariş Özeti</h3>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Premium Üyelik (30 Gün)</span>
            <span className="font-bold text-gray-900">₺99,90</span>
          </div>
        </div>
        
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
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Fatura Adresi */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Fatura Adresi</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="billingContactName" className="block text-sm font-medium text-gray-700">
                  İsim Soyisim *
                </label>
                <input
                  type="text"
                  id="billingContactName"
                  name="billingContactName"
                  value={addressData.billingContactName}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Emirhan Kalafat"
                />
              </div>

              <div>
                <label htmlFor="billingCity" className="block text-sm font-medium text-gray-700">
                  Şehir *
                </label>
                <input
                  type="text"
                  id="billingCity"
                  name="billingCity"
                  value={addressData.billingCity}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="İstanbul"
                />
              </div>

              <div>
                <label htmlFor="billingCountry" className="block text-sm font-medium text-gray-700">
                  Ülke *
                </label>
                <select
                  id="billingCountry"
                  name="billingCountry"
                  value={addressData.billingCountry}
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

              <div>
                <label htmlFor="billingZipCode" className="block text-sm font-medium text-gray-700">
                  Posta Kodu
                </label>
                <input
                  type="text"
                  id="billingZipCode"
                  name="billingZipCode"
                  value={addressData.billingZipCode}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="34000"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="billingAddress" className="block text-sm font-medium text-gray-700">
                  Adres *
                </label>
                <textarea
                  id="billingAddress"
                  name="billingAddress"
                  value={addressData.billingAddress}
                  onChange={handleInputChange}
                  required
                  rows="3"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Kadıköy Mahallesi Örnek Sokak No:1 Daire:5"
                />
              </div>
            </div>
          </div>

          {/* Teslimat Adresi Seçeneği */}
          <div>
            <div className="flex items-center mb-4">
              <input
                id="useShippingAsBilling"
                name="useShippingAsBilling"
                type="checkbox"
                checked={addressData.useShippingAsBilling}
                onChange={handleUseShippingAsBilling}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="useShippingAsBilling" className="ml-2 block text-sm text-gray-900">
                Teslimat adresi fatura adresi ile aynı
              </label>
            </div>

            {!addressData.useShippingAsBilling && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Teslimat Adresi</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="shippingContactName" className="block text-sm font-medium text-gray-700">
                      İsim Soyisim *
                    </label>
                    <input
                      type="text"
                      id="shippingContactName"
                      name="shippingContactName"
                      value={addressData.shippingContactName}
                      onChange={handleInputChange}
                      required={!addressData.useShippingAsBilling}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Emirhan Kalafat"
                    />
                  </div>

                  <div>
                    <label htmlFor="shippingCity" className="block text-sm font-medium text-gray-700">
                      Şehir *
                    </label>
                    <input
                      type="text"
                      id="shippingCity"
                      name="shippingCity"
                      value={addressData.shippingCity}
                      onChange={handleInputChange}
                      required={!addressData.useShippingAsBilling}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="İstanbul"
                    />
                  </div>

                  <div>
                    <label htmlFor="shippingCountry" className="block text-sm font-medium text-gray-700">
                      Ülke *
                    </label>
                    <select
                      id="shippingCountry"
                      name="shippingCountry"
                      value={addressData.shippingCountry}
                      onChange={handleInputChange}
                      required={!addressData.useShippingAsBilling}
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

                  <div>
                    <label htmlFor="shippingZipCode" className="block text-sm font-medium text-gray-700">
                      Posta Kodu
                    </label>
                    <input
                      type="text"
                      id="shippingZipCode"
                      name="shippingZipCode"
                      value={addressData.shippingZipCode}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="34000"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="shippingAddress" className="block text-sm font-medium text-gray-700">
                      Adres *
                    </label>
                    <textarea
                      id="shippingAddress"
                      name="shippingAddress"
                      value={addressData.shippingAddress}
                      onChange={handleInputChange}
                      required={!addressData.useShippingAsBilling}
                      rows="3"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Kadıköy Mahallesi Örnek Sokak No:1 Daire:5"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Ödeme Seçenekleri */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Ödeme Seçenekleri</h3>
            
            <div className="flex items-center">
              <input
                id="registerCard"
                name="registerCard"
                type="checkbox"
                checked={addressData.registerCard}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="registerCard" className="ml-2 block text-sm text-gray-900">
                Kartımı kaydet (gelecek ödemeler için)
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !user?.is_SuperAdmin}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Yönlendiriliyor...
              </div>
            ) : (
              '🔒 Güvenli Ödeme Sayfasına Git (₺99,90)'
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>🔒 SSL ile şifrelenmiş güvenli ödeme</p>
          <p>💳 Visa, MasterCard ve tüm banka kartları kabul edilir</p>
        </div>
      </div>
    </div>
  )
}

export default CheckoutFormPage 