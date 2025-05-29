import { useState } from 'react'
import { useSelector } from 'react-redux'
import myJobsService from '../services/myJobsService'
import usePermissions from '../../../hooks/usePermissions'

export const useMyJobs = () => {
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

  const canViewMyJobs = checkPermission('MY_JOBS')

  // Kendi işlerini getir
  const fetchMyJobs = async () => {
    if (!canViewMyJobs) {
      setError('Bu işlem için yetkiniz bulunmuyor.')
      return null
    }

    setLoading(true)
    setError(null)
    try {
      const response = await myJobsService.getMyJobs()
      return response
    } catch (err) {
      setError(err.response?.data?.message || 'İşler getirilirken bir hata oluştu.')
      return null
    } finally {
      setLoading(false)
    }
  }

  // Belirli işin detayını getir
  const fetchMyJobDetail = async (stepId) => {
    if (!canViewMyJobs) {
      setError('Bu işlem için yetkiniz bulunmuyor.')
      return null
    }

    setLoading(true)
    setError(null)
    try {
      const response = await myJobsService.getMyJobDetail(stepId)
      return response.job
    } catch (err) {
      setError(err.response?.data?.message || 'İş detayı getirilirken bir hata oluştu.')
      return null
    } finally {
      setLoading(false)
    }
  }

  // İşi başlat
  const startJob = async (stepId) => {
    if (!canViewMyJobs) {
      setError('Bu işlem için yetkiniz bulunmuyor.')
      return false
    }

    setLoading(true)
    setError(null)
    try {
      await myJobsService.startMyJob(stepId)
      return true
    } catch (err) {
      setError(err.response?.data?.message || 'İş başlatılırken bir hata oluştu.')
      return false
    } finally {
      setLoading(false)
    }
  }

  // İşi tamamla
  const completeJob = async (stepId, notes = '') => {
    if (!canViewMyJobs) {
      setError('Bu işlem için yetkiniz bulunmuyor.')
      return false
    }

    setLoading(true)
    setError(null)
    try {
      const response = await myJobsService.completeMyJob(stepId, notes)
      return response
    } catch (err) {
      setError(err.response?.data?.message || 'İş tamamlanırken bir hata oluştu.')
      return false
    } finally {
      setLoading(false)
    }
  }

  // İş notlarını güncelle
  const updateJobNotes = async (stepId, notes) => {
    if (!canViewMyJobs) {
      setError('Bu işlem için yetkiniz bulunmuyor.')
      return false
    }

    setLoading(true)
    setError(null)
    try {
      await myJobsService.updateMyJobNotes(stepId, notes)
      return true
    } catch (err) {
      setError(err.response?.data?.message || 'Notlar güncellenirken bir hata oluştu.')
      return false
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    error,
    setError,
    canViewMyJobs,
    fetchMyJobs,
    fetchMyJobDetail,
    startJob,
    completeJob,
    updateJobNotes
  }
} 