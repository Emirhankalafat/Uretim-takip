import React, { useEffect, useState } from 'react';
import paymentService from '../../payment/services/paymentService';

const initialFilters = {
  status: '',
  user_id: '',
  company_id: '',
  startDate: '',
  endDate: '',
  minPrice: '',
  maxPrice: '',
  search: ''
};

const AdminPaymentsPage = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(initialFilters);

  const fetchPayments = async (filterParams = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await paymentService.getAllPayments(filterParams);
      if (res.success) {
        setPayments(res.payments);
      } else {
        setError('Ödemeler alınamadı.');
      }
    } catch (err) {
      setError('Bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments(filters);
    // eslint-disable-next-line
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchPayments(filters);
  };

  const handleReset = () => {
    setFilters(initialFilters);
    fetchPayments(initialFilters);
  };

  return (
    <div className="max-w-7xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Tüm Ödemeler</h1>
      <form className="flex flex-wrap gap-2 mb-6 items-end" onSubmit={handleFilterSubmit}>
        <select
          name="status"
          className="border rounded px-2 py-1 text-sm w-36"
          value={filters.status}
          onChange={handleFilterChange}
        >
          <option value="">Tüm Durumlar</option>
          <option value="success">Başarılı</option>
          <option value="fail">Başarısız</option>
          <option value="payment_success_db_error">DB Hatası</option>
        </select>
        <input
          type="text"
          name="user_id"
          placeholder="Kullanıcı ID"
          className="border rounded px-2 py-1 text-sm w-32"
          value={filters.user_id}
          onChange={handleFilterChange}
        />
        <input
          type="text"
          name="company_id"
          placeholder="Şirket ID"
          className="border rounded px-2 py-1 text-sm w-32"
          value={filters.company_id}
          onChange={handleFilterChange}
        />
        <input
          type="date"
          name="startDate"
          className="border rounded px-2 py-1 text-sm w-36"
          value={filters.startDate}
          onChange={handleFilterChange}
        />
        <input
          type="date"
          name="endDate"
          className="border rounded px-2 py-1 text-sm w-36"
          value={filters.endDate}
          onChange={handleFilterChange}
        />
        <input
          type="number"
          name="minPrice"
          placeholder="Min Tutar"
          className="border rounded px-2 py-1 text-sm w-28"
          value={filters.minPrice}
          onChange={handleFilterChange}
        />
        <input
          type="number"
          name="maxPrice"
          placeholder="Max Tutar"
          className="border rounded px-2 py-1 text-sm w-28"
          value={filters.maxPrice}
          onChange={handleFilterChange}
        />
        <input
          type="text"
          name="search"
          placeholder="Ara: ödeme ID, sepet ID, hata"
          className="border rounded px-2 py-1 text-sm w-48"
          value={filters.search}
          onChange={handleFilterChange}
        />
        <button type="submit" className="px-4 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 text-sm transition">Filtrele</button>
        <button type="button" onClick={handleReset} className="px-4 py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 text-sm transition">Temizle</button>
      </form>
      {loading && <div>Yükleniyor...</div>}
      {error && <div className="text-red-500 mb-4">{error}</div>}
      {!loading && !error && (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded shadow">
            <thead>
              <tr>
                <th className="px-4 py-2 border-b">ID</th>
                <th className="px-4 py-2 border-b">Kullanıcı ID</th>
                <th className="px-4 py-2 border-b">Kullanıcı Adı</th>
                <th className="px-4 py-2 border-b">Şirket ID</th>
                <th className="px-4 py-2 border-b">Şirket Adı</th>
                <th className="px-4 py-2 border-b">Tutar</th>
                <th className="px-4 py-2 border-b">Para Birimi</th>
                <th className="px-4 py-2 border-b">Durum</th>
                <th className="px-4 py-2 border-b">Tarih</th>
                <th className="px-4 py-2 border-b">Hata Mesajı</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr>
                  <td colSpan="10" className="text-center py-4">Kayıt bulunamadı.</td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={String(p.id)} className="hover:bg-gray-50">
                    <td className="px-4 py-2 border-b">{String(p.id)}</td>
                    <td className="px-4 py-2 border-b">{String(p.user_id)}</td>
                    <td className="px-4 py-2 border-b">{p.user?.Name || '-'}</td>
                    <td className="px-4 py-2 border-b">{p.company_id || '-'}</td>
                    <td className="px-4 py-2 border-b">{p.company_name || '-'}</td>
                    <td className="px-4 py-2 border-b">{p.price}</td>
                    <td className="px-4 py-2 border-b">{p.currency}</td>
                    <td className="px-4 py-2 border-b">{p.status}</td>
                    <td className="px-4 py-2 border-b">{new Date(p.created_at).toLocaleString('tr-TR')}</td>
                    <td className="px-4 py-2 border-b">{p.error_message || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminPaymentsPage; 