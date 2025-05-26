import { Link, useLocation } from 'react-router-dom'

const InviteSuccessPage = () => {
  const location = useLocation()
  const { message, email } = location.state || {}

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-lg">
            <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">
            Hesap Oluşturuldu!
          </h2>
          <p className="text-emerald-100 mb-8">
            Davet başarıyla kabul edildi
          </p>
        </div>
        
        <div className="bg-white rounded-2xl p-8 shadow-xl text-center">
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-700 text-sm">
                {message || 'Hesabınız başarıyla oluşturuldu. Artık giriş yapabilirsiniz.'}
              </p>
            </div>
            
            <div className="space-y-3">
              <p className="text-gray-600">
                Hesabınız aktifleştirildi. Artık sisteme giriş yapabilirsiniz.
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <svg className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-left">
                    <p className="text-blue-700 text-sm font-medium">Bilgi:</p>
                    <p className="text-blue-600 text-sm mt-1">
                      Davet edilen kullanıcılar otomatik olarak doğrulanır ve hemen giriş yapabilir.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <Link
              to="/login"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
            >
              Giriş Sayfasına Git
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InviteSuccessPage 