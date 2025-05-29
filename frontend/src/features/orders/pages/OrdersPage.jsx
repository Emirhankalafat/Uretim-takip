import { useState, useEffect } from 'react'
import { useOrders } from '../hooks/useOrders'
import customerService from '../../customers/services/customerService'
import productService from '../../products/services/productService'
import Toast from '../../../components/Toast'

const OrdersPage = () => {
  const [orders, setOrders] = useState([])
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 })
  const [filters, setFilters] = useState({ search: '', status: '', customer_id: '' })
  const [toast, setToast] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [createFormData, setCreateFormData] = useState({
    customer_id: '',
    deadline: '',
    notes: '',
    priority: 'NORMAL',
    products: [],
    steps: []
  })
  const [productStepsTemplate, setProductStepsTemplate] = useState([])

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
    fetchProductStepsTemplate
  } = useOrders()

  useEffect(() => {
    if (canRead) {
      loadOrders()
      loadCustomers()
      loadProducts()
    }
  }, [canRead, filters])

  const loadOrders = async () => {
    const response = await fetchOrders(filters)
    if (response) {
      setOrders(response)
    }
  }

  const loadCustomers = async () => {
    try {
      const response = await customerService.getCustomers()
      setCustomers(response.customers || [])
    } catch (err) {
      console.error('Müşteriler yüklenemedi:', err)
    }
  }

  const loadProducts = async () => {
    try {
      const response = await productService.getProducts()
      setProducts(response.products || [])
    } catch (err) {
      console.error('Ürünler yüklenemedi:', err)
    }
  }

  const loadProductSteps = async (productId) => {
    if (!productId) return
    
    try {
      const stepsTemplate = await fetchProductStepsTemplate(productId)
      if (stepsTemplate && stepsTemplate.steps) {
        setProductStepsTemplate(stepsTemplate.steps)
        setCreateFormData(prev => ({
          ...prev,
          steps: stepsTemplate.steps.map(step => ({
            ...step,
            estimated_duration: step.estimated_duration || 60,
            notes: ''
          }))
        }))
      }
    } catch (err) {
      console.error('Ürün adımları yüklenemedi:', err)
    }
  }

  const handleCreateOrder = async (e) => {
    e.preventDefault()
    
    if (!createFormData.customer_id) {
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

    // Adım kontrolü - en az bir adım olmalı
    if (createFormData.steps.length === 0) {
      setToast({
        type: 'error',
        message: 'Lütfen en az bir sipariş adımı ekleyin.'
      })
      return
    }

    // Adım adı kontrolü
    const invalidSteps = createFormData.steps.filter(step => !step.step_name.trim())
    if (invalidSteps.length > 0) {
      setToast({
        type: 'error',
        message: 'Tüm adımların adı dolu olmalıdır.'
      })
      return
    }

    // Backend'in beklediği formata dönüştür
    const orderData = {
      Customer_id: createFormData.customer_id, // backend Customer_id bekliyor
      deadline: createFormData.deadline,
      notes: createFormData.notes,
      priority: createFormData.priority,
      products: createFormData.products,
      steps: createFormData.steps.map((step, index) => ({
        step_name: step.step_name,
        description: step.description || '',
        estimated_duration: step.estimated_duration || 60,
        notes: step.notes || '',
        order: index + 1,
        product_step_id: step.product_step_id || null
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
        products: [],
        steps: []
      })
      loadOrders()
    }
  }

  const addProduct = () => {
    setCreateFormData(prev => ({
      ...prev,
      products: [...prev.products, { product_id: '', quantity: 1 }]
    }))
  }

  const removeProduct = (index) => {
    setCreateFormData(prev => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index)
    }))
  }

  const updateProduct = (index, field, value) => {
    setCreateFormData(prev => ({
      ...prev,
      products: prev.products.map((product, i) => 
        i === index ? { ...product, [field]: value } : product
      )
    }))
  }

  // Sipariş adımı güncelleme
  const updateStep = (index, field, value) => {
    setCreateFormData(prev => ({
      ...prev,
      steps: prev.steps.map((step, i) => 
        i === index ? { ...step, [field]: value } : step
      )
    }))
  }

  // Adım ekleme
  const addStep = () => {
    setCreateFormData(prev => ({
      ...prev,
      steps: [...prev.steps, {
        product_step_id: '',
        step_name: '',
        description: '',
        estimated_duration: 60,
        notes: '',
        order: prev.steps.length + 1
      }]
    }))
  }

  // Adım silme
  const removeStep = (index) => {
    setCreateFormData(prev => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index).map((step, i) => ({
        ...step,
        order: i + 1
      }))
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
                onClick={() => setShowCreateModal(true)}
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
                onClick={() => setShowCreateModal(true)}
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
                        <div className="text-sm font-medium text-gray-900">
                          #{order.order_number}
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
                        <button className="text-primary-600 hover:text-primary-900 p-1">
                          👁️
                        </button>
                        {canUpdate && (
                          <button className="text-warning-600 hover:text-warning-900 p-1">
                            ✏️
                          </button>
                        )}
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
              {/* Customer Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Müşteri *
                </label>
                <select
                  value={createFormData.customer_id}
                  onChange={(e) => setCreateFormData(prev => ({ ...prev, customer_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                >
                  <option value="">Müşteri seçin...</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.Name}
                    </option>
                  ))}
                </select>
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
                  <button
                    type="button"
                    onClick={addProduct}
                    className="text-sm bg-primary-600 text-white px-3 py-1 rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    + Ürün Ekle
                  </button>
                </div>

                {createFormData.products.map((product, index) => (
                  <div key={index} className="flex items-center space-x-2 mb-2">
                    <select
                      value={product.product_id}
                      onChange={(e) => {
                        updateProduct(index, 'product_id', e.target.value)
                        loadProductSteps(e.target.value)
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
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Sipariş Adımları
                  </label>
                  <button
                    type="button"
                    onClick={addStep}
                    className="text-sm bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    + Adım Ekle
                  </button>
                </div>

                {createFormData.steps.length > 0 ? (
                  <div className="space-y-3">
                    {createFormData.steps.map((step, index) => (
                      <div key={index} className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-gray-700">
                            Adım {index + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeStep(index)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            🗑️ Sil
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
                              onChange={(e) => updateStep(index, 'step_name', e.target.value)}
                              placeholder="Adım adını girin..."
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-transparent"
                              required
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Tahmini Süre (dakika)
                            </label>
                            <input
                              type="number"
                              value={step.estimated_duration}
                              onChange={(e) => updateStep(index, 'estimated_duration', parseInt(e.target.value) || 60)}
                              min="1"
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                        
                        <div className="mt-3">
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Açıklama
                          </label>
                          <textarea
                            value={step.description}
                            onChange={(e) => updateStep(index, 'description', e.target.value)}
                            placeholder="Adım açıklaması..."
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-transparent"
                            rows="2"
                          />
                        </div>
                        
                        <div className="mt-3">
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Notlar
                          </label>
                          <textarea
                            value={step.notes}
                            onChange={(e) => updateStep(index, 'notes', e.target.value)}
                            placeholder="Bu adım için özel notlar..."
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-transparent"
                            rows="2"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                    <div className="text-2xl mb-2">📋</div>
                    <p className="text-sm">Henüz adım eklenmedi.</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Ürün seçtiğinizde otomatik adımlar yüklenecek veya manuel adım ekleyebilirsiniz.
                    </p>
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
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-primary-500 to-primary-600 text-white py-3 px-4 rounded-lg font-medium hover:from-primary-600 hover:to-primary-700 transition-all disabled:opacity-50"
                >
                  {loading ? 'Oluşturuluyor...' : 'Sipariş Oluştur'}
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