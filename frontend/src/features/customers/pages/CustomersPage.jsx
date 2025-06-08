import React, { useState, useEffect } from 'react'
import { useCustomers } from '../hooks/useCustomers'
import SubscriptionGuard from '../../../components/SubscriptionGuard'

const CustomersPage = () => {
  const {
    loading,
    error,
    setError,
    canRead,
    canCreate,
    canUpdate,
    canDelete,
    fetchCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer
  } = useCustomers()

  const [customers, setCustomers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [formData, setFormData] = useState({ Name: '' })
  const [toast, setToast] = useState(null)

  // Toast gösterme
  const showToast = (type, message) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }

  // Müşterileri yükle
  const loadCustomers = async () => {
    const result = await fetchCustomers({ search: searchTerm })
    setCustomers(result)
  }

  useEffect(() => {
    if (canRead) {
      loadCustomers()
    }
  }, [canRead, searchTerm])

  // Form submit
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.Name.trim()) {
      showToast('error', 'Müşteri adı boş olamaz.')
      return
    }

    let success = false
    if (editingCustomer) {
      success = await updateCustomer(editingCustomer.id, formData)
      if (success) {
        showToast('success', 'Müşteri başarıyla güncellendi.')
      }
    } else {
      success = await createCustomer(formData)
      if (success) {
        showToast('success', 'Müşteri başarıyla oluşturuldu.')
      }
    }

    if (success) {
      setShowModal(false)
      setEditingCustomer(null)
      setFormData({ Name: '' })
      loadCustomers()
    } else if (error) {
      showToast('error', error)
    }
  }

  // Müşteri silme
  const handleDelete = async (customer) => {
    if (!window.confirm(`"${customer.Name}" müşterisini silmek istediğinizden emin misiniz?`)) {
      return
    }

    const success = await deleteCustomer(customer.id)
    if (success) {
      showToast('success', 'Müşteri başarıyla silindi.')
      loadCustomers()
    } else if (error) {
      showToast('error', error)
    }
  }

  // Modal açma/kapama
  const openModal = (customer = null) => {
    setEditingCustomer(customer)
    setFormData({ Name: customer?.Name || '' })
    setShowModal(true)
    setError(null)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingCustomer(null)
    setFormData({ Name: '' })
    setError(null)
  }

  // Yetki kontrolü
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

  return (
    <div className="animate-fade-in space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-strong text-white ${
          toast.type === 'success' ? 'bg-success-500' : 'bg-danger-500'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 shadow-strong text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Müşteri Yönetimi</h1>
            <p className="text-primary-100">
              Müşterilerinizi yönetin, ekleyin ve düzenleyin
            </p>
          </div>
          <div className="text-6xl opacity-20">
            👥
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl p-6 shadow-soft border border-gray-100">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Müşteri ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-300"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400">🔍</span>
            </div>
          </div>

          {/* Add Button */}
          {canCreate && (
            <SubscriptionGuard requiresActiveSubscription={true} actionName="Yeni müşteri ekleme">
              <button
                onClick={() => openModal()}
                className="bg-gradient-to-r from-success-500 to-success-600 text-white px-6 py-2 rounded-lg font-medium hover:from-success-600 hover:to-success-700 transition-all duration-300 shadow-medium flex items-center"
              >
                <span className="mr-2">➕</span>
                Yeni Müşteri
              </button>
            </SubscriptionGuard>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
          </div>
        </div>
      ) : customers.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center shadow-soft border border-gray-100">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {searchTerm ? 'Müşteri Bulunamadı' : 'Henüz Müşteri Yok'}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm 
              ? 'Arama kriterleriyle eşleşen müşteri bulunamadı.'
              : 'İlk müşterinizi ekleyerek başlayın.'
            }
          </p>
          {canCreate && !searchTerm && (
            <SubscriptionGuard requiresActiveSubscription={true} actionName="İlk müşteri ekleme">
              <button
                onClick={() => openModal()}
                className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-6 py-2 rounded-lg font-medium hover:from-primary-600 hover:to-primary-700 transition-all duration-300 shadow-medium"
              >
                <span className="mr-2">➕</span>
                İlk Müşteriyi Ekle
              </button>
            </SubscriptionGuard>
          )}
        </div>
      ) : (
        /* Customers Table */
        <div className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Müşteri
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Oluşturulma Tarihi
                  </th>
                  {(canUpdate || canDelete) && (
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İşlemler
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {customers.map((customer, index) => (
                  <tr 
                    key={customer.id} 
                    className="hover:bg-gradient-to-r hover:from-gray-50 hover:to-white transition-all duration-300"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center mr-4 shadow-soft">
                          <span className="text-white">👤</span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{customer.Name}</div>
                          <div className="text-sm text-gray-500">ID: {customer.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(customer.Created_At).toLocaleDateString('tr-TR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(customer.Created_At).toLocaleTimeString('tr-TR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </td>
                    {(canUpdate || canDelete) && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          {canUpdate && (
                            <SubscriptionGuard requiresActiveSubscription={true} actionName="Müşteri düzenleme">
                              <button
                                onClick={() => openModal(customer)}
                                className="bg-gradient-to-r from-warning-500 to-warning-600 text-white px-3 py-1 rounded-lg text-sm font-medium hover:from-warning-600 hover:to-warning-700 transition-all duration-300 shadow-soft"
                              >
                                ✏️ Düzenle
                              </button>
                            </SubscriptionGuard>
                          )}
                          {canDelete && (
                            <SubscriptionGuard requiresActiveSubscription={true} actionName="Müşteri silme" showTooltip={false}>
                              <button
                                onClick={() => handleDelete(customer)}
                                className="bg-gradient-to-r from-danger-500 to-danger-600 text-white px-3 py-1 rounded-lg text-sm font-medium hover:from-danger-600 hover:to-danger-700 transition-all duration-300 shadow-soft"
                              >
                                🗑️ Sil
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full shadow-strong">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {editingCustomer ? 'Müşteriyi Düzenle' : 'Yeni Müşteri Ekle'}
              </h3>
              
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Müşteri Adı
                  </label>
                  <input
                    type="text"
                    value={formData.Name}
                    onChange={(e) => setFormData({ ...formData, Name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-300"
                    placeholder="Müşteri adını girin..."
                    required
                  />
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-danger-50 border border-danger-200 rounded-lg">
                    <p className="text-danger-800 text-sm">{error}</p>
                  </div>
                )}

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors duration-300"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg hover:from-primary-600 hover:to-primary-700 transition-all duration-300 shadow-medium disabled:opacity-50"
                  >
                    {loading ? 'Kaydediliyor...' : editingCustomer ? 'Güncelle' : 'Ekle'}
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

export default CustomersPage 