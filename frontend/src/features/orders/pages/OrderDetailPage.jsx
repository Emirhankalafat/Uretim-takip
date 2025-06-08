import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useOrders } from '../hooks/useOrders'
import Toast from '../../../components/Toast'

const OrderDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [toast, setToast] = useState(null)
  const [expandedSteps, setExpandedSteps] = useState(new Set())
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [updateFormData, setUpdateFormData] = useState({
    status: '',
    priority: '',
    deadline: '',
    notes: '',
    is_stock: false
  })

  const {
    loading,
    error,
    canRead,
    canUpdate,
    canDelete,
    fetchOrderById,
    updateOrder,
    deleteOrder
  } = useOrders()

  useEffect(() => {
    if (canRead && id) {
      loadOrder()
    }
  }, [canRead, id])

  const loadOrder = async () => {
    const orderData = await fetchOrderById(id)
    if (orderData) {
      setOrder(orderData)
      setUpdateFormData({
        status: orderData.status,
        priority: orderData.priority,
        deadline: orderData.deadline ? new Date(orderData.deadline).toISOString().split('T')[0] : '',
        notes: orderData.notes || '',
        is_stock: orderData.is_stock || false
      })
    }
  }

  const toggleStepExpansion = (stepId) => {
    const newExpanded = new Set(expandedSteps)
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId)
    } else {
      newExpanded.add(stepId)
    }
    setExpandedSteps(newExpanded)
  }

  const handleUpdateSubmit = async (e) => {
    e.preventDefault()
    const success = await updateOrder(id, updateFormData)
    if (success) {
      setToast({
        type: 'success',
        message: 'Sipariş başarıyla güncellendi.'
      })
      setShowUpdateModal(false)
      loadOrder()
    }
  }

  const handleDeleteOrder = async () => {
    if (!window.confirm(`${order.order_number} numaralı siparişi silmek istediğinizden emin misiniz?`)) {
      return
    }

    const success = await deleteOrder(id)
    if (success) {
      setToast({
        type: 'success',
        message: 'Sipariş başarıyla silindi.'
      })
      navigate('/orders')
    }
  }

  const getStatusInfo = (status) => {
    switch (status) {
      case 'PENDING':
        return {
          text: 'Bekliyor',
          color: 'bg-yellow-100 text-yellow-800',
          icon: '⏳'
        }
      case 'IN_PROGRESS':
        return {
          text: 'Devam Ediyor',
          color: 'bg-blue-100 text-blue-800',
          icon: '🔄'
        }
      case 'COMPLETED':
        return {
          text: 'Tamamlandı',
          color: 'bg-green-100 text-green-800',
          icon: '✅'
        }
      case 'CANCELLED':
        return {
          text: 'İptal Edildi',
          color: 'bg-red-100 text-red-800',
          icon: '❌'
        }
      default:
        return {
          text: status,
          color: 'bg-gray-100 text-gray-800',
          icon: '❓'
        }
    }
  }

  const getPriorityInfo = (priority) => {
    switch (priority) {
      case 'URGENT':
        return {
          text: 'Acil',
          color: 'from-red-500 to-red-600',
          icon: '🔥'
        }
      case 'HIGH':
        return {
          text: 'Yüksek',
          color: 'from-orange-500 to-orange-600',
          icon: '⚡'
        }
      case 'NORMAL':
        return {
          text: 'Normal',
          color: 'from-blue-500 to-blue-600',
          icon: '📋'
        }
      case 'LOW':
        return {
          text: 'Düşük',
          color: 'from-gray-500 to-gray-600',
          icon: '📝'
        }
      default:
        return {
          text: priority,
          color: 'from-blue-500 to-blue-600',
          icon: '📋'
        }
    }
  }

  const getStepStatusInfo = (status) => {
    switch (status) {
      case 'WAITING':
        return {
          text: 'Bekliyor',
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: '⏸️'
        }
      case 'IN_PROGRESS':
        return {
          text: 'Devam Ediyor',
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: '🔄'
        }
      case 'COMPLETED':
        return {
          text: 'Tamamlandı',
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: '✅'
        }
      case 'BLOCKED':
        return {
          text: 'Engellendi',
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: '🚫'
        }
      default:
        return {
          text: status,
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: '❓'
        }
    }
  }

  const groupStepsByProduct = (steps) => {
    const grouped = {}
    steps.forEach(step => {
      const productId = step.Product_id
      if (!grouped[productId]) {
        grouped[productId] = {
          product: step.product,
          steps: []
        }
      }
      grouped[productId].steps.push(step)
    })
    return grouped
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

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="flex items-center justify-center h-64">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-gray-900">Yükleniyor...</h3>
            <p className="text-sm text-gray-600">Sipariş detayları getiriliyor</p>
          </div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="animate-fade-in">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">❌</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Sipariş bulunamadı</h3>
          <p className="text-gray-600 mb-4">Aradığınız sipariş mevcut değil veya silinmiş olabilir.</p>
          <button 
            onClick={() => navigate('/orders')}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Siparişlere Geri Dön
          </button>
        </div>
      </div>
    )
  }

  const statusInfo = getStatusInfo(order.status)
  const priorityInfo = getPriorityInfo(order.priority)
  const groupedSteps = groupStepsByProduct(order.orderSteps || [])

  return (
    <div className="animate-fade-in space-y-6">
      {/* Toast */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-purple-600 rounded-xl shadow-soft p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => navigate('/orders')}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 p-2 rounded-lg transition-colors"
            >
              <span className="text-white text-xl">←</span>
            </button>
            <div>
              <h1 className="text-2xl font-bold">Sipariş Detayı</h1>
              <div className="flex items-center space-x-2 mt-1">
                <p className="text-blue-100">#{order.order_number}</p>
                {order.is_stock && (
                  <span className="text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded-full">
                    📦 Stok Üretimi
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {canUpdate && (
              <button 
                onClick={() => setShowUpdateModal(true)}
                className="bg-white text-primary-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors shadow-medium"
              >
                ✏️ Düzenle
              </button>
            )}
            {canDelete && (
              <button 
                onClick={handleDeleteOrder}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-medium"
              >
                🗑️ Sil
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Order Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* Status Card */}
        <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Durum</p>
              <div className="flex items-center mt-2">
                <span className="text-2xl mr-2">{statusInfo.icon}</span>
                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${statusInfo.color}`}>
                  {statusInfo.text}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Priority Card */}
        <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Öncelik</p>
              <div className="flex items-center mt-2">
                <span className="text-2xl mr-2">{priorityInfo.icon}</span>
                <span className={`px-3 py-1 text-sm font-semibold rounded-full text-white bg-gradient-to-r ${priorityInfo.color}`}>
                  {priorityInfo.text}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Card */}
        <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Müşteri</p>
              <div className="flex items-center mt-2">
                <span className="text-2xl mr-2">👤</span>
                <span className="text-lg font-semibold text-gray-900">
                  {order.customer?.Name}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Order Type Card */}
        <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Sipariş Tipi</p>
              <div className="flex items-center mt-2">
                <span className="text-2xl mr-2">{order.is_stock ? '📦' : '🛒'}</span>
                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                  order.is_stock 
                    ? 'bg-purple-100 text-purple-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {order.is_stock ? 'Stok Üretimi' : 'Müşteri Siparişi'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Steps Progress Card */}
        <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Adımlar</p>
              <div className="flex items-center mt-2">
                <span className="text-2xl mr-2">📊</span>
                <span className="text-lg font-semibold text-gray-900">
                  {order.orderSteps?.filter(step => step.status === 'COMPLETED').length || 0} / {order.orderSteps?.length || 0}
                </span>
              </div>
              <div className="mt-2 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${order.orderSteps?.length > 0 ? (order.orderSteps.filter(step => step.status === 'COMPLETED').length / order.orderSteps.length) * 100 : 0}%`
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Order Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="mr-2">📋</span>
              Sipariş Bilgileri
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Sipariş Numarası</label>
                <p className="text-gray-900 font-mono">{order.order_number}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Oluşturulma Tarihi</label>
                <p className="text-gray-900">{new Date(order.created_at).toLocaleString('tr-TR')}</p>
              </div>
              {order.deadline && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Termin Tarihi</label>
                  <p className="text-gray-900 flex items-center">
                    <span className="mr-1">📅</span>
                    {new Date(order.deadline).toLocaleDateString('tr-TR')}
                  </p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Son Güncelleme</label>
                <p className="text-gray-900">{new Date(order.updated_at).toLocaleString('tr-TR')}</p>
              </div>
            </div>
            {order.notes && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-600 mb-1">Notlar</label>
                <p className="text-gray-900 bg-gray-50 rounded-lg p-3">{order.notes}</p>
              </div>
            )}
          </div>

          {/* Order Steps */}
          <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="mr-2">🔄</span>
              Sipariş Adımları
            </h3>
            
            {Object.keys(groupedSteps).length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📝</span>
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">Henüz adım yok</h4>
                <p className="text-gray-600">Bu sipariş için henüz adım tanımlanmamış.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedSteps).map(([productId, productData]) => (
                  <div key={productId} className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* Product Header */}
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="text-xl mr-2">📦</span>
                          <h4 className="font-semibold text-gray-900">{productData.product.name}</h4>
                          {(() => {
                            // Bu ürün için order item'dan quantity bilgisini al
                            const orderItem = order.orderItems?.find(item => 
                              item.Product_id === productData.product.id
                            );
                            return orderItem?.quantity && (
                              <span className="ml-2 px-2 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded-full">
                                {orderItem.quantity} adet
                              </span>
                            );
                          })()}
                        </div>
                        <div className="text-sm text-gray-600">
                          {productData.steps.filter(step => step.status === 'COMPLETED').length} / {productData.steps.length} tamamlandı
                        </div>
                      </div>
                      {productData.product.description && (
                        <p className="text-sm text-gray-600 mt-1">{productData.product.description}</p>
                      )}
                    </div>

                    {/* Product Steps */}
                    <div className="divide-y divide-gray-200">
                      {productData.steps
                        .sort((a, b) => a.step_number - b.step_number)
                        .map((step, index) => {
                          const stepStatusInfo = getStepStatusInfo(step.status)
                          const isExpanded = expandedSteps.has(step.id)
                          
                          return (
                            <div key={step.id} className="p-4">
                              <div 
                                className="flex items-center justify-between cursor-pointer"
                                onClick={() => toggleStepExpansion(step.id)}
                              >
                                <div className="flex items-center space-x-3">
                                  <div className="flex-shrink-0">
                                    <div className={`w-8 h-8 rounded-full border-2 ${stepStatusInfo.color} flex items-center justify-center text-sm font-medium`}>
                                      {index + 1}
                                    </div>
                                  </div>
                                  <div>
                                    <h5 className="font-medium text-gray-900">{step.step_name}</h5>
                                    <div className="flex items-center mt-1">
                                      <span className="text-sm mr-2">{stepStatusInfo.icon}</span>
                                      <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${stepStatusInfo.color}`}>
                                        {stepStatusInfo.text}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  {step.assignedUser && (
                                    <div className="text-sm text-gray-600">
                                      👤 {step.assignedUser.Name}
                                    </div>
                                  )}
                                  <span className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                                    ▼
                                  </span>
                                </div>
                              </div>

                              {isExpanded && (
                                <div className="mt-4 pl-11 space-y-2">
                                  {step.step_description && (
                                    <div>
                                      <label className="block text-xs font-medium text-gray-600 mb-1">Açıklama</label>
                                      <p className="text-sm text-gray-700 bg-gray-50 rounded p-2">
                                        {step.step_description}
                                      </p>
                                    </div>
                                  )}
                                  {step.notes && (
                                    <div>
                                      <label className="block text-xs font-medium text-gray-600 mb-1">Notlar</label>
                                      <p className="text-sm text-gray-700 bg-yellow-50 rounded p-2">{step.notes}</p>
                                    </div>
                                  )}
                                  <div className="grid grid-cols-2 gap-4 text-xs">
                                    <div>
                                      <label className="block font-medium text-gray-600">Başlangıç</label>
                                      <p className="text-gray-700">
                                        {step.started_at ? new Date(step.started_at).toLocaleString('tr-TR') : 'Henüz başlanmadı'}
                                      </p>
                                    </div>
                                    <div>
                                      <label className="block font-medium text-gray-600">Bitiş</label>
                                      <p className="text-gray-700">
                                        {step.completed_at ? new Date(step.completed_at).toLocaleString('tr-TR') : 'Henüz tamamlanmadı'}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Details */}
          <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="mr-2">👤</span>
              Müşteri Detayları
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Müşteri Adı</label>
                <p className="text-gray-900">{order.customer?.Name}</p>
              </div>
              {order.customer?.email && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">E-posta</label>
                  <p className="text-gray-900">{order.customer.email}</p>
                </div>
              )}
              {order.customer?.phone && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Telefon</label>
                  <p className="text-gray-900">{order.customer.phone}</p>
                </div>
              )}
              {order.customer?.address && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Adres</label>
                  <p className="text-gray-900 text-sm">{order.customer.address}</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="mr-2">📈</span>
              İstatistikler
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Toplam Adım</span>
                <span className="font-semibold text-gray-900">{order.orderSteps?.length || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Tamamlanan</span>
                <span className="font-semibold text-green-600">
                  {order.orderSteps?.filter(step => step.status === 'COMPLETED').length || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Devam Eden</span>
                <span className="font-semibold text-blue-600">
                  {order.orderSteps?.filter(step => step.status === 'IN_PROGRESS').length || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Bekleyen</span>
                <span className="font-semibold text-yellow-600">
                  {order.orderSteps?.filter(step => step.status === 'WAITING').length || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Engellenen</span>
                <span className="font-semibold text-red-600">
                  {order.orderSteps?.filter(step => step.status === 'BLOCKED').length || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Products List */}
          <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="mr-2">📦</span>
              Ürünler
            </h3>
            <div className="space-y-3">
              {Object.entries(groupedSteps).map(([productId, productData]) => (
                <div key={productId} className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900">{productData.product.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {productData.steps.length} adım
                  </p>
                  <div className="mt-2 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${productData.steps.length > 0 ? (productData.steps.filter(step => step.status === 'COMPLETED').length / productData.steps.length) * 100 : 0}%`
                      }}
                    ></div>
                  </div>
                </div>
              ))}
              {Object.keys(groupedSteps).length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">Henüz ürün yok</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Update Modal */}
      {showUpdateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sipariş Güncelle</h3>
            
            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
                <select
                  value={updateFormData.status}
                  onChange={(e) => setUpdateFormData(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="PENDING">Bekliyor</option>
                  <option value="IN_PROGRESS">Devam Ediyor</option>
                  <option value="COMPLETED">Tamamlandı</option>
                  <option value="CANCELLED">İptal Edildi</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Öncelik</label>
                <select
                  value={updateFormData.priority}
                  onChange={(e) => setUpdateFormData(prev => ({ ...prev, priority: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="LOW">Düşük</option>
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">Yüksek</option>
                  <option value="URGENT">Acil</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Termin Tarihi</label>
                <input
                  type="date"
                  value={updateFormData.deadline}
                  onChange={(e) => setUpdateFormData(prev => ({ ...prev, deadline: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={updateFormData.is_stock}
                    onChange={(e) => setUpdateFormData(prev => ({ ...prev, is_stock: e.target.checked }))}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Stok Üretimi
                  </span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notlar</label>
                <textarea
                  value={updateFormData.notes}
                  onChange={(e) => setUpdateFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Sipariş notları..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows="3"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowUpdateModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-400 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-primary-500 to-primary-600 text-white py-2 px-4 rounded-lg font-medium hover:from-primary-600 hover:to-primary-700 transition-all disabled:opacity-50"
                >
                  {loading ? 'Güncelleniyor...' : 'Güncelle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default OrderDetailPage 