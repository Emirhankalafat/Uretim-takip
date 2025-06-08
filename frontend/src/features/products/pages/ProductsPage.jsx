import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import productService from '../services/productService'
import categoryService from '../../categories/services/categoryService'
import usePermissions from '../../../hooks/usePermissions'
import Toast from '../../../components/Toast'
import SubscriptionGuard from '../../../components/SubscriptionGuard'

const ProductsPage = () => {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [formData, setFormData] = useState({ name: '', description: '', Category_id: '' })
  const [filters, setFilters] = useState({ category_id: '', search: '' })
  const [toast, setToast] = useState(null)
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'
  const { user } = useSelector((state) => state.auth)
  const { hasPermission } = usePermissions()

  // Yetki kontrolleri
  const canRead = user?.is_SuperAdmin || hasPermission('PRODUCT_READ')
  const canCreate = user?.is_SuperAdmin || hasPermission('PRODUCT_CREATE')
  const canUpdate = user?.is_SuperAdmin || hasPermission('PRODUCT_UPDATE')
  const canDelete = user?.is_SuperAdmin || hasPermission('PRODUCT_DELETE')
  const canReadCategories = user?.is_SuperAdmin || hasPermission('CATEGORY_READ')

  useEffect(() => {
    if (canRead) {
      fetchProducts()
    } else {
      setLoading(false)
    }
    
    if (canReadCategories) {
      fetchCategories()
    }
  }, [canRead, canReadCategories])

  useEffect(() => {
    if (canRead) {
      fetchProducts()
    }
  }, [filters, canRead])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const params = {}
      if (filters.category_id) params.category_id = filters.category_id
      if (filters.search) params.search = filters.search
      
      const response = await productService.getProducts(params)
      setProducts(response.products || [])
    } catch (error) {
      console.error('Ürünler yüklenirken hata:', error)
      setToast({
        type: 'error',
        message: 'Ürünler yüklenirken bir hata oluştu.'
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await categoryService.getCategories()
      setCategories(response.categories || [])
    } catch (error) {
      console.error('Kategoriler yüklenirken hata:', error)
    }
  }

  const handleCreateProduct = async (e) => {
    e.preventDefault()
    try {
      await productService.createProduct(formData)
      setToast({
        type: 'success',
        message: 'Ürün başarıyla oluşturuldu.'
      })
      setShowCreateModal(false)
      setFormData({ name: '', description: '', Category_id: '' })
      fetchProducts()
    } catch (error) {
      console.error('Ürün oluşturma hatası:', error)
      setToast({
        type: 'error',
        message: error.response?.data?.message || 'Ürün oluşturulurken bir hata oluştu.'
      })
    }
  }

  const handleUpdateProduct = async (e) => {
    e.preventDefault()
    try {
      await productService.updateProduct(selectedProduct.id, formData)
      setToast({
        type: 'success',
        message: 'Ürün başarıyla güncellendi.'
      })
      setShowEditModal(false)
      setSelectedProduct(null)
      setFormData({ name: '', description: '', Category_id: '' })
      fetchProducts()
    } catch (error) {
      console.error('Ürün güncelleme hatası:', error)
      setToast({
        type: 'error',
        message: error.response?.data?.message || 'Ürün güncellenirken bir hata oluştu.'
      })
    }
  }

  const handleDeleteProduct = async (product) => {
    if (!window.confirm(`"${product.name}" ürününü silmek istediğinizden emin misiniz?`)) {
      return
    }

    try {
      await productService.deleteProduct(product.id)
      setToast({
        type: 'success',
        message: 'Ürün başarıyla silindi.'
      })
      fetchProducts()
    } catch (error) {
      console.error('Ürün silme hatası:', error)
      setToast({
        type: 'error',
        message: error.response?.data?.message || 'Ürün silinirken bir hata oluştu.'
      })
    }
  }

  const openEditModal = (product) => {
    setSelectedProduct(product)
    setFormData({
      name: product.name,
      description: product.description || '',
      Category_id: product.Category_id
    })
    setShowEditModal(true)
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({ category_id: '', search: '' })
  }

  // Kategori renklerini belirle
  const getCategoryColor = (categoryId) => {
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
    return colors[categoryId % colors.length]
  }

  if (!canRead) {
    return (
      <div className="animate-fade-in">
        <div className="bg-gradient-to-r from-danger-50 to-danger-100 border border-danger-200 rounded-xl p-6 shadow-soft">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-r from-danger-500 to-danger-600 rounded-full flex items-center justify-center">
                <span className="text-white text-lg">⚠️</span>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-danger-800">
                Erişim Reddedildi
              </h3>
              <p className="mt-1 text-sm text-danger-700">
                Bu sayfayı görüntülemek için gerekli yetkiniz bulunmamaktadır.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="flex items-center justify-center h-64">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl">📦</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in space-y-6">
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header Section */}
      <div className="bg-gradient-to-r from-white via-success-50 to-white rounded-xl p-6 shadow-soft border border-success-100">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-success-500 to-success-600 rounded-xl flex items-center justify-center shadow-medium">
              <span className="text-white text-2xl">📦</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Ürünler
              </h1>
              <p className="text-gray-600 mt-1">
                Ürünleri yönetin ve kategorilere göre organize edin
              </p>
            </div>
          </div>
          
          <div className="mt-4 lg:mt-0 flex items-center space-x-3">
            <div className="bg-white rounded-lg px-4 py-2 shadow-soft border border-gray-200">
              <span className="text-sm text-gray-600">Toplam: </span>
              <span className="font-semibold text-success-600">{products.length}</span>
            </div>
            {canCreate && (
              <SubscriptionGuard requiresActiveSubscription={true} actionName="Ürün ekleme">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="btn-modern bg-gradient-to-r from-success-600 to-success-700 text-white px-6 py-3 rounded-xl font-medium shadow-medium hover:shadow-strong transition-all duration-300 hover:scale-105"
                >
                  <span className="mr-2">➕</span>
                  Ürün Ekle
                </button>
              </SubscriptionGuard>
            )}
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white rounded-xl p-6 shadow-soft border border-gray-100">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-end">
          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kategori
            </label>
            <select
              value={filters.category_id}
              onChange={(e) => handleFilterChange('category_id', e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300"
            >
              <option value="">Tüm Kategoriler</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.Name}
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Arama
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-400">🔍</span>
              </div>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Ürün adı veya açıklama..."
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300"
              />
            </div>
          </div>

          {/* Clear Filters */}
          <div>
            <button
              onClick={clearFilters}
              className="w-full px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all duration-300"
            >
              Filtreleri Temizle
            </button>
          </div>

          {/* View Mode Toggle */}
          <div>
            <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 ${
                  viewMode === 'grid'
                    ? 'bg-white text-primary-600 shadow-soft'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <span className="mr-2">⊞</span>
                Kart
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 ${
                  viewMode === 'list'
                    ? 'bg-white text-primary-600 shadow-soft'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <span className="mr-2">☰</span>
                Liste
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {products.length === 0 ? (
        <div className="bg-white rounded-xl p-12 shadow-soft border border-gray-100 text-center">
          <div className="w-24 h-24 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl text-gray-400">📦</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {filters.category_id || filters.search 
              ? 'Filtrelere uygun ürün bulunamadı' 
              : 'Henüz ürün bulunmamaktadır'
            }
          </h3>
          <p className="text-gray-500 mb-6">
            {filters.category_id || filters.search
              ? 'Farklı filtreler ile tekrar deneyin'
              : 'İlk ürününüzü oluşturarak başlayın'
            }
          </p>
          {!filters.category_id && !filters.search && canCreate && (
            <SubscriptionGuard requiresActiveSubscription={true} actionName="Ürün oluşturma">
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-modern bg-gradient-to-r from-success-600 to-success-700 text-white px-6 py-3 rounded-xl font-medium shadow-medium hover:shadow-strong transition-all duration-300"
              >
                <span className="mr-2">➕</span>
                İlk Ürünü Oluştur
              </button>
            </SubscriptionGuard>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product, index) => (
            <div
              key={product.id}
              className="bg-white rounded-xl p-6 shadow-soft border border-gray-100 hover:shadow-medium transition-all duration-300 card-hover group"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-success-500 to-success-600 rounded-lg flex items-center justify-center shadow-soft group-hover:scale-110 transition-transform duration-300">
                  <span className="text-white text-xl">📦</span>
                </div>
                {(canUpdate || canDelete) && (
                  <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {canUpdate && (
                      <SubscriptionGuard requiresActiveSubscription={true} actionName="Ürün düzenleme">
                        <button
                          onClick={() => openEditModal(product)}
                          className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-300"
                          title="Düzenle"
                        >
                          <span className="text-sm">✏️</span>
                        </button>
                      </SubscriptionGuard>
                    )}
                    {canDelete && (
                      <SubscriptionGuard requiresActiveSubscription={true} actionName="Ürün silme" showTooltip={false}>
                        <button
                          onClick={() => handleDeleteProduct(product)}
                          className="p-2 text-gray-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-all duration-300"
                          title="Sil"
                        >
                          <span className="text-sm">🗑️</span>
                        </button>
                      </SubscriptionGuard>
                    )}
                  </div>
                )}
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-success-600 transition-colors duration-300">
                {product.name}
              </h3>
              
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {product.description || 'Açıklama bulunmamaktadır.'}
              </p>
              
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">Kategori:</span>
                  <span className={`bg-gradient-to-r ${getCategoryColor(product.Category_id)} text-white px-2 py-1 rounded-full text-xs font-medium shadow-soft`}>
                    {product.category?.Name || 'Kategori Yok'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ürün
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Açıklama
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kategori
                  </th>
                  {(canUpdate || canDelete) && (
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İşlemler
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product, index) => (
                  <tr 
                    key={product.id} 
                    className="hover:bg-gradient-to-r hover:from-gray-50 hover:to-white transition-all duration-300"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-r from-success-500 to-success-600 rounded-lg flex items-center justify-center mr-4 shadow-soft">
                          <span className="text-white">📦</span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600 max-w-xs truncate">
                        {product.description || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getCategoryColor(product.Category_id)} text-white shadow-soft`}>
                        {product.category?.Name || 'Kategori Yok'}
                      </span>
                    </td>
                    {(canUpdate || canDelete) && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          {canUpdate && (
                            <SubscriptionGuard requiresActiveSubscription={true} actionName="Ürün düzenleme">
                              <button
                                onClick={() => openEditModal(product)}
                                className="text-primary-600 hover:text-primary-900 hover:bg-primary-50 px-3 py-1 rounded-lg transition-all duration-300"
                              >
                                Düzenle
                              </button>
                            </SubscriptionGuard>
                          )}
                          {canDelete && (
                            <SubscriptionGuard requiresActiveSubscription={true} actionName="Ürün silme" showTooltip={false}>
                              <button
                                onClick={() => handleDeleteProduct(product)}
                                className="text-danger-600 hover:text-danger-900 hover:bg-danger-50 px-3 py-1 rounded-lg transition-all duration-300"
                              >
                                Sil
                              </button>
                            </SubscriptionGuard>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl shadow-strong max-w-md w-full mx-auto animate-modal-in">
            <div className="p-6">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-success-500 to-success-600 rounded-xl flex items-center justify-center mr-4 shadow-medium">
                  <span className="text-white text-xl">➕</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Yeni Ürün</h3>
              </div>
              
              <form onSubmit={handleCreateProduct} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ürün Adı *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300"
                    placeholder="Ürün adını girin"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kategori *
                  </label>
                  <select
                    required
                    value={formData.Category_id}
                    onChange={(e) => setFormData({ ...formData, Category_id: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300"
                  >
                    <option value="">Kategori Seçin</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.Name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Açıklama
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 resize-none"
                    placeholder="Ürün açıklaması (opsiyonel)"
                  />
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false)
                      setFormData({ name: '', description: '', Category_id: '' })
                    }}
                    className="px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all duration-300"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="btn-modern bg-gradient-to-r from-success-600 to-success-700 text-white px-6 py-3 rounded-xl font-medium shadow-medium hover:shadow-strong transition-all duration-300"
                  >
                    Oluştur
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl shadow-strong max-w-md w-full mx-auto animate-modal-in">
            <div className="p-6">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-warning-500 to-warning-600 rounded-xl flex items-center justify-center mr-4 shadow-medium">
                  <span className="text-white text-xl">✏️</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Ürün Düzenle</h3>
              </div>
              
              <form onSubmit={handleUpdateProduct} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ürün Adı *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300"
                    placeholder="Ürün adını girin"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kategori *
                  </label>
                  <select
                    required
                    value={formData.Category_id}
                    onChange={(e) => setFormData({ ...formData, Category_id: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300"
                  >
                    <option value="">Kategori Seçin</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.Name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Açıklama
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 resize-none"
                    placeholder="Ürün açıklaması (opsiyonel)"
                  />
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false)
                      setSelectedProduct(null)
                      setFormData({ name: '', description: '', Category_id: '' })
                    }}
                    className="px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all duration-300"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="btn-modern bg-gradient-to-r from-warning-600 to-warning-700 text-white px-6 py-3 rounded-xl font-medium shadow-medium hover:shadow-strong transition-all duration-300"
                  >
                    Güncelle
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductsPage 