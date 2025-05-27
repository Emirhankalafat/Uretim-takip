import { useState, useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import productStepsService from '../services/productStepsService'
import productService from '../../products/services/productService'
import userService from '../../users/services/userService'
import usePermissions from '../../../hooks/usePermissions'
import Toast from '../../../components/Toast'

const ProductStepsTablePage = () => {
  const [productSteps, setProductSteps] = useState([])
  const [products, setProducts] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState('')
  const [selectedProductObj, setSelectedProductObj] = useState(null)
  const [editingRows, setEditingRows] = useState(new Set())
  const [selectedRows, setSelectedRows] = useState(new Set())
  const [newRows, setNewRows] = useState([])
  const [toast, setToast] = useState(null)
  const [draggedRow, setDraggedRow] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef(null)
  const { user } = useSelector((state) => state.auth)
  const { hasPermission } = usePermissions()

  // Yetki kontrolleri
  const canRead = user?.is_SuperAdmin || hasPermission('PRODUCT_STEP_READ')
  const canCreate = user?.is_SuperAdmin || hasPermission('PRODUCT_STEP_CREATE')
  const canUpdate = user?.is_SuperAdmin || hasPermission('PRODUCT_STEP_UPDATE')
  const canDelete = user?.is_SuperAdmin || hasPermission('PRODUCT_STEP_DELETE')
  const canReadProducts = user?.is_SuperAdmin || hasPermission('PRODUCT_READ')

  useEffect(() => {
    if (canReadProducts) {
      fetchProducts()
    }
    fetchUsers()
  }, [canReadProducts])

  useEffect(() => {
    if (selectedProduct && canRead) {
      fetchProductSteps()
    } else {
      setProductSteps([])
    }
  }, [selectedProduct, canRead])

  // Click outside handler for dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const fetchProductSteps = async () => {
    try {
      setLoading(true)
      const response = await productStepsService.getStepsByProduct(selectedProduct)
      setProductSteps(response.productSteps || [])
    } catch (error) {
      console.error('Ürün adımları yüklenirken hata:', error)
      setToast({
        type: 'error',
        message: 'Ürün adımları yüklenirken bir hata oluştu.'
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await productService.getProducts()
      setProducts(response.products || [])
    } catch (error) {
      console.error('Ürünler yüklenirken hata:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await userService.getAllUsers()
      setUsers(response.data?.users || [])
    } catch (error) {
      console.error('Kullanıcılar yüklenirken hata:', error)
    }
  }

  const handleProductSelect = (productId) => {
    setSelectedProduct(productId.toString())
    const product = products.find(p => p.id.toString() === productId.toString())
    setSelectedProductObj(product)
    setNewRows([])
    setEditingRows(new Set())
    setShowDropdown(false)
  }

  // Yeni satır ekleme
  const addNewRow = () => {
    const newRow = {
      id: `new_${Date.now()}`,
      Name: '',
      Description: '',
      Product_id: selectedProduct,
      Step_number: productSteps.length + newRows.length + 1,
      Responsible_User: '',
      isNew: true
    }
    setNewRows([...newRows, newRow])
    setEditingRows(new Set([...editingRows, newRow.id]))
  }

  // Satır düzenleme
  const toggleEdit = (rowId) => {
    const newEditingRows = new Set(editingRows)
    if (newEditingRows.has(rowId)) {
      newEditingRows.delete(rowId)
    } else {
      newEditingRows.add(rowId)
    }
    setEditingRows(newEditingRows)
  }

  // Satır güncelleme
  const updateRow = (rowId, field, value) => {
    if (rowId.toString().startsWith('new_')) {
      setNewRows(newRows.map(row => 
        row.id === rowId ? { ...row, [field]: value } : row
      ))
    } else {
      setProductSteps(productSteps.map(step => 
        step.id === rowId ? { ...step, [field]: value } : step
      ))
    }
  }

  // Satır kaydetme
  const saveRow = async (rowId) => {
    try {
      if (rowId.toString().startsWith('new_')) {
        // Yeni satır kaydetme
        const newRow = newRows.find(row => row.id === rowId)
        if (!newRow.Name || !newRow.Product_id || !newRow.Step_number) {
          setToast({
            type: 'error',
            message: 'Adım adı, ürün ve adım numarası gerekli.'
          })
          return
        }

        const { id, isNew, ...stepData } = newRow
        await productStepsService.createProductStep(stepData)
        
        setNewRows(newRows.filter(row => row.id !== rowId))
        setEditingRows(new Set([...editingRows].filter(id => id !== rowId)))
        fetchProductSteps()
        
        setToast({
          type: 'success',
          message: 'Ürün adımı başarıyla oluşturuldu.'
        })
      } else {
        // Mevcut satır güncelleme
        const step = productSteps.find(s => s.id === rowId)
        if (!step.Name || !step.Step_number) {
          setToast({
            type: 'error',
            message: 'Adım adı ve adım numarası gerekli.'
          })
          return
        }

        await productStepsService.updateProductStep(rowId, {
          Name: step.Name,
          Description: step.Description,
          Step_number: step.Step_number,
          Responsible_User: step.Responsible_User || null
        })
        
        setEditingRows(new Set([...editingRows].filter(id => id !== rowId)))
        
        setToast({
          type: 'success',
          message: 'Ürün adımı başarıyla güncellendi.'
        })
      }
    } catch (error) {
      console.error('Kaydetme hatası:', error)
      setToast({
        type: 'error',
        message: error.response?.data?.message || 'Kaydetme sırasında bir hata oluştu.'
      })
    }
  }

  // Satır silme
  const deleteRow = async (rowId) => {
    if (rowId.toString().startsWith('new_')) {
      setNewRows(newRows.filter(row => row.id !== rowId))
      setEditingRows(new Set([...editingRows].filter(id => id !== rowId)))
      return
    }

    const step = productSteps.find(s => s.id === rowId)
    if (!window.confirm(`"${step.Name}" adımını silmek istediğinizden emin misiniz?`)) {
      return
    }

    try {
      await productStepsService.deleteProductStep(rowId)
      fetchProductSteps()
      setToast({
        type: 'success',
        message: 'Ürün adımı başarıyla silindi.'
      })
    } catch (error) {
      console.error('Silme hatası:', error)
      setToast({
        type: 'error',
        message: error.response?.data?.message || 'Silme sırasında bir hata oluştu.'
      })
    }
  }

  // Toplu silme
  const deleteSelected = async () => {
    const selectedSteps = productSteps.filter(step => selectedRows.has(step.id))
    if (selectedSteps.length === 0) return

    if (!window.confirm(`${selectedSteps.length} adımı silmek istediğinizden emin misiniz?`)) {
      return
    }

    try {
      await Promise.all(
        selectedSteps.map(step => productStepsService.deleteProductStep(step.id))
      )
      setSelectedRows(new Set())
      fetchProductSteps()
      setToast({
        type: 'success',
        message: `${selectedSteps.length} adım başarıyla silindi.`
      })
    } catch (error) {
      console.error('Toplu silme hatası:', error)
      setToast({
        type: 'error',
        message: 'Toplu silme sırasında bir hata oluştu.'
      })
    }
  }

  // Satır seçimi
  const toggleRowSelection = (rowId) => {
    const newSelectedRows = new Set(selectedRows)
    if (newSelectedRows.has(rowId)) {
      newSelectedRows.delete(rowId)
    } else {
      newSelectedRows.add(rowId)
    }
    setSelectedRows(newSelectedRows)
  }

  // Tümünü seç/seçme
  const toggleSelectAll = () => {
    if (selectedRows.size === productSteps.length) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(productSteps.map(step => step.id)))
    }
  }

  // Sürükle-bırak işlemleri
  const handleDragStart = (e, rowId) => {
    setDraggedRow(rowId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e, targetRowId) => {
    e.preventDefault()
    if (!draggedRow || draggedRow === targetRowId) return

    const draggedStep = productSteps.find(s => s.id === draggedRow)
    const targetStep = productSteps.find(s => s.id === targetRowId)
    
    if (!draggedStep || !targetStep) return

    try {
      // Adım numaralarını değiştir
      await productStepsService.updateProductStep(draggedRow, {
        ...draggedStep,
        Step_number: targetStep.Step_number
      })
      
      await productStepsService.updateProductStep(targetRowId, {
        ...targetStep,
        Step_number: draggedStep.Step_number
      })

      fetchProductSteps()
      setToast({
        type: 'success',
        message: 'Adım sıralaması güncellendi.'
      })
    } catch (error) {
      console.error('Sıralama hatası:', error)
      setToast({
        type: 'error',
        message: 'Sıralama güncellenirken bir hata oluştu.'
      })
    } finally {
      setDraggedRow(null)
    }
  }

  // Adım sırasını yeniden düzenleme
  const reorderSteps = async () => {
    try {
      const sortedSteps = [...productSteps].sort((a, b) => a.Step_number - b.Step_number)
      
      await Promise.all(
        sortedSteps.map((step, index) => 
          productStepsService.updateProductStep(step.id, {
            ...step,
            Step_number: index + 1
          })
        )
      )

      fetchProductSteps()
      setToast({
        type: 'success',
        message: 'Adım numaraları yeniden düzenlendi.'
      })
    } catch (error) {
      console.error('Yeniden düzenleme hatası:', error)
      setToast({
        type: 'error',
        message: 'Yeniden düzenleme sırasında bir hata oluştu.'
      })
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

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const allRows = [...productSteps, ...newRows].sort((a, b) => a.Step_number - b.Step_number)

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 shadow-strong text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Ürün Adımları - Tablo Yönetimi</h1>
            <p className="text-primary-100">
              Ürün adımlarını toplu olarak yönetin, düzenleyin ve sıralayın
            </p>
          </div>
        </div>
      </div>

      {/* Product Selection */}
      <div className="bg-white rounded-xl p-6 shadow-soft border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex-1 max-w-md">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ürün Seçin *
            </label>
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setShowDropdown(!showDropdown)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 text-left bg-white flex items-center justify-between"
              >
                <span className={selectedProductObj ? "text-gray-900" : "text-gray-500"}>
                  {selectedProductObj ? selectedProductObj.name : "Ürün seçin..."}
                </span>
                <span className={`transform transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`}>
                  ⬇️
                </span>
              </button>
              {showDropdown && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl mt-1 shadow-medium z-10 max-h-60 overflow-y-auto">
                  {/* Arama kutusu */}
                  <div className="p-3 border-b border-gray-100">
                    <input
                      type="text"
                      placeholder="Ürün ara..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                    />
                  </div>
                  {/* Ürün listesi */}
                  <div className="max-h-48 overflow-y-auto">
                    {filteredProducts.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => {
                          handleProductSelect(product.id)
                          setSearchTerm('')
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors duration-200 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-gray-900">{product.name}</div>
                        {product.description && (
                          <div className="text-sm text-gray-600 truncate">{product.description}</div>
                        )}
                      </button>
                    ))}
                    {filteredProducts.length === 0 && (
                      <div className="px-4 py-3 text-gray-500 text-center">
                        {searchTerm ? "Ürün bulunamadı" : "Ürün bulunmuyor"}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {selectedProductObj && (
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-gray-600">Seçili Ürün</div>
                <div className="font-semibold text-gray-900">{selectedProductObj.name}</div>
              </div>
              <button
                onClick={() => {
                  setSelectedProduct('')
                  setSelectedProductObj(null)
                  setSearchTerm('')
                  setShowDropdown(false)
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-300"
                title="Seçimi Temizle"
              >
                ❌
              </button>
              <div className="flex items-center space-x-3">
                {canCreate && (
                  <button
                    onClick={addNewRow}
                    className="bg-gradient-to-r from-success-500 to-success-600 text-white px-4 py-2 rounded-lg font-medium hover:from-success-600 hover:to-success-700 transition-all duration-300 shadow-medium"
                  >
                    <span className="mr-2">➕</span>
                    Yeni Satır
                  </button>
                )}
                
                {selectedRows.size > 0 && canDelete && (
                  <button
                    onClick={deleteSelected}
                    className="bg-gradient-to-r from-danger-500 to-danger-600 text-white px-4 py-2 rounded-lg font-medium hover:from-danger-600 hover:to-danger-700 transition-all duration-300 shadow-medium"
                  >
                    <span className="mr-2">🗑️</span>
                    Seçilenleri Sil ({selectedRows.size})
                  </button>
                )}

                <button
                  onClick={reorderSteps}
                  className="bg-gradient-to-r from-info-500 to-info-600 text-white px-4 py-2 rounded-lg font-medium hover:from-info-600 hover:to-info-700 transition-all duration-300 shadow-medium"
                >
                  <span className="mr-2">🔄</span>
                  Yeniden Sırala
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      {selectedProduct && (
        <div className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Yükleniyor...</h3>
                <p className="text-sm text-gray-600">Ürün adımları getiriliyor</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left">
                      <input
                        type="checkbox"
                        checked={selectedRows.size === productSteps.length && productSteps.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sıra
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Adım Adı
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Açıklama
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sorumlu
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {allRows.map((row, index) => (
                    <tr 
                      key={row.id}
                      className={`hover:bg-gray-50 transition-all duration-300 ${
                        draggedRow === row.id ? 'opacity-50' : ''
                      } ${
                        row.isNew ? 'bg-blue-50' : ''
                      }`}
                      draggable={!editingRows.has(row.id) && !row.isNew}
                      onDragStart={(e) => handleDragStart(e, row.id)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, row.id)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        {!row.isNew && (
                          <input
                            type="checkbox"
                            checked={selectedRows.has(row.id)}
                            onChange={() => toggleRowSelection(row.id)}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                        )}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingRows.has(row.id) ? (
                          <input
                            type="number"
                            min="1"
                            value={row.Step_number}
                            onChange={(e) => updateRow(row.id, 'Step_number', parseInt(e.target.value))}
                            className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          />
                        ) : (
                          <span className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-full text-sm font-bold">
                            {row.Step_number}
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        {editingRows.has(row.id) ? (
                          <input
                            type="text"
                            value={row.Name}
                            onChange={(e) => updateRow(row.id, 'Name', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="Adım adı"
                          />
                        ) : (
                          <div className="text-sm font-medium text-gray-900">{row.Name}</div>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        {editingRows.has(row.id) ? (
                          <textarea
                            value={row.Description || ''}
                            onChange={(e) => updateRow(row.id, 'Description', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                            rows={2}
                            placeholder="Açıklama"
                          />
                        ) : (
                          <div className="text-sm text-gray-600 max-w-xs">
                            {row.Description || '-'}
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        {editingRows.has(row.id) ? (
                          <select
                            value={row.Responsible_User || ''}
                            onChange={(e) => updateRow(row.id, 'Responsible_User', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          >
                            <option value="">Sorumlu Seçin</option>
                            {users.map((user) => (
                              <option key={user.id} value={user.id}>
                                {user.Name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="text-sm text-gray-900">
                            {row.responsible?.Name || '-'}
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          {editingRows.has(row.id) ? (
                            <>
                              <button
                                onClick={() => saveRow(row.id)}
                                className="text-success-600 hover:text-success-900 hover:bg-success-50 p-2 rounded-lg transition-all duration-300"
                                title="Kaydet"
                              >
                                ✅
                              </button>
                              <button
                                onClick={() => {
                                  if (row.isNew) {
                                    setNewRows(newRows.filter(r => r.id !== row.id))
                                  }
                                  toggleEdit(row.id)
                                }}
                                className="text-gray-600 hover:text-gray-900 hover:bg-gray-50 p-2 rounded-lg transition-all duration-300"
                                title="İptal"
                              >
                                ❌
                              </button>
                            </>
                          ) : (
                            <>
                              {canUpdate && (
                                <button
                                  onClick={() => toggleEdit(row.id)}
                                  className="text-primary-600 hover:text-primary-900 hover:bg-primary-50 p-2 rounded-lg transition-all duration-300"
                                  title="Düzenle"
                                >
                                  ✏️
                                </button>
                              )}
                              {canDelete && (
                                <button
                                  onClick={() => deleteRow(row.id)}
                                  className="text-danger-600 hover:text-danger-900 hover:bg-danger-50 p-2 rounded-lg transition-all duration-300"
                                  title="Sil"
                                >
                                  🗑️
                                </button>
                              )}
                              {!row.isNew && (
                                <span className="text-gray-400 cursor-move" title="Sürükle">
                                  ⋮⋮
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {allRows.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-4xl">🔧</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Henüz adım bulunmuyor
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Bu ürün için henüz adım eklenmemiş.
                  </p>
                  {canCreate && (
                    <button
                      onClick={addNewRow}
                      className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-primary-600 hover:to-primary-700 transition-all duration-300 shadow-medium hover:shadow-strong transform hover:scale-105"
                    >
                      <span className="mr-2">➕</span>
                      İlk Adımı Ekle
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
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
    </div>
  )
}

export default ProductStepsTablePage 