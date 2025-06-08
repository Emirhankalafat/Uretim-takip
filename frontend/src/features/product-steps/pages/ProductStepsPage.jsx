import { useState, useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import productStepsService from '../services/productStepsService'
import productService from '../../products/services/productService'
import userService from '../../users/services/userService'
import usePermissions from '../../../hooks/usePermissions'
import Toast from '../../../components/Toast'
import SubscriptionGuard from '../../../components/SubscriptionGuard'

const ProductStepsPage = () => {
  const [productSteps, setProductSteps] = useState([])
  const [products, setProducts] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedProductId, setSelectedProductId] = useState('')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [editingSteps, setEditingSteps] = useState(new Set())
  const [newSteps, setNewSteps] = useState([])
  const [toast, setToast] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [draggedStep, setDraggedStep] = useState(null)
  const [dragOverStep, setDragOverStep] = useState(null)
  const dropdownRef = useRef(null)
  
  const { user } = useSelector((state) => state.auth)
  const { hasPermission } = usePermissions()

  // Yetki kontrolleri
  const canRead = user?.is_SuperAdmin || hasPermission('PRODUCT_STEP_READ')
  const canCreate = user?.is_SuperAdmin || hasPermission('PRODUCT_STEP_CREATE')
  const canUpdate = user?.is_SuperAdmin || hasPermission('PRODUCT_STEP_UPDATE')
  const canDelete = user?.is_SuperAdmin || hasPermission('PRODUCT_STEP_DELETE')
  const canReadProducts = user?.is_SuperAdmin || hasPermission('PRODUCT_READ')

  // Ürün adımlarına erişim için hem step yetkisi hem de ürün okuma yetkisi zorunlu
  const hasStepPermission = canRead || canCreate || canUpdate || canDelete;
  const hasFullAccess = hasStepPermission && canReadProducts;

  // Eksik yetkileri belirle
  const missingPermissions = [];
  if (!hasStepPermission) missingPermissions.push('PRODUCT_STEP_READ / CREATE / UPDATE / DELETE');
  if (!canReadProducts) missingPermissions.push('PRODUCT_READ');

  useEffect(() => {
    if (canReadProducts) {
      fetchProducts()
    }
    fetchUsers()
    setLoading(false)
  }, [canReadProducts])

  useEffect(() => {
    if (selectedProductId && canRead) {
      fetchProductSteps()
    } else {
      setProductSteps([])
      setNewSteps([])
      setEditingSteps(new Set())
    }
  }, [selectedProductId, canRead])

  // Click outside handler for dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const fetchProductSteps = async () => {
    try {
      setLoading(true)
      const response = await productStepsService.getProductSteps({ product_id: selectedProductId })
      const steps = response.productSteps || []
      setProductSteps(steps.sort((a, b) => a.Step_number - b.Step_number))
    } catch (error) {
      console.error('Ürün adımları yüklenirken hata:', error)
      setToast({
        type: 'error',
        message: 'Ürün adımları yüklenirken bir hata oluştu.'
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await productService.getProducts()
      setProducts(response.products || [])
    } catch (error) {
      console.error('Ürünler yüklenirken hata:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await userService.getSimpleUsers()
      setUsers(response.data?.users || [])
    } catch (error) {
      console.error('Kullanıcılar yüklenirken hata:', error)
      // Hata durumunda boş array kullan, sayfa çalışmaya devam etsin
      setUsers([])
    }
  }

  const handleProductSelect = (productId) => {
    setSelectedProductId(productId.toString())
    const product = products.find(p => p.id.toString() === productId.toString())
    setSelectedProduct(product)
    setNewSteps([])
    setEditingSteps(new Set())
    setShowDropdown(false)
  }

  const addNewStep = () => {
    const nextStepNumber = Math.max(
      ...productSteps.map(s => s.Step_number),
      ...newSteps.map(s => s.Step_number),
      0
    ) + 1

    const newStep = {
      id: `new_${Date.now()}`,
      Name: '',
      Description: '',
      Product_id: selectedProductId,
      Step_number: nextStepNumber,
      Responsible_User: '',
      isNew: true
    }
    
    setNewSteps([...newSteps, newStep])
    setEditingSteps(new Set([...editingSteps, newStep.id]))
  }

  const updateStep = (stepId, field, value) => {
    if (stepId.toString().startsWith('new_')) {
      setNewSteps(newSteps.map(step => 
        step.id === stepId ? { ...step, [field]: value } : step
      ))
    } else {
      setProductSteps(productSteps.map(step => 
        step.id === stepId ? { ...step, [field]: value } : step
      ))
    }
  }

  const toggleEdit = (stepId) => {
    const newEditingSteps = new Set(editingSteps)
    if (newEditingSteps.has(stepId)) {
      newEditingSteps.delete(stepId)
    } else {
      newEditingSteps.add(stepId)
    }
    setEditingSteps(newEditingSteps)
  }

  const saveStep = async (stepId) => {
    try {
      if (stepId.toString().startsWith('new_')) {
        const newStep = newSteps.find(step => step.id === stepId)
        if (!newStep.Name) {
          setToast({
            type: 'error',
            message: 'Adım adı gerekli.'
          })
          return
        }

        const { id, isNew, ...stepData } = newStep
        await productStepsService.createProductStep(stepData)
        
        setNewSteps(newSteps.filter(step => step.id !== stepId))
        setEditingSteps(new Set([...editingSteps].filter(id => id !== stepId)))
        fetchProductSteps()
        
        setToast({
          type: 'success',
          message: 'Ürün adımı başarıyla oluşturuldu.'
        })
      } else {
        const step = productSteps.find(s => s.id === stepId)
        if (!step.Name) {
          setToast({
            type: 'error',
            message: 'Adım adı gerekli.'
          })
          return
        }

        await productStepsService.updateProductStep(stepId, {
          Name: step.Name,
          Description: step.Description,
          Step_number: step.Step_number,
          Responsible_User: step.Responsible_User || null
        })
        
        setEditingSteps(new Set([...editingSteps].filter(id => id !== stepId)))
        
        setToast({
          type: 'success',
          message: 'Ürün adımı başarıyla güncellendi.'
        })
      }
    } catch (error) {
      console.error('Kaydetme hatası:', error)
      setToast({
        type: 'error',
        message: error.response?.data?.message || 'Kaydetme sırasında bir hata oluştu.'
      })
    }
  }

  const deleteStep = async (stepId) => {
    if (stepId.toString().startsWith('new_')) {
      setNewSteps(newSteps.filter(step => step.id !== stepId))
      setEditingSteps(new Set([...editingSteps].filter(id => id !== stepId)))
      return
    }

    const step = productSteps.find(s => s.id === stepId)
    if (!window.confirm(`"${step.Name}" adımını silmek istediğinizden emin misiniz?`)) {
      return
    }

    try {
      await productStepsService.deleteProductStep(stepId)
      fetchProductSteps()
      setToast({
        type: 'success',
        message: 'Ürün adımı başarıyla silindi.'
      })
    } catch (error) {
      console.error('Silme hatası:', error)
      setToast({
        type: 'error',
        message: error.response?.data?.message || 'Silme sırasında bir hata oluştu.'
      })
    }
  }

  const reorderSteps = async () => {
    try {
      // Sadece kaydedilmiş adımları sırala (yeni adımları hariç tut)
      const savedSteps = productSteps.filter(step => !step.isNew)
      const sortedSteps = savedSteps.sort((a, b) => a.Step_number - b.Step_number)
      
      // Yeni step numaralarını ata
      const reorderedSteps = sortedSteps.map((step, index) => ({
        id: step.id,
        step_number: index + 1
      }))

      // Backend'e bulk update gönder
      await productStepsService.reorderProductSteps(selectedProductId, reorderedSteps)

      fetchProductSteps()
      setToast({
        type: 'success',
        message: 'Adım numaraları yeniden düzenlendi.'
      })
    } catch (error) {
      console.error('Yeniden düzenleme hatası:', error)
      setToast({
        type: 'error',
        message: 'Yeniden düzenleme sırasında bir hata oluştu.'
      })
    }
  }

  const getStepColor = (stepNumber) => {
    const colors = [
      'from-blue-500 to-blue-600',
      'from-green-500 to-green-600',
      'from-purple-500 to-purple-600',
      'from-pink-500 to-pink-600',
      'from-indigo-500 to-indigo-600',
      'from-yellow-500 to-yellow-600',
      'from-red-500 to-red-600',
      'from-teal-500 to-teal-600'
    ]
    return colors[(stepNumber - 1) % colors.length]
  }

  // Sürükle-bırak işlevleri
  const handleDragStart = (e, step) => {
    setDraggedStep(step)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/html', e.target.outerHTML)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDragEnter = (e, step) => {
    e.preventDefault()
    setDragOverStep(step)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    // Sadece container'dan çıkıldığında dragOverStep'i temizle
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverStep(null)
    }
  }

  const handleDrop = async (e, targetStep) => {
    e.preventDefault()
    
    if (!draggedStep || draggedStep.id === targetStep.id) {
      setDraggedStep(null)
      setDragOverStep(null)
      return
    }

    try {
      // Yeni adımları sürükle-bırak ile sıralayamayız, sadece mevcut adımları
      if (draggedStep.isNew || targetStep.isNew) {
        setToast({
          type: 'warning',
          message: 'Yeni adımları sürükleyemezsiniz. Önce kaydedin.'
        })
        setDraggedStep(null)
        setDragOverStep(null)
        return
      }

      // Mevcut adımları kopyala ve yeni sıralamayı hesapla
      const currentSteps = [...productSteps]
      const draggedIndex = currentSteps.findIndex(s => s.id === draggedStep.id)
      const targetIndex = currentSteps.findIndex(s => s.id === targetStep.id)

      // Sürüklenen adımı çıkar ve hedef pozisyona ekle
      const [movedStep] = currentSteps.splice(draggedIndex, 1)
      currentSteps.splice(targetIndex, 0, movedStep)

      // Yeni step numaralarını ata
      const reorderedSteps = currentSteps.map((step, index) => ({
        id: step.id,
        step_number: index + 1
      }))

      // Backend'e bulk update gönder
      await productStepsService.reorderProductSteps(selectedProductId, reorderedSteps)

      // Sayfayı yenile
      fetchProductSteps()
      setToast({
        type: 'success',
        message: 'Adım sıralaması güncellendi.'
      })
    } catch (error) {
      console.error('Sıralama hatası:', error)
      setToast({
        type: 'error',
        message: 'Sıralama güncellenirken bir hata oluştu.'
      })
    } finally {
      setDraggedStep(null)
      setDragOverStep(null)
    }
  }

  const handleDragEnd = () => {
    setDraggedStep(null)
    setDragOverStep(null)
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const allSteps = [...productSteps, ...newSteps].sort((a, b) => a.Step_number - b.Step_number)

  if (!hasFullAccess) {
    return (
      <div className="animate-fade-in min-h-screen bg-blue-50 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-2xl shadow-strong border border-blue-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-8 py-6 text-white">
              <div className="flex items-center">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-4">
                  <span className="text-3xl">ℹ️</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold mb-1">Yetki Gerekli</h1>
                  <p className="text-blue-100">Ürün Adımları Yönetimi</p>
                </div>
              </div>
            </div>
            <div className="p-8">
              <div className="text-center mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  Bu sayfaya erişmek için gerekli yetkilere sahip değilsiniz.
                </h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Lütfen yöneticinizle iletişime geçin ve aşağıdaki yetkileri talep edin:
                </p>
                <div className="inline-block bg-blue-100 border border-blue-300 text-blue-900 rounded-lg px-4 py-3 mb-4">
                  <span className="font-semibold">Eksik Yetkiler:</span>
                  <ul className="list-disc list-inside mt-2 text-left">
                    {missingPermissions.map((perm, i) => (
                      <li key={i}>{perm}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="bg-blue-50 rounded-xl p-6 mb-8 border border-blue-100">
                <h3 className="font-semibold text-blue-900 mb-4 flex items-center">
                  <span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm mr-2">✓</span>
                  Gerekli Yetkiler
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center p-3 bg-white rounded-lg border border-blue-100">
                    <span className="text-2xl mr-3">👁️</span>
                    <div>
                      <div className="font-medium text-blue-900">PRODUCT_STEP_READ / CREATE / UPDATE / DELETE</div>
                      <div className="text-sm text-blue-700">Ürün adımlarını yönetme yetkilerinden en az biri</div>
                    </div>
                  </div>
                  <div className="flex items-center p-3 bg-white rounded-lg border border-blue-100">
                    <span className="text-2xl mr-3">📦</span>
                    <div>
                      <div className="font-medium text-blue-900">PRODUCT_READ</div>
                      <div className="text-sm text-blue-700">Ürünleri görüntüleme yetkisi</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-blue-100 border border-blue-200 rounded-xl p-6 mb-8">
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl mr-4 flex-shrink-0">
                    👤
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-2">
                      Yöneticiyle İletişime Geçin
                    </h3>
                    <p className="text-blue-800 mb-4 leading-relaxed">
                      Gerekli yetkileri almak için sistem yöneticinizle iletişime geçebilirsiniz.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 shadow-strong text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Ürün Adımları Yönetimi</h1>
            <p className="text-primary-100">
              Ürünleriniz için üretim süreçlerini adım adım yönetin
            </p>
          </div>
          <div className="text-6xl opacity-20">
            🔧
          </div>
        </div>
      </div>

      {/* Product Selection */}
      <div className="bg-white rounded-xl p-6 shadow-soft border border-gray-100">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex-1 max-w-md">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ürün Seçin
            </label>
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setShowDropdown(!showDropdown)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 text-left bg-white flex items-center justify-between"
              >
                <span className={selectedProduct ? "text-gray-900" : "text-gray-500"}>
                  {selectedProduct ? selectedProduct.name : "Ürün seçin..."}
                </span>
                <span className={`transform transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`}>
                  ⬇️
                </span>
              </button>
              {showDropdown && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl mt-1 shadow-medium z-10 max-h-60 overflow-y-auto">
                  {/* Arama kutusu */}
                  <div className="p-3 border-b border-gray-100">
                    <input
                      type="text"
                      placeholder="Ürün ara..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                    />
                  </div>
                  {/* Ürün listesi */}
                  <div className="max-h-48 overflow-y-auto">
                    {filteredProducts.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => {
                          handleProductSelect(product.id)
                          setSearchTerm('')
                          setShowDropdown(false)
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors duration-200 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-gray-900">{product.name}</div>
                        {product.description && (
                          <div className="text-sm text-gray-600 truncate">{product.description}</div>
                        )}
                      </button>
                    ))}
                    {filteredProducts.length === 0 && (
                      <div className="px-4 py-3 text-gray-500 text-center">
                        {searchTerm ? "Ürün bulunamadı" : "Ürün bulunmuyor"}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {selectedProduct && (
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-gray-600">Seçili Ürün</div>
                <div className="font-semibold text-gray-900">{selectedProduct.name}</div>
              </div>
              <button
                onClick={() => {
                  setSelectedProductId('')
                  setSelectedProduct(null)
                  setSearchTerm('')
                  setShowDropdown(false)
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-300"
                title="Seçimi Temizle"
              >
                ❌
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Product Steps Workflow */}
      {selectedProduct ? (
        <div className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden">
          {/* Workflow Header */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {selectedProduct.name} - Üretim Adımları
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {allSteps.length} adım {canUpdate && allSteps.filter(s => !s.isNew).length > 0 && '• Sürükleyerek sıralayabilirsiniz 🔄'}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                {canCreate && (
                  <SubscriptionGuard requiresActiveSubscription={true} actionName="Yeni adım ekleme">
                    <button
                      onClick={addNewStep}
                      className="bg-gradient-to-r from-success-500 to-success-600 text-white px-4 py-2 rounded-lg font-medium hover:from-success-600 hover:to-success-700 transition-all duration-300 shadow-medium"
                    >
                      <span className="mr-2">➕</span>
                      Yeni Adım
                    </button>
                  </SubscriptionGuard>
                )}
                {canUpdate && (
                  <SubscriptionGuard requiresActiveSubscription={true} actionName="Adımları yeniden sıralama">
                    <button
                      onClick={reorderSteps}
                      className="bg-gradient-to-r from-info-500 to-info-600 text-white px-4 py-2 rounded-lg font-medium hover:from-info-600 hover:to-info-700 transition-all duration-300 shadow-medium"
                    >
                      <span className="mr-2">🔄</span>
                      Yeniden Sırala
                    </button>
                  </SubscriptionGuard>
                )}
              </div>
            </div>
          </div>

          {/* Steps List */}
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="relative">
                  <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
                </div>
                <div className="ml-4">
                  <div className="text-lg font-semibold text-gray-900">Yükleniyor...</div>
                  <div className="text-sm text-gray-600">Adımlar getiriliyor</div>
                </div>
              </div>
            ) : allSteps.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-4xl">🔧</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Henüz adım bulunmuyor
                </h3>
                <p className="text-gray-600 mb-6">
                  Bu ürün için ilk üretim adımını oluşturarak başlayın.
                </p>
                {canCreate && (
                  <SubscriptionGuard requiresActiveSubscription={true} actionName="İlk adım oluşturma">
                    <button
                      onClick={addNewStep}
                      className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-primary-600 hover:to-primary-700 transition-all duration-300 shadow-medium hover:shadow-strong transform hover:scale-105"
                    >
                      <span className="mr-2">➕</span>
                      İlk Adımı Oluştur
                    </button>
                  </SubscriptionGuard>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {allSteps.map((step, index) => (
                  <div
                    key={step.id}
                    draggable={canUpdate && !step.isNew && !editingSteps.has(step.id)}
                    onDragStart={canUpdate ? (e) => handleDragStart(e, step) : undefined}
                    onDragOver={canUpdate ? handleDragOver : undefined}
                    onDragEnter={canUpdate ? (e) => handleDragEnter(e, step) : undefined}
                    onDragLeave={canUpdate ? handleDragLeave : undefined}
                    onDrop={canUpdate ? (e) => handleDrop(e, step) : undefined}
                    onDragEnd={canUpdate ? handleDragEnd : undefined}
                    className={`relative bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-xl p-6 transition-all duration-300 hover:shadow-medium ${
                      step.isNew ? 'border-success-300 bg-gradient-to-r from-success-50 to-white' : ''
                    } ${
                      editingSteps.has(step.id) ? 'border-primary-300 shadow-medium' : ''
                    } ${
                      canUpdate && draggedStep?.id === step.id ? 'opacity-50 scale-105 shadow-strong' : ''
                    } ${
                      canUpdate && dragOverStep?.id === step.id && draggedStep?.id !== step.id ? 'border-primary-400 bg-primary-50 scale-102' : ''
                    } ${
                      canUpdate && !step.isNew && !editingSteps.has(step.id) ? 'cursor-move' : ''
                    }`}
                  >
                    {/* Step Number Badge */}
                    <div className="absolute -left-3 top-6">
                      <div className={`w-12 h-12 bg-gradient-to-r ${getStepColor(step.Step_number)} rounded-full flex items-center justify-center shadow-medium border-4 border-white ${
                        !step.isNew && !editingSteps.has(step.id) ? 'hover:scale-110' : ''
                      }`}>
                        <span className="text-white font-bold text-lg">{step.Step_number}</span>
                      </div>
                      {/* Sürüklenebilir ipucu */}
                      {canUpdate && !step.isNew && !editingSteps.has(step.id) && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">⋮⋮</span>
                        </div>
                      )}
                    </div>

                    <div className="ml-12">
                      {editingSteps.has(step.id) ? (
                        /* Edit Mode */
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Adım Adı *
                              </label>
                              <input
                                type="text"
                                value={step.Name}
                                onChange={(e) => updateStep(step.id, 'Name', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                placeholder="Adım adı"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Adım Numarası *
                              </label>
                              <input
                                type="number"
                                min="1"
                                value={step.Step_number}
                                onChange={(e) => updateStep(step.id, 'Step_number', parseInt(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              />
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Açıklama
                            </label>
                            <textarea
                              value={step.Description || ''}
                              onChange={(e) => updateStep(step.id, 'Description', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                              rows={3}
                              placeholder="Adım açıklaması"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Sorumlu Kullanıcı
                            </label>
                            <select
                              value={step.Responsible_User || ''}
                              onChange={(e) => updateStep(step.id, 'Responsible_User', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            >
                              <option value="">Sorumlu Seçin</option>
                              {users.map((user) => (
                                <option key={user.id} value={user.id}>
                                  {user.Name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                            <button
                              onClick={() => {
                                if (step.isNew) {
                                  setNewSteps(newSteps.filter(s => s.id !== step.id))
                                }
                                toggleEdit(step.id)
                              }}
                              className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all duration-300"
                            >
                              İptal
                            </button>
                            <button
                              onClick={() => saveStep(step.id)}
                              className="bg-gradient-to-r from-success-500 to-success-600 text-white px-4 py-2 rounded-lg font-medium hover:from-success-600 hover:to-success-700 transition-all duration-300"
                            >
                              <span className="mr-2">💾</span>
                              Kaydet
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* View Mode */
                        <div>
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                {step.Name || 'Adım Adı Girilmemiş'}
                              </h3>
                              {step.Description && (
                                <p className="text-gray-600 mb-3">
                                  {step.Description}
                                </p>
                              )}
                            </div>
                            
                            {(canUpdate || canDelete) && (
                              <div className="flex items-center space-x-2 ml-4">
                                {canUpdate && (
                                  <SubscriptionGuard requiresActiveSubscription={true} actionName="Adım düzenleme">
                                    <button
                                      onClick={() => toggleEdit(step.id)}
                                      className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-300"
                                      title="Düzenle"
                                    >
                                      ✏️
                                    </button>
                                  </SubscriptionGuard>
                                )}
                                {canDelete && (
                                  <SubscriptionGuard requiresActiveSubscription={true} actionName="Adım silme" showTooltip={false}>
                                    <button
                                      onClick={() => deleteStep(step.id)}
                                      className="p-2 text-gray-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-all duration-300"
                                      title="Sil"
                                    >
                                      🗑️
                                    </button>
                                  </SubscriptionGuard>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div className="flex items-center">
                              <span className="text-gray-500 mr-2">👤 Sorumlu:</span>
                              <span className="text-gray-900 font-medium">
                                {step.responsible?.Name || 'Atanmamış'}
                              </span>
                            </div>
                            <div className="flex items-center">
                              <span className="text-gray-500 mr-2">📦 Ürün:</span>
                              <span className="text-gray-900 font-medium">
                                {selectedProduct.name}
                              </span>
                            </div>
                            <div className="flex items-center">
                              <span className="text-gray-500 mr-2">📅 Oluşturulma:</span>
                              <span className="text-gray-900 font-medium">
                                {step.created_at ? new Date(step.created_at).toLocaleDateString('tr-TR') : 'Yeni'}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* No Product Selected */
        <div className="bg-white rounded-xl p-12 shadow-soft border border-gray-100 text-center">
          <div className="w-24 h-24 bg-gradient-to-r from-primary-100 to-primary-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🏭</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Ürün Seçin
          </h3>
          <p className="text-gray-600 mb-6">
            Adımlarını yönetmek istediğiniz ürünü seçerek başlayın.
          </p>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}

export default ProductStepsPage 