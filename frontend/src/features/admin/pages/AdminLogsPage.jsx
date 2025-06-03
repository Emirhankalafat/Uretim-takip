import { useEffect, useState } from 'react';
import api from '../../../services/api';
import { toast } from 'react-hot-toast';

const AdminLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = {};
      if (type) params.type = type;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const res = await api.get('/admin/logs', { params });
      setLogs(res.data.logs || []);
    } catch (err) {
      toast.error('Loglar yüklenemedi!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line
  }, []);

  const handleFilter = (e) => {
    e.preventDefault();
    fetchLogs();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Sistem Logları</h1>
      <form className="flex flex-col md:flex-row gap-2 mb-4 items-end" onSubmit={handleFilter}>
        <input
          type="text"
          placeholder="Log tipi (örn: payment, login)"
          className="border rounded px-3 py-1 text-sm w-full md:w-48"
          value={type}
          onChange={e => setType(e.target.value)}
        />
        <input
          type="date"
          className="border rounded px-3 py-1 text-sm w-full md:w-40"
          value={startDate}
          onChange={e => setStartDate(e.target.value)}
        />
        <input
          type="date"
          className="border rounded px-3 py-1 text-sm w-full md:w-40"
          value={endDate}
          onChange={e => setEndDate(e.target.value)}
        />
        <button type="submit" className="px-4 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 text-sm transition">Filtrele</button>
      </form>
      <div className="overflow-x-auto rounded shadow bg-white">
        <table className="min-w-full border">
          <thead>
            <tr>
              <th className="px-4 py-2 border">ID</th>
              <th className="px-4 py-2 border">Tip</th>
              <th className="px-4 py-2 border">Kullanıcı</th>
              <th className="px-4 py-2 border">Tarih</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="text-center hover:bg-blue-50 transition">
                <td className="border px-2 py-1">{log.id}</td>
                <td className="border px-2 py-1">{log.type}</td>
                <td className="border px-2 py-1">{log.user ? `${log.user.Name} (${log.user.Mail})` : '-'}</td>
                <td className="border px-2 py-1">{new Date(log.created_at).toLocaleString('tr-TR')}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-6 text-gray-500">Log bulunamadı.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminLogsPage; 