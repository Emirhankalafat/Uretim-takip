import { useState, useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import api from '../services/api'

const usePermissions = () => {
  const [permissions, setPermissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { isAuthenticated, user } = useSelector((state) => state.auth)
  const hasFetched = useRef(false) // Duplicate request'leri engellemek için

  useEffect(() => {
    const fetchPermissions = async () => {
      if (!isAuthenticated || !user) {
        setPermissions([])
        setLoading(false)
        return
      }

      // Eğer zaten fetch işlemi yapıldıysa, tekrar yapma
      if (hasFetched.current) {
        console.log('Permissions already fetching, skipping...')
        return
      }

      hasFetched.current = true

      try {
        setLoading(true)
        setError(null)
        const response = await api.get('/permissions/my-permissions')
        setPermissions(response.data.data.permissions || [])
      } catch (err) {
        if (err.response?.status === 401 || err.response?.status === 403) {
          // Authentication/authorization hatası - sessizce geç
          setPermissions([])
          setError(null)
        } else {
          console.error('Yetki çekme hatası:', err)
          setPermissions([])
          setError('Yetkiler alınamadı')
        }
        // Hata durumunda tekrar deneme imkanı için reset et
        hasFetched.current = false
      } finally {
        setLoading(false)
      }
    }

    fetchPermissions()
  }, [isAuthenticated, user?.id]) // user.id dependency ekledik

  const hasPermission = (permissionName) => {
    return permissions.some(permission => permission.Name === permissionName)
  }

  const refreshPermissions = async () => {
    hasFetched.current = false
    const fetchPermissions = async () => {
      if (!isAuthenticated || !user) {
        setPermissions([])
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        const response = await api.get('/permissions/my-permissions')
        setPermissions(response.data.data.permissions || [])
      } catch (err) {
        if (err.response?.status === 401 || err.response?.status === 403) {
          setPermissions([])
          setError(null)
        } else {
          console.error('Yetki çekme hatası:', err)
          setPermissions([])
          setError('Yetkiler alınamadı')
        }
      } finally {
        setLoading(false)
      }
    }
    await fetchPermissions()
  }

  return {
    permissions,
    loading,
    error,
    hasPermission,
    refreshPermissions
  }
}

export default usePermissions 