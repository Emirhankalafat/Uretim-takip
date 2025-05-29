import { useState } from 'react'
import { useSelector } from 'react-redux'
import customerService from '../services/customerService'
import usePermissions from '../../../hooks/usePermissions'

export const useCustomers = () => {
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

  const canRead = checkPermission('CUSTOMER_READ')
  const canCreate = checkPermission('CUSTOMER_CREATE')
  const canUpdate = checkPermission('CUSTOMER_UPDATE')
  const canDelete = checkPermission('CUSTOMER_DELETE')

  // Müşterileri getir
  const fetchCustomers = async (params = {}) => {
    if (!canRead) {
      setError('Bu işlem için yetkiniz bulunmuyor.')
      return []
    }

    setLoading(true)
    setError(null)
    try {
      const response = await customerService.getCustomers(params)
      return response.customers || []
    } catch (err) {
      setError(err.response?.data?.message || 'Müşteriler getirilirken bir hata oluştu.')
      return []
    } finally {
      setLoading(false)
    }
  }

  // Tek müşteri getir
  const fetchCustomerById = async (id) => {
    if (!canRead) {
      setError('Bu işlem için yetkiniz bulunmuyor.')
      return null
    }

    setLoading(true)
    setError(null)
    try {
      const response = await customerService.getCustomerById(id)
      return response.customer
    } catch (err) {
      setError(err.response?.data?.message || 'Müşteri getirilirken bir hata oluştu.')
      return null
    } finally {
      setLoading(false)
    }
  }

  // Müşteri oluştur
  const createCustomer = async (customerData) => {
    if (!canCreate) {
      setError('Bu işlem için yetkiniz bulunmuyor.')
      return false
    }

    setLoading(true)
    setError(null)
    try {
      await customerService.createCustomer(customerData)
      return true
    } catch (err) {
      setError(err.response?.data?.message || 'Müşteri oluşturulurken bir hata oluştu.')
      return false
    } finally {
      setLoading(false)
    }
  }

  // Müşteri güncelle
  const updateCustomer = async (id, customerData) => {
    if (!canUpdate) {
      setError('Bu işlem için yetkiniz bulunmuyor.')
      return false
    }

    setLoading(true)
    setError(null)
    try {
      await customerService.updateCustomer(id, customerData)
      return true
    } catch (err) {
      setError(err.response?.data?.message || 'Müşteri güncellenirken bir hata oluştu.')
      return false
    } finally {
      setLoading(false)
    }
  }

  // Müşteri sil
  const deleteCustomer = async (id) => {
    if (!canDelete) {
      setError('Bu işlem için yetkiniz bulunmuyor.')
      return false
    }

    setLoading(true)
    setError(null)
    try {
      await customerService.deleteCustomer(id)
      return true
    } catch (err) {
      setError(err.response?.data?.message || 'Müşteri silinirken bir hata oluştu.')
      return false
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
    fetchCustomers,
    fetchCustomerById,
    createCustomer,
    updateCustomer,
    deleteCustomer
  }
} 