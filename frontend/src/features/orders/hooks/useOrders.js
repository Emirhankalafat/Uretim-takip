import { useState } from 'react'
import { useSelector } from 'react-redux'
import orderService from '../services/orderService'
import usePermissions from '../../../hooks/usePermissions'

export const useOrders = () => {
  const { user } = useSelector((state) => state.auth)
  const { hasPermission } = usePermissions()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Permission kontrolü
  const checkPermission = (permissionName) => {
    if (!user) return false
    if (user.is_SuperAdmin) return true
    return hasPermission(permissionName)
  }

  const canRead = checkPermission('ORDER_READ')
  const canCreate = checkPermission('ORDER_CREATE')
  const canUpdate = checkPermission('ORDER_UPDATE')
  const canDelete = checkPermission('ORDER_DELETE')

  // Sipariş oluşturma için gerekli yetkileri kontrol et
  const checkOrderCreationPermissions = () => {
    const hasCustomerRead = checkPermission('CUSTOMER_READ')
    const hasProductRead = checkPermission('PRODUCT_READ')
    
    const missingPermissions = []
    if (!hasCustomerRead) missingPermissions.push('Müşteri Okuma (CUSTOMER_READ)')
    if (!hasProductRead) missingPermissions.push('Ürün Okuma (PRODUCT_READ)')
    
    return {
      canCreateOrder: canCreate,
      hasRequiredPermissions: missingPermissions.length === 0,
      missingPermissions,
      message: missingPermissions.length > 0 
        ? `Sipariş oluşturabilmek için aşağıdaki yetkilere ihtiyacınız var:\n• ${missingPermissions.join('\n• ')}\n\nYöneticinizle iletişime geçin.`
        : null
    }
  }

  // Siparişleri getir
  const fetchOrders = async (params = {}) => {
    if (!canRead) {
      setError('Bu işlem için yetkiniz bulunmuyor.')
      return []
    }

    setLoading(true)
    setError(null)
    try {
      const response = await orderService.getOrders(params)
      return response.orders || []
    } catch (err) {
      setError(err.response?.data?.message || 'Siparişler getirilirken bir hata oluştu.')
      return []
    } finally {
      setLoading(false)
    }
  }

  // Tek sipariş getir
  const fetchOrderById = async (id) => {
    if (!canRead) {
      setError('Bu işlem için yetkiniz bulunmuyor.')
      return null
    }

    setLoading(true)
    setError(null)
    try {
      const response = await orderService.getOrderById(id)
      return response.order
    } catch (err) {
      setError(err.response?.data?.message || 'Sipariş getirilirken bir hata oluştu.')
      return null
    } finally {
      setLoading(false)
    }
  }

  // Sipariş oluştur
  const createOrder = async (orderData) => {
    if (!canCreate) {
      setError('Bu işlem için yetkiniz bulunmuyor.')
      return false
    }

    setLoading(true)
    setError(null)
    try {
      await orderService.createOrder(orderData)
      return true
    } catch (err) {
      setError(err.response?.data?.message || 'Sipariş oluşturulurken bir hata oluştu.')
      return false
    } finally {
      setLoading(false)
    }
  }

  // Sipariş güncelle
  const updateOrder = async (id, orderData) => {
    if (!canUpdate) {
      setError('Bu işlem için yetkiniz bulunmuyor.')
      return false
    }

    setLoading(true)
    setError(null)
    try {
      await orderService.updateOrder(id, orderData)
      return true
    } catch (err) {
      setError(err.response?.data?.message || 'Sipariş güncellenirken bir hata oluştu.')
      return false
    } finally {
      setLoading(false)
    }
  }

  // Sipariş sil
  const deleteOrder = async (id) => {
    if (!canDelete) {
      setError('Bu işlem için yetkiniz bulunmuyor.')
      return false
    }

    setLoading(true)
    setError(null)
    try {
      await orderService.deleteOrder(id)
      return true
    } catch (err) {
      setError(err.response?.data?.message || 'Sipariş silinirken bir hata oluştu.')
      return false
    } finally {
      setLoading(false)
    }
  }

  // Product steps şablonunu getir
  const fetchProductStepsTemplate = async (productId) => {
    if (!canCreate) {
      setError('Bu işlem için yetkiniz bulunmuyor.')
      return null
    }

    setLoading(true)
    setError(null)
    try {
      const response = await orderService.getProductStepsTemplate(productId)
      return response
    } catch (err) {
      setError(err.response?.data?.message || 'Ürün adımları getirilirken bir hata oluştu.')
      return null
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    error,
    setError,
    canRead,
    canCreate,
    canUpdate,
    canDelete,
    fetchOrders,
    fetchOrderById,
    createOrder,
    updateOrder,
    deleteOrder,
    fetchProductStepsTemplate,
    checkOrderCreationPermissions
  }
} 