import { useEffect, useState } from 'react';
import api from '../../../services/api';
import { toast } from 'react-hot-toast';

const AdminLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('');
  const [user, setUser] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState({});

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = {};
      if (type) params.type = type;
      if (user) params.user_id = user;
      if (endpoint) params.endpoint = endpoint;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (search) params.search = search;
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

  const toggleExpand = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Sistem Logları</h1>
      <form className="flex flex-col md:flex-row gap-2 mb-4 items-end" onSubmit={handleFilter}>
        <select
          className="border rounded px-2 py-1 text-sm w-full md:w-40"
          value={type}
          onChange={e => setType(e.target.value)}
        >
          <option value="">Tüm Tipler</option>
          <option value="error">Hata</option>
          <option value="info">Bilgi</option>
          <option value="warning">Uyarı</option>
          <option value="action">Aksiyon</option>
          <option value="login">Giriş</option>
        </select>
        <input
          type="text"
          placeholder="Kullanıcı ID"
          className="border rounded px-2 py-1 text-sm w-full md:w-32"
          value={user}
          onChange={e => setUser(e.target.value)}
        />
        <input
          type="text"
          placeholder="Endpoint"
          className="border rounded px-2 py-1 text-sm w-full md:w-40"
          value={endpoint}
          onChange={e => setEndpoint(e.target.value)}
        />
        <input
          type="date"
          className="border rounded px-2 py-1 text-sm w-full md:w-32"
          value={startDate}
          onChange={e => setStartDate(e.target.value)}
        />
        <input
          type="date"
          className="border rounded px-2 py-1 text-sm w-full md:w-32"
          value={endDate}
          onChange={e => setEndDate(e.target.value)}
        />
        <input
          type="text"
          placeholder="Ara: mesaj/detay"
          className="border rounded px-2 py-1 text-sm w-full md:w-40"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button type="submit" className="px-4 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 text-sm transition">Filtrele</button>
      </form>
      <div className="overflow-x-auto rounded shadow bg-white">
        <table className="min-w-full border text-xs">
          <thead>
            <tr>
              <th className="px-2 py-1 border">ID</th>
              <th className="px-2 py-1 border">Tip</th>
              <th className="px-2 py-1 border">Kullanıcı</th>
              <th className="px-2 py-1 border">Endpoint</th>
              <th className="px-2 py-1 border">Mesaj</th>
              <th className="px-2 py-1 border">Tarih</th>
              <th className="px-2 py-1 border">Detay</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={String(log.id)} className="text-center hover:bg-blue-50 transition">
                <td className="border px-2 py-1">{String(log.id)}</td>
                <td className={`border px-2 py-1 font-bold ${log.type === 'error' ? 'text-red-600' : log.type === 'warning' ? 'text-yellow-600' : log.type === 'info' ? 'text-blue-600' : 'text-gray-700'}`}>{log.type}</td>
                <td className="border px-2 py-1">{log.user ? `${log.user.Name} (${log.user.Mail})` : (log.user_id ? String(log.user_id) : '-')}</td>
                <td className="border px-2 py-1">{log.endpoint || '-'}</td>
                <td className="border px-2 py-1 text-left max-w-xs truncate" title={log.message}>{log.message}</td>
                <td className="border px-2 py-1">{new Date(log.created_at).toLocaleString('tr-TR')}</td>
                <td className="border px-2 py-1">
                  {(log.details || log.stack) ? (
                    <button className="text-blue-600 underline text-xs" onClick={() => toggleExpand(String(log.id))}>
                      {expanded[String(log.id)] ? 'Gizle' : 'Detay'}
                    </button>
                  ) : '-'}
                  {expanded[String(log.id)] && (
                    <div className="text-left bg-gray-50 border mt-2 p-2 rounded max-w-lg mx-auto whitespace-pre-wrap break-all">
                      {log.details && <div><b>Detay:</b> {log.details}</div>}
                      {log.stack && <div className="mt-2"><b>Stack:</b> <pre className="whitespace-pre-wrap break-all">{log.stack}</pre></div>}
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-6 text-gray-500">Log bulunamadı.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminLogsPage; 