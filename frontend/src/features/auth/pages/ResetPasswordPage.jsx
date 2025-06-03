import { useState, useEffect, useRef } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { authService } from '../services/authService'
import toast from 'react-hot-toast'

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')
  const hasVerified = useRef(false) // Duplicate request'leri engellemek için

  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isTokenValid, setIsTokenValid] = useState(null) // null: loading, true: valid, false: invalid
  const [userInfo, setUserInfo] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    strength: 'Zayıf',
  });

  // Token'ı doğrula
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setIsTokenValid(false)
        return
      }

      // Eğer zaten verify işlemi yapıldıysa, tekrar yapma
      if (hasVerified.current) {
        console.log('Reset token verification already in progress, skipping...')
        return
      }

      hasVerified.current = true

      try {
        const response = await authService.verifyResetToken(token)
        setIsTokenValid(true)
        setUserInfo(response.user)
      } catch (error) {
        console.error('Token verification error:', error)
        setIsTokenValid(false)
        toast.error(error.response?.data?.message || 'Geçersiz veya süresi dolmuş link')
        // Hata durumunda tekrar deneme imkanı için reset et
        hasVerified.current = false
      }
    }

    verifyToken()
  }, [token])

  useEffect(() => {
    const length = formData.newPassword && formData.newPassword.length >= 8;
    const uppercase = /[A-Z]/.test(formData.newPassword || '');
    const lowercase = /[a-z]/.test(formData.newPassword || '');
    let strength = 'Zayıf';
    const score = [length, uppercase, lowercase].filter(Boolean).length;
    if (score === 3 && formData.newPassword.length >= 12) strength = 'Güçlü';
    else if (score >= 2) strength = 'Orta';
    setPasswordStrength({ length, uppercase, lowercase, strength });
  }, [formData.newPassword]);

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const validateForm = () => {
    if (!formData.newPassword) {
      toast.error('Yeni şifre gereklidir')
      return false
    }
    if (formData.newPassword.length < 8) {
      toast.error('Şifre en az 8 karakter olmalıdır')
      return false
    }
    if (!/[A-Z]/.test(formData.newPassword)) {
      toast.error('Şifre en az bir büyük harf içermelidir')
      return false
    }
    if (!/[a-z]/.test(formData.newPassword)) {
      toast.error('Şifre en az bir küçük harf içermelidir')
      return false
    }
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Şifreler eşleşmiyor')
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsLoading(true)

    try {
      const response = await authService.resetPassword(token, formData.newPassword)
      toast.success(response.message)
      
      // Başarılı olduktan sonra login sayfasına yönlendir
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    } catch (error) {
      console.error('Reset password error:', error)
      toast.error(error.response?.data?.message || 'Şifre sıfırlanırken hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  // Token geçersizse
  if (isTokenValid === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center">
              <div className="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.864-.833-2.634 0l-5.898 8.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Geçersiz Link</h2>
              <p className="text-gray-600 mb-6">
                Bu şifre sıfırlama linki geçersiz veya süresi dolmuş. Lütfen yeni bir link talep edin.
              </p>
              <div className="space-y-3">
                <Link
                  to="/forgot-password"
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                  Yeni Link Talep Et
                </Link>
                <Link
                  to="/login"
                  className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                  Giriş Sayfasına Dön
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Token doğrulanıyor
  if (isTokenValid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center">
              <div className="mx-auto h-16 w-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Doğrulanıyor...</h2>
              <p className="text-gray-600">Şifre sıfırlama linki doğrulanıyor, lütfen bekleyin.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Token geçerli, şifre sıfırlama formu
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Yeni Şifre Belirle</h2>
            {userInfo && (
              <p className="text-gray-600 mb-8">
                Merhaba <span className="font-medium text-gray-900">{userInfo.name}</span>, yeni şifrenizi belirleyin.
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Yeni Şifre
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  name="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  className="appearance-none relative block w-full pr-10 pl-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm transition-colors"
                  placeholder="En az 8 karakter, en az bir büyük ve bir küçük harf içermelidir"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <svg className={`h-5 w-5 ${showPassword ? 'text-indigo-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {showPassword ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    )}
                  </svg>
                </button>
              </div>
              {/* Şifre gereksinimleri barı */}
              <div className="mt-2">
                <div className="flex space-x-2 mb-1">
                  <span className={`flex-1 h-2 rounded ${passwordStrength.length ? 'bg-emerald-500' : 'bg-gray-300'}`}></span>
                  <span className={`flex-1 h-2 rounded ${passwordStrength.uppercase ? 'bg-emerald-500' : 'bg-gray-300'}`}></span>
                  <span className={`flex-1 h-2 rounded ${passwordStrength.lowercase ? 'bg-emerald-500' : 'bg-gray-300'}`}></span>
                </div>
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span className={passwordStrength.length ? 'text-emerald-600 font-semibold' : ''}>8+ karakter</span>
                  <span className={passwordStrength.uppercase ? 'text-emerald-600 font-semibold' : ''}>Büyük harf</span>
                  <span className={passwordStrength.lowercase ? 'text-emerald-600 font-semibold' : ''}>Küçük harf</span>
                </div>
                <div className={`text-xs font-bold ${passwordStrength.strength === 'Güçlü' ? 'text-emerald-600' : passwordStrength.strength === 'Orta' ? 'text-yellow-600' : 'text-red-600'}`}>Şifre Gücü: {passwordStrength.strength}</div>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Yeni Şifre (Tekrar)
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="appearance-none relative block w-full pr-10 pl-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm transition-colors"
                  placeholder="Şifrenizi tekrar girin"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <svg className={`h-5 w-5 ${showConfirmPassword ? 'text-indigo-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {showConfirmPassword ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    )}
                  </svg>
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Şifre Sıfırlanıyor...
                  </div>
                ) : (
                  'Şifreyi Sıfırla'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    Güvenliğiniz için şifreniz en az 8 karakter olmalı, en az bir büyük ve bir küçük harf içermelidir.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
            >
              Giriş sayfasına geri dön
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResetPasswordPage 