import { useState, useEffect } from 'react';
import api from '../../../services/api';
import { useSelector } from 'react-redux';

const reportEndpoints = [
  {
    key: 'general',
    label: 'Genel İstatistikler',
    endpoint: '/reports/general-stats',
    render: (data) => (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-100">
          <div className="text-gray-500 text-sm mb-1">Toplam Kullanıcı</div>
          <div className="text-2xl font-bold text-primary-700">{data?.totalUsers ?? '-'}</div>
        </div>
        <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-100">
          <div className="text-gray-500 text-sm mb-1">Toplam Sipariş</div>
          <div className="text-2xl font-bold text-primary-700">{data?.totalOrders ?? '-'}</div>
        </div>
      </div>
    )
  },
  {
    key: 'orderCount',
    label: 'Sipariş Sayısı (Tarih Aralığı)',
    endpoint: '/reports/order-count-by-date',
    render: (data) => (
      <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-100">
        <div className="text-gray-500 text-sm mb-1">Sipariş Sayısı</div>
        <div className="text-2xl font-bold text-primary-700">{data?.orderCount ?? '-'}</div>
      </div>
    )
  },
  {
    key: 'topCustomers',
    label: 'En Çok Sipariş Veren 5 Müşteri',
    endpoint: '/reports/top-customers',
    render: (data) => (
      <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-100">
        <div className="text-gray-500 text-sm mb-3">Müşteri & Sipariş Sayısı</div>
        <ul className="divide-y divide-gray-100">
          {Array.isArray(data) ? data.map((item, i) => (
            <li key={i} className="py-2 flex items-center justify-between">
              <span className="font-medium text-gray-800">{item.customer?.Name || '-'}</span>
              <span className="bg-primary-50 text-primary-700 px-3 py-1 rounded-full text-sm font-bold">{item.orderCount}</span>
            </li>
          )) : <li className="text-gray-500 py-2">Kayıt bulunamadı</li>}
        </ul>
      </div>
    )
  },
  {
    key: 'activeUsers',
    label: 'Aktif Kullanıcı Sayısı',
    endpoint: '/reports/active-users',
    render: (data) => (
      <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-100">
        <div className="text-gray-500 text-sm mb-1">Aktif Kullanıcı</div>
        <div className="text-2xl font-bold text-primary-700">{data?.activeUserCount ?? '-'}</div>
      </div>
    )
  }
];

const ReportsPage = () => {
  const { user } = useSelector((state) => state.auth);
  const [selectedReport, setSelectedReport] = useState(reportEndpoints[0]);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line
  }, [selectedReport, startDate, endDate]);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = selectedReport.endpoint;
      // Sadece tarih aralığı destekleyenlerde query ekle
      if (['/reports/order-count-by-date', '/reports/top-customers', '/reports/last-7-days-orders'].includes(url)) {
        const params = [];
        if (startDate) params.push(`startDate=${startDate}`);
        if (endDate) params.push(`endDate=${endDate}`);
        if (params.length) url += `?${params.join('&')}`;
      }
      const res = await api.get(url);
      setReportData(res.data.data);
    } catch (err) {
      setError('Rapor yüklenemedi.');
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  // Permission kontrolü (SuperAdmin veya REPORT_READ)
  const canSeeReports = user?.is_SuperAdmin || (user?.permissions?.some(p => p.Name === 'REPORT_READ'));

  if (!canSeeReports) {
    return (
      <div className="max-w-2xl mx-auto mt-24 bg-danger-50 border border-danger-200 rounded-xl p-8 text-center">
        <div className="text-4xl mb-4">⛔</div>
        <h2 className="text-xl font-bold text-danger-800 mb-2">Erişim Reddedildi</h2>
        <p className="text-danger-700">Bu sayfayı görüntülemek için gerekli yetkiniz yok.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-10 animate-fade-in">
      <h1 className="text-2xl font-bold text-primary-800 mb-6 flex items-center">
        <span className="mr-2">📊</span> Raporlar
      </h1>
      <div className="flex flex-wrap gap-3 mb-6">
        {reportEndpoints.map((r) => (
          <button
            key={r.key}
            onClick={() => setSelectedReport(r)}
            className={`px-4 py-2 rounded-lg font-medium border transition-all duration-200 ${selectedReport.key === r.key ? 'bg-primary-600 text-white border-primary-700' : 'bg-white text-primary-700 border-primary-200 hover:bg-primary-50'}`}
          >
            {r.label}
          </button>
        ))}
      </div>
      {/* Tarih aralığı seçimi */}
      {['orderCount', 'topCustomers'].includes(selectedReport.key) && (
        <div className="flex flex-wrap gap-3 mb-6 items-end">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Başlangıç Tarihi</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Bitiş Tarihi</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="border rounded px-3 py-2" />
          </div>
          <button onClick={fetchReport} className="ml-2 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-all">Filtrele</button>
        </div>
      )}
      <div className="min-h-[120px]">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="text-danger-700 bg-danger-50 border border-danger-200 rounded-lg p-4 text-center">{error}</div>
        ) : (
          selectedReport.render(reportData)
        )}
      </div>
    </div>
  );
};

export default ReportsPage; 