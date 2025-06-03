import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOrders } from '../hooks/useOrders'
import customerService from '../../customers/services/customerService'
import productService from '../../products/services/productService'
import userService from '../../users/services/userService'
import usePermissions from '../../../hooks/usePermissions'
import Toast from '../../../components/Toast'
import { useSelector } from 'react-redux'

const OrdersPage = () => {
  const [orders, setOrders] = useState([])
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 })
  const [filters, setFilters] = useState({ search: '', status: '', customer_id: '' })
  const [toast, setToast] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [users, setUsers] = useState([])
  const [createFormData, setCreateFormData] = useState({
    customer_id: '',
    deadline: '',
    notes: '',
    priority: 'NORMAL',
    is_stock: false,
    products: [] // Her product'ın kendi steps array'i olacak
  })

  const {
    loading,
    error,
    setError,
    canRead,
    canCreate,
    canUpdate,
    canDelete,
    fetchOrders,
    createOrder,
    deleteOrder,
    fetchProductStepsTemplate,
    checkOrderCreationPermissions
  } = useOrders()

  const { hasPermission } = usePermissions()
  const navigate = useNavigate()

  const user = useSelector((state) => state.auth.user);
  const isSuperAdmin = user?.is_SuperAdmin;

  // Yetki kontrolü - sadece create yetkisi varken müşteri ve ürün listelerini çek
  const canReadCustomers = isSuperAdmin || hasPermission('CUSTOMER_READ')
  const canReadProducts = isSuperAdmin || hasPermission('PRODUCT_READ')

  useEffect(() => {
    if (canRead) {
      loadOrders()
      // Yalnızca sipariş oluşturma yetkisi varken ve gerekli yetkilere sahipse listeleri yükle
      if (canCreate) {
        if (canReadCustomers) {
          loadCustomers()
        }
        if (canReadProducts) {
          loadProducts()
        }
        loadUsers()
      }
    }
  }, [canRead, canCreate, canReadCustomers, canReadProducts, filters])

  const loadOrders = async () => {
    const response = await fetchOrders(filters)
    if (response) {
      setOrders(response)
    }
  }

  const loadCustomers = async () => {
    try {
      const response = await customerService.getCustomers()
      const customers = response.customers || []
      setCustomers(customers)
      
      // Eğer müşteri listesi boşsa ve hata mesajı varsa kullanıcıya bildir
      if (customers.length === 0) {
        if (response.message?.includes('atanmış sipariş adımı')) {
          setToast({
            type: 'info',
            message: 'Size atanmış sipariş adımı bulunmuyor. Yeni sipariş oluşturmak için yöneticinizle iletişime geçin.'
          })
        } else if (response.message?.includes('sipariş bulunmuyor')) {
          setToast({
            type: 'info',
            message: 'Henüz hiç sipariş oluşturulmamış.'
          })
        }
      }
    } catch (err) {
      console.error('Müşteriler yüklenemedi:', err)
      
      // 403 hatası alınırsa daha açıklayıcı bir mesaj göster
      if (err.response?.status === 403) {
        setToast({
          type: 'warning',
          message: 'Müşteri listesine erişim yetkiniz bulunmuyor.'
        })
      } else {
        setToast({
          type: 'error',
          message: 'Müşteriler yüklenirken bir hata oluştu.'
        })
      }
    }
  }

  const loadProducts = async () => {
    try {
      const response = await productService.getProducts()
      setProducts(response.products || [])
    } catch (err) {
      console.error('Ürünler yüklenemedi:', err)
      
      // 403 hatası alınırsa daha açıklayıcı bir mesaj göster
      if (err.response?.status === 403) {
        setToast({
          type: 'warning',
          message: 'Ürün listesine erişim yetkiniz bulunmuyor.'
        })
      } else {
        setToast({
          type: 'error',
          message: 'Ürünler yüklenirken bir hata oluştu.'
        })
      }
    }
  }

  const loadUsers = async () => {
    try {
      const response = await userService.getSimpleUsers()
      setUsers(response.data?.users || [])
    } catch (err) {
      console.error('Kullanıcılar yüklenemedi:', err)
    }
  }

  // Ürün seçildiğinde o ürünün adımlarını yükle
  const loadProductSteps = async (productId) => {
    if (!productId) return []
    
    try {
      const response = await fetchProductStepsTemplate(productId)
      if (response && response.stepsTemplate) {
        return response.stepsTemplate.map(step => ({
          id: step.id,
          step_name: step.step_name,
          step_description: step.step_description || '',
          step_number: step.step_number,
          assigned_user: step.assigned_user || '',
          isFromProduct: true,
          isEditable: true
        }))
      }
      return []
    } catch (err) {
      console.error('Ürün adımları yüklenemedi:', err)
      return []
    }
  }

  const handleCreateOrder = async (e) => {
    e.preventDefault()
    
    if (!createFormData.is_stock && !createFormData.customer_id) {
      setToast({
        type: 'error',
        message: 'Lütfen bir müşteri seçin.'
      })
      return
    }

    if (createFormData.products.length === 0) {
      setToast({
        type: 'error',
        message: 'Lütfen en az bir ürün ekleyin.'
      })
      return
    }

    // Backend'in beklediği formata dönüştür
    const orderData = {
      Customer_id: createFormData.is_stock ? undefined : createFormData.customer_id,
      deadline: createFormData.deadline,
      notes: createFormData.notes,
      priority: createFormData.priority,
      is_stock: createFormData.is_stock,
      products: createFormData.products.map(product => ({
        product_id: product.product_id,
        quantity: product.quantity,
        customSteps: product.steps ? product.steps.map(step => ({
          step_name: step.step_name,
          step_description: step.step_description,
          step_number: step.step_number,
          assigned_user: step.assigned_user || null
        })) : []
      }))
    }

    const success = await createOrder(orderData)
    if (success) {
      setToast({
        type: 'success',
        message: 'Sipariş başarıyla oluşturuldu.'
      })
      setShowCreateModal(false)
      setCreateFormData({
        customer_id: '',
        deadline: '',
        notes: '',
        priority: 'NORMAL',
        is_stock: false,
        products: []
      })
      loadOrders()
    }
  }

  const addProduct = () => {
    setCreateFormData(prev => ({
      ...prev,
      products: [...prev.products, { 
        product_id: '', 
        quantity: 1,
        steps: []
      }]
    }))
  }

  const removeProduct = (index) => {
    setCreateFormData(prev => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index)
    }))
  }

  const updateProduct = async (index, field, value) => {
    if (field === 'product_id') {
      // Ürün değiştiğinde o ürünün adımlarını yükle
      const productSteps = await loadProductSteps(value)
      
      setCreateFormData(prev => ({
        ...prev,
        products: prev.products.map((product, i) => 
          i === index ? { 
            ...product, 
            [field]: value,
            steps: productSteps // Ürünün adımlarını set et
          } : product
        )
      }))
    } else {
      setCreateFormData(prev => ({
        ...prev,
        products: prev.products.map((product, i) => 
          i === index ? { ...product, [field]: value } : product
        )
      }))
    }
  }

  // Belirli bir ürüne manuel adım ekleme
  const addManualStepToProduct = (productIndex) => {
    const newStep = {
      id: `manual_${Date.now()}`,
      step_name: '',
      step_description: '',
      step_number: createFormData.products[productIndex].steps.length + 1,
      assigned_user: '',
      isFromProduct: false,
      isEditable: true
    }
    
    setCreateFormData(prev => ({
      ...prev,
      products: prev.products.map((product, i) => 
        i === productIndex ? {
          ...product,
          steps: [...product.steps, newStep]
        } : product
      )
    }))
  }

  // Belirli bir ürünün adımını güncelleme
  const updateProductStep = (productIndex, stepId, field, value) => {
    setCreateFormData(prev => ({
      ...prev,
      products: prev.products.map((product, i) => 
        i === productIndex ? {
          ...product,
          steps: product.steps.map(step => 
            step.id === stepId ? { ...step, [field]: value } : step
          )
        } : product
      )
    }))
  }

  // Belirli bir ürünün adımını silme
  const removeProductStep = (productIndex, stepId) => {
    setCreateFormData(prev => ({
      ...prev,
      products: prev.products.map((product, i) => 
        i === productIndex ? {
          ...product,
          steps: product.steps.filter(step => step.id !== stepId)
            .map((step, index) => ({ ...step, step_number: index + 1 }))
        } : product
      )
    }))
  }

  const handleDeleteOrder = async (id, orderNumber) => {
    if (!window.confirm(`${orderNumber} numaralı siparişi silmek istediğinizden emin misiniz?`)) {
      return
    }

    const success = await deleteOrder(id)
    if (success) {
      setToast({
        type: 'success',
        message: 'Sipariş başarıyla silindi.'
      })
      loadOrders()
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800'
      case 'COMPLETED': return 'bg-green-100 text-green-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'URGENT': return 'from-red-500 to-red-600'
      case 'HIGH': return 'from-orange-500 to-orange-600'
      case 'NORMAL': return 'from-blue-500 to-blue-600'
      case 'LOW': return 'from-gray-500 to-gray-600'
      default: return 'from-blue-500 to-blue-600'
    }
  }

  // Sipariş oluşturma modal'ını açmadan önce yetki kontrolü yap
  const handleCreateOrderButtonClick = () => {
    if (!canCreate) {
      setToast({
        type: 'error',
        message: 'Sipariş oluşturma yetkiniz bulunmuyor.'
      })
      return
    }

    const permissionCheck = checkOrderCreationPermissions()
    
    if (!permissionCheck.hasRequiredPermissions) {
      setToast({
        type: 'warning',
        message: permissionCheck.message
      })
      return
    }

    setShowCreateModal(true)
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
              <h3 className="text-lg font-semibold text-danger-800">Erişim Reddedildi</h3>
              <p className="mt-1 text-sm text-danger-700">
                Bu sayfayı görüntülemek için gerekli yetkiniz bulunmamaktadır.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-purple-600 rounded-xl shadow-soft p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Siparişler</h1>
            <p className="text-blue-100 mt-1">Sipariş yönetimi ve takibi</p>
          </div>
          <div className="flex items-center space-x-4">
            {canCreate && (
              <button 
                onClick={handleCreateOrderButtonClick}
                className="bg-white text-primary-600 px-6 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors shadow-medium"
              >
                + Yeni Sipariş
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Arama</label>
            <input
              type="text"
              placeholder="Sipariş numarası veya not..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Durum</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Tüm Durumlar</option>
              <option value="PENDING">Bekliyor</option>
              <option value="IN_PROGRESS">Devam Ediyor</option>
              <option value="COMPLETED">Tamamlandı</option>
              <option value="CANCELLED">İptal Edildi</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Yükleniyor...</h3>
              <p className="text-sm text-gray-600">Siparişler getiriliyor</p>
            </div>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📋</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Sipariş bulunamadı</h3>
            <p className="text-gray-600">Henüz sipariş oluşturulmamış veya filtrelere uygun sipariş yok.</p>
            {canCreate && (
              <button 
                onClick={handleCreateOrderButtonClick}
                className="mt-4 bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
              >
                İlk Siparişi Oluştur
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sipariş
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Müşteri
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Adım Sayısı
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Oluşturulma
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900">
                            #{order.order_number}
                          </span>
                          {order.is_stock && (
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                              📦 Stok
                            </span>
                          )}
                          {order.notes && (
                            <span className="ml-2 px-2 py-1 bg-yellow-50 text-yellow-800 rounded text-xs max-w-xs truncate" title={order.notes}>{order.notes}</span>
                          )}
                        </div>
                        {order.deadline && (
                          <div className="text-sm text-gray-500">
                            📅 {new Date(order.deadline).toLocaleDateString('tr-TR')}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{order.customer?.Name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                        {order.status === 'PENDING' ? 'Bekliyor' :
                         order.status === 'IN_PROGRESS' ? 'Devam Ediyor' :
                         order.status === 'COMPLETED' ? 'Tamamlandı' : 'İptal Edildi'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order._count?.orderSteps || 0} adım
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button className="text-primary-600 hover:text-primary-900 p-1" onClick={() => navigate(`/orders/${order.id}`)}>
                          👁️
                        </button>
                        {canDelete && (
                          <button 
                            onClick={() => handleDeleteOrder(order.id, order.order_number)}
                            className="text-danger-600 hover:text-danger-900 p-1"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Order Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Yeni Sipariş Oluştur</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateOrder} className="p-6 space-y-6">
              {/* Customer */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Müşteri *
                </label>
                {!canReadCustomers && !isSuperAdmin ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <span className="text-yellow-400">⚠️</span>
                      </div>
                      <div className="ml-2">
                        <p className="text-sm text-yellow-800">
                          <strong>Müşteri Okuma Yetkisi Gerekli</strong>
                        </p>
                        <p className="text-xs text-yellow-700 mt-1">
                          Sipariş oluşturabilmek için CUSTOMER_READ yetkisine ihtiyacınız var. 
                          Yöneticinizle iletişime geçin.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : customers.length === 0 ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <span className="text-blue-400">ℹ️</span>
                      </div>
                      <div className="ml-2">
                        <p className="text-sm text-blue-800">
                          Henüz müşteri bulunmuyor
                        </p>
                        <p className="text-xs text-blue-700 mt-1">
                          Önce müşteri eklemeniz gerekiyor.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <select
                    value={createFormData.customer_id}
                    onChange={(e) => setCreateFormData(prev => ({ ...prev, customer_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required={!createFormData.is_stock}
                    disabled={createFormData.is_stock}
                  >
                    <option value="">Müşteri seçin...</option>
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.id}>
                        {customer.Name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Stock Order */}
              <div>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={createFormData.is_stock}
                    onChange={(e) => setCreateFormData(prev => ({ ...prev, is_stock: e.target.checked }))}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Stok Üretimi
                  </span>
                  <span className="text-xs text-gray-500">
                    (Bu sipariş müşteri için değil, stok için üretim)
                  </span>
                </label>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Öncelik
                </label>
                <select
                  value={createFormData.priority}
                  onChange={(e) => setCreateFormData(prev => ({ ...prev, priority: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="LOW">Düşük</option>
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">Yüksek</option>
                  <option value="URGENT">Acil</option>
                </select>
              </div>

              {/* Deadline */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teslim Tarihi
                </label>
                <input
                  type="date"
                  value={createFormData.deadline}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setCreateFormData(prev => ({ ...prev, deadline: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Products */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Ürünler *
                  </label>
                  {canReadProducts || isSuperAdmin ? (
                    <button
                      type="button"
                      onClick={addProduct}
                      className="text-sm bg-primary-600 text-white px-3 py-1 rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      + Ürün Ekle
                    </button>
                  ) : null}
                </div>

                {!canReadProducts && !isSuperAdmin ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <span className="text-yellow-400">⚠️</span>
                      </div>
                      <div className="ml-2">
                        <p className="text-sm text-yellow-800">
                          <strong>Ürün Okuma Yetkisi Gerekli</strong>
                        </p>
                        <p className="text-xs text-yellow-700 mt-1">
                          Sipariş oluşturabilmek için PRODUCT_READ yetkisine ihtiyacınız var. 
                          Yöneticinizle iletişime geçin.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : products.length === 0 ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <span className="text-blue-400">ℹ️</span>
                      </div>
                      <div className="ml-2">
                        <p className="text-sm text-blue-800">
                          Henüz ürün bulunmuyor
                        </p>
                        <p className="text-xs text-blue-700 mt-1">
                          Önce ürün eklemeniz gerekiyor.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {createFormData.products.map((product, index) => (
                      <div key={index} className="flex items-center space-x-2 mb-2">
                        <select
                          value={product.product_id}
                          onChange={(e) => {
                            updateProduct(index, 'product_id', e.target.value)
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          required
                        >
                          <option value="">Ürün seçin...</option>
                          {products.map(prod => (
                            <option key={prod.id} value={prod.id}>
                              {prod.name}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          placeholder="Adet"
                          min="1"
                          value={product.quantity}
                          onChange={(e) => updateProduct(index, 'quantity', parseInt(e.target.value) || 1)}
                          className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => removeProduct(index)}
                          className="text-red-600 hover:text-red-800 p-2"
                        >
                          🗑️
                        </button>
                      </div>
                    ))}

                    {createFormData.products.length === 0 && (
                      <div className="text-center py-4 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                        Henüz ürün eklenmedi. "Ürün Ekle" butonuna tıklayın.
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notlar
                </label>
                <textarea
                  value={createFormData.notes}
                  onChange={(e) => setCreateFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Sipariş ile ilgili notlar..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows="3"
                />
              </div>

              {/* Order Steps */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Sipariş Adımları
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      Her ürün için ayrı adımlar oluşturulur. Ürün seçtiğinizde otomatik adımlar yüklenir.
                    </p>
                  </div>
                </div>

                {createFormData.products.length > 0 ? (
                  <div className="space-y-6">
                    {createFormData.products.map((product, productIndex) => {
                      const selectedProduct = products.find(p => p.id === product.product_id);
                      
                      return (
                        <div key={productIndex} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <span className="text-lg font-semibold text-gray-800">
                                📦 {selectedProduct?.name || 'Ürün Seçilmedi'}
                              </span>
                              <span className="text-sm text-gray-500">
                                ({product.quantity} adet)
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => addManualStepToProduct(productIndex)}
                              className="text-sm bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition-colors"
                            >
                              + Adım Ekle
                            </button>
                          </div>

                          {product.steps && product.steps.length > 0 ? (
                            <div className="space-y-3">
                              {product.steps.map((step, stepIndex) => (
                                <div key={step.id} className={`border rounded-lg p-3 ${
                                  step.isFromProduct 
                                    ? 'bg-blue-50 border-blue-200' 
                                    : 'bg-white border-gray-300'
                                }`}>
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center space-x-2">
                                      <span className="text-sm font-medium text-gray-700">
                                        Adım {step.step_number}
                                      </span>
                                      {step.isFromProduct ? (
                                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                          📋 Şablon
                                        </span>
                                      ) : (
                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                          ✏️ Manuel
                                        </span>
                                      )}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => removeProductStep(productIndex, step.id)}
                                      className="text-red-600 hover:text-red-800 text-sm"
                                      title="Adımı sil"
                                    >
                                      🗑️
                                    </button>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                      <label className="block text-xs font-medium text-gray-600 mb-1">
                                        Adım Adı *
                                      </label>
                                      <input
                                        type="text"
                                        value={step.step_name}
                                        onChange={(e) => updateProductStep(productIndex, step.id, 'step_name', e.target.value)}
                                        placeholder="Adım adını girin..."
                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-transparent"
                                        required
                                      />
                                    </div>
                                    
                                    <div>
                                      <label className="block text-xs font-medium text-gray-600 mb-1">
                                        Atanan Kullanıcı
                                      </label>
                                      <select
                                        value={step.assigned_user}
                                        onChange={(e) => updateProductStep(productIndex, step.id, 'assigned_user', e.target.value)}
                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-transparent"
                                      >
                                        <option value="">Kullanıcı seçin...</option>
                                        {users.map(user => (
                                          <option key={user.id} value={user.id}>
                                            {user.Name}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                  </div>
                                  
                                  <div className="mt-3">
                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                      Açıklama
                                    </label>
                                    <textarea
                                      value={step.step_description}
                                      onChange={(e) => updateProductStep(productIndex, step.id, 'step_description', e.target.value)}
                                      placeholder="Adım açıklaması..."
                                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-transparent"
                                      rows="2"
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-6 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                              <div className="text-xl mb-2">📋</div>
                              <p className="text-sm">Bu ürün için henüz adım yok</p>
                              <p className="text-xs text-gray-400 mt-1">
                                {selectedProduct ? 'Ürün şablonunda adım bulunamadı' : 'Önce ürün seçin'}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                    <div className="text-3xl mb-3">📦</div>
                    <h3 className="text-sm font-medium text-gray-900 mb-1">Henüz ürün eklenmedi</h3>
                    <p className="text-xs text-gray-500 mb-4">
                      Ürün ekleyince her ürün için ayrı adımlar görüntülenir
                    </p>
                    <div className="space-y-2">
                      <p className="text-xs text-gray-400">
                        💡 Ürün ekle → Otomatik adımlar gelir
                      </p>
                      <p className="text-xs text-gray-400">
                        ✏️ Her ürün → Kendi adımları
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-400 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={loading || !canReadCustomers || !canReadProducts}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                    loading || !canReadCustomers || !canReadProducts
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700'
                  }`}
                  title={!canReadCustomers || !canReadProducts ? 'Eksik yetkiler nedeniyle sipariş oluşturulamaz' : ''}
                >
                  {loading ? 'Oluşturuluyor...' : !canReadCustomers || !canReadProducts ? 'Yetkiler Eksik' : 'Sipariş Oluştur'}
                </button>
              </div>
            </form>
          </div>
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

      {/* Error */}
      {error && (
        <Toast
          type="error"
          message={error}
          onClose={() => setError(null)}
        />
      )}
    </div>
  )
}

export default OrdersPage 