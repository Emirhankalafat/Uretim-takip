import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'

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
        const response = await fetch('/api/permissions/my-permissions', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const data = await response.json()
          setPermissions(data.data.permissions || [])
          setError(null)
        } else if (response.status === 401 || response.status === 403) {
          // Authentication/authorization hatası - sessizce geç
          setPermissions([])
          setError(null)
        } else {
          console.error('Yetkiler alınamadı:', response.status)
          setPermissions([])
          setError('Yetkiler alınamadı')
        }
      } catch (err) {
        console.error('Yetki çekme hatası:', err)
        setPermissions([])
        setError('Bağlantı hatası')
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