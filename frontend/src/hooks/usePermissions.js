import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import api from '../services/api'

const usePermissions = () => {
  const [permissions, setPermissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { isAuthenticated } = useSelector((state) => state.auth)

  useEffect(() => {
    const fetchPermissions = async () => {
      if (!isAuthenticated) {
        setPermissions([])
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const response = await api.get('/permissions/my-permissions')
        setPermissions(response.data.data.permissions || [])
        setError(null)
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
      } finally {
        setLoading(false)
      }
    }

    fetchPermissions()
  }, [isAuthenticated])

  const hasPermission = (permissionName) => {
    return permissions.some(permission => permission.Name === permissionName)
  }

  return {
    permissions,
    loading,
    error,
    hasPermission
  }
}

export default usePermissions 