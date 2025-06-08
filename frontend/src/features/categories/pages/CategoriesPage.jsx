import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import categoryService from '../services/categoryService'
import usePermissions from '../../../hooks/usePermissions'
import Toast from '../../../components/Toast'
import SubscriptionGuard from '../../../components/SubscriptionGuard'

const CategoriesPage = () => {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [formData, setFormData] = useState({ Name: '', Description: '' })
  const [toast, setToast] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'
  const { user } = useSelector((state) => state.auth)
  const { hasPermission } = usePermissions()

  // Yetki kontrolleri
  const canRead = user?.is_SuperAdmin || hasPermission('CATEGORY_READ')
  const canCreate = user?.is_SuperAdmin || hasPermission('CATEGORY_CREATE')
  const canUpdate = user?.is_SuperAdmin || hasPermission('CATEGORY_UPDATE')
  const canDelete = user?.is_SuperAdmin || hasPermission('CATEGORY_DELETE')

  useEffect(() => {
    if (canRead) {
      fetchCategories()
    } else {
      setLoading(false)
    }
  }, [canRead])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const response = await categoryService.getCategories()
      setCategories(response.categories || [])
    } catch (error) {
      console.error('Kategoriler yüklenirken hata:', error)
      setToast({
        type: 'error',
        message: 'Kategoriler yüklenirken bir hata oluştu.'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCategory = async (e) => {
    e.preventDefault()
    try {
      await categoryService.createCategory(formData)
      setToast({
        type: 'success',
        message: 'Kategori başarıyla oluşturuldu.'
      })
      setShowCreateModal(false)
      setFormData({ Name: '', Description: '' })
      fetchCategories()
    } catch (error) {
      console.error('Kategori oluşturma hatası:', error)
      setToast({
        type: 'error',
        message: error.response?.data?.message || 'Kategori oluşturulurken bir hata oluştu.'
      })
    }
  }

  const handleUpdateCategory = async (e) => {
    e.preventDefault()
    try {
      await categoryService.updateCategory(selectedCategory.id, formData)
      setToast({
        type: 'success',
        message: 'Kategori başarıyla güncellendi.'
      })
      setShowEditModal(false)
      setSelectedCategory(null)
      setFormData({ Name: '', Description: '' })
      fetchCategories()
    } catch (error) {
      console.error('Kategori güncelleme hatası:', error)
      setToast({
        type: 'error',
        message: error.response?.data?.message || 'Kategori güncellenirken bir hata oluştu.'
      })
    }
  }

  const handleDeleteCategory = async (category) => {
    if (!window.confirm(`"${category.Name}" kategorisini silmek istediğinizden emin misiniz?`)) {
      return
    }

    try {
      await categoryService.deleteCategory(category.id)
      setToast({
        type: 'success',
        message: 'Kategori başarıyla silindi.'
      })
      fetchCategories()
    } catch (error) {
      console.error('Kategori silme hatası:', error)
      setToast({
        type: 'error',
        message: error.response?.data?.message || 'Kategori silinirken bir hata oluştu.'
      })
    }
  }

  const openEditModal = (category) => {
    setSelectedCategory(category)
    setFormData({
      Name: category.Name,
      Description: category.Description || ''
    })
    setShowEditModal(true)
  }

  // Filtrelenmiş kategoriler
  const filteredCategories = categories.filter(category =>
    category.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.Description && category.Description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

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
              <span className="text-2xl">📂</span>
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
      <div className="bg-gradient-to-r from-white via-primary-50 to-white rounded-xl p-6 shadow-soft border border-primary-100">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-warning-500 to-warning-600 rounded-xl flex items-center justify-center shadow-medium">
              <span className="text-white text-2xl">📂</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Kategoriler
              </h1>
              <p className="text-gray-600 mt-1">
                Ürün kategorilerini yönetin ve organize edin
              </p>
            </div>
          </div>
          
          <div className="mt-4 lg:mt-0 flex items-center space-x-3">
            <div className="bg-white rounded-lg px-4 py-2 shadow-soft border border-gray-200">
              <span className="text-sm text-gray-600">Toplam: </span>
              <span className="font-semibold text-primary-600">{categories.length}</span>
            </div>
            {canCreate && (
              <SubscriptionGuard requiresActiveSubscription={true} actionName="Kategori ekleme">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="btn-modern bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-3 rounded-xl font-medium shadow-medium hover:shadow-strong transition-all duration-300 hover:scale-105"
                >
                  <span className="mr-2">➕</span>
                  Kategori Ekle
                </button>
              </SubscriptionGuard>
            )}
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white rounded-xl p-6 shadow-soft border border-gray-100">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400">🔍</span>
            </div>
            <input
              type="text"
              placeholder="Kategori ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300"
            />
          </div>

          {/* View Mode Toggle */}
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

      {/* Content */}
      {filteredCategories.length === 0 ? (
        <div className="bg-white rounded-xl p-12 shadow-soft border border-gray-100 text-center">
          <div className="w-24 h-24 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl text-gray-400">📂</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'Arama sonucu bulunamadı' : 'Henüz kategori bulunmamaktadır'}
          </h3>
          <p className="text-gray-500 mb-6">
            {searchTerm 
              ? 'Farklı anahtar kelimeler ile tekrar deneyin'
              : 'İlk kategorinizi oluşturarak başlayın'
            }
          </p>
          {!searchTerm && canCreate && (
            <SubscriptionGuard requiresActiveSubscription={true} actionName="Kategori oluşturma">
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-modern bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-3 rounded-xl font-medium shadow-medium hover:shadow-strong transition-all duration-300"
              >
                <span className="mr-2">➕</span>
                İlk Kategoriyi Oluştur
              </button>
            </SubscriptionGuard>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCategories.map((category, index) => (
            <div
              key={category.id}
              className="bg-white rounded-xl p-6 shadow-soft border border-gray-100 hover:shadow-medium transition-all duration-300 card-hover group"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-warning-500 to-warning-600 rounded-lg flex items-center justify-center shadow-soft group-hover:scale-110 transition-transform duration-300">
                  <span className="text-white text-xl">📂</span>
                </div>
                {(canUpdate || canDelete) && (
                  <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            {canUpdate && (
                          <SubscriptionGuard requiresActiveSubscription={true} actionName="Kategori düzenleme">
                            <button
                              onClick={() => openEditModal(category)}
                              className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-300"
                              title="Düzenle"
                            >
                              <span className="text-sm">✏️</span>
                            </button>
                          </SubscriptionGuard>
                        )}
                        {canDelete && (
                          <SubscriptionGuard requiresActiveSubscription={true} actionName="Kategori silme" showTooltip={false}>
                            <button
                              onClick={() => handleDeleteCategory(category)}
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
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors duration-300">
                {category.Name}
              </h3>
              
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {category.Description || 'Açıklama bulunmamaktadır.'}
              </p>
              
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">Ürün Sayısı:</span>
                  <span className="bg-gradient-to-r from-primary-100 to-primary-200 text-primary-700 px-2 py-1 rounded-full text-xs font-medium">
                    {category.productCount || 0}
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
                    Kategori
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Açıklama
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ürün Sayısı
                  </th>
                  {(canUpdate || canDelete) && (
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İşlemler
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCategories.map((category, index) => (
                  <tr 
                    key={category.id} 
                    className="hover:bg-gradient-to-r hover:from-gray-50 hover:to-white transition-all duration-300"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-r from-warning-500 to-warning-600 rounded-lg flex items-center justify-center mr-4 shadow-soft">
                          <span className="text-white">📂</span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{category.Name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600 max-w-xs truncate">
                        {category.Description || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="bg-gradient-to-r from-primary-100 to-primary-200 text-primary-700 px-3 py-1 rounded-full text-sm font-medium">
                        {category.productCount || 0}
                      </span>
                    </td>
                    {(canUpdate || canDelete) && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                                                      {canUpdate && (
                              <SubscriptionGuard requiresActiveSubscription={true} actionName="Kategori düzenleme">
                                <button
                                  onClick={() => openEditModal(category)}
                                  className="text-primary-600 hover:text-primary-900 hover:bg-primary-50 px-3 py-1 rounded-lg transition-all duration-300"
                                >
                                  Düzenle
                                </button>
                              </SubscriptionGuard>
                            )}
                            {canDelete && (
                              <SubscriptionGuard requiresActiveSubscription={true} actionName="Kategori silme" showTooltip={false}>
                                <button
                                  onClick={() => handleDeleteCategory(category)}
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
                <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl flex items-center justify-center mr-4 shadow-medium">
                  <span className="text-white text-xl">➕</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Yeni Kategori</h3>
              </div>
              
              <form onSubmit={handleCreateCategory} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kategori Adı *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.Name}
                    onChange={(e) => setFormData({ ...formData, Name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300"
                    placeholder="Kategori adını girin"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Açıklama
                  </label>
                  <textarea
                    value={formData.Description}
                    onChange={(e) => setFormData({ ...formData, Description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 resize-none"
                    placeholder="Kategori açıklaması (opsiyonel)"
                  />
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false)
                      setFormData({ Name: '', Description: '' })
                    }}
                    className="px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all duration-300"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="btn-modern bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-3 rounded-xl font-medium shadow-medium hover:shadow-strong transition-all duration-300"
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
      {showEditModal && selectedCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl shadow-strong max-w-md w-full mx-auto animate-modal-in">
            <div className="p-6">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-warning-500 to-warning-600 rounded-xl flex items-center justify-center mr-4 shadow-medium">
                  <span className="text-white text-xl">✏️</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Kategori Düzenle</h3>
              </div>
              
              <form onSubmit={handleUpdateCategory} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kategori Adı *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.Name}
                    onChange={(e) => setFormData({ ...formData, Name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300"
                    placeholder="Kategori adını girin"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Açıklama
                  </label>
                  <textarea
                    value={formData.Description}
                    onChange={(e) => setFormData({ ...formData, Description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 resize-none"
                    placeholder="Kategori açıklaması (opsiyonel)"
                  />
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false)
                      setSelectedCategory(null)
                      setFormData({ Name: '', Description: '' })
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

export default CategoriesPage 