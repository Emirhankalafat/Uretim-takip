import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import api from '../../../services/api';
import { toast } from 'react-hot-toast';

const FILTERS = [
  { label: 'Tümü', value: 'all' },
  { label: 'Aktif', value: 'active' },
  { label: 'Pasif', value: 'inactive' },
];
const SORTS = [
  { label: 'Ad', value: 'Name' },
  { label: 'E-posta', value: 'Mail' },
  { label: 'Oluşturulma', value: 'created_at' },
];

const AdminUsersPage = () => {
  const { token } = useSelector((state) => state.adminAuth);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('Name');
  const [sortDir, setSortDir] = useState('asc');
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState('all');

  const fetchCompanies = async () => {
    try {
      const res = await api.get('/admin/companies');
      setCompanies(res.data.companies || []);
    } catch (err) {
      toast.error('Şirketler yüklenemedi!');
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data.users);
    } catch (err) {
      toast.error('Kullanıcılar yüklenemedi!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
    fetchUsers();
    // eslint-disable-next-line
  }, []);

  const handleToggleActive = async (userId) => {
    try {
      await api.put(`/admin/users/${userId}/toggle-active`);
      toast.success('Kullanıcı durumu güncellendi!');
      fetchUsers();
    } catch (err) {
      toast.error('İşlem başarısız!');
    }
  };

  let filtered = users.filter((user) => {
    if (filter === 'active' && !user.is_active) return false;
    if (filter === 'inactive' && user.is_active) return false;
    if (selectedCompany !== 'all' && user.company?.id !== selectedCompany) return false;
    if (search && !(
      user.Name?.toLowerCase().includes(search.toLowerCase()) ||
      user.Mail?.toLowerCase().includes(search.toLowerCase())
    )) return false;
    return true;
  });
  filtered = filtered.sort((a, b) => {
    let valA = a[sort] || '';
    let valB = b[sort] || '';
    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();
    if (valA < valB) return sortDir === 'asc' ? -1 : 1;
    if (valA > valB) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  if (loading) {
    return <div className="text-center py-10">Yükleniyor...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Kullanıcı Yönetimi</h1>
      <div className="flex flex-col md:flex-row md:items-center gap-2 mb-4">
        <div className="flex gap-2">
          {FILTERS.map(f => (
            <button
              key={f.value}
              className={`px-3 py-1 rounded-full border text-sm font-medium transition ${filter === f.value ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50'}`}
              onClick={() => setFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <select
          className="border rounded px-2 py-1 text-sm ml-0 md:ml-4 w-full md:w-64"
          value={selectedCompany}
          onChange={e => setSelectedCompany(e.target.value)}
        >
          <option value="all">Tüm Şirketler</option>
          {companies.map(c => (
            <option key={c.id} value={c.id}>{c.Name}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Ara: ad veya e-posta"
          className="border rounded px-3 py-1 text-sm ml-0 md:ml-4 w-full md:w-64"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="flex gap-2 ml-0 md:ml-4">
          <select
            className="border rounded px-2 py-1 text-sm"
            value={sort}
            onChange={e => setSort(e.target.value)}
          >
            {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <button
            className="border rounded px-2 py-1 text-sm bg-white hover:bg-gray-100"
            onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
            title={sortDir === 'asc' ? 'Artan' : 'Azalan'}
          >
            {sortDir === 'asc' ? '▲' : '▼'}
          </button>
        </div>
      </div>
      <div className="overflow-x-auto rounded shadow bg-white">
        <table className="min-w-full border">
          <thead>
            <tr>
              <th className="px-4 py-2 border">ID</th>
              <th className="px-4 py-2 border">Ad</th>
              <th className="px-4 py-2 border">E-posta</th>
              <th className="px-4 py-2 border">Şirket</th>
              <th className="px-4 py-2 border">Aktif</th>
              <th className="px-4 py-2 border">Rol</th>
              <th className="px-4 py-2 border">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => (
              <tr key={user.id} className="text-center hover:bg-blue-50 transition">
                <td className="border px-2 py-1">{user.id}</td>
                <td className="border px-2 py-1">{user.Name}</td>
                <td className="border px-2 py-1">{user.Mail}</td>
                <td className="border px-2 py-1">{user.company?.Name}</td>
                <td className="border px-2 py-1">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${user.is_active ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-red-100 text-red-700 border border-red-300'}`}>
                    {user.is_active ? 'Aktif' : 'Pasif'}
                  </span>
                </td>
                <td className="border px-2 py-1">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${user.is_SuperAdmin ? 'bg-blue-100 text-blue-700 border border-blue-300' : 'bg-gray-100 text-gray-700 border border-gray-300'}`}>
                    {user.is_SuperAdmin ? 'SuperAdmin' : 'Kullanıcı'}
                  </span>
                </td>
                <td className="border px-2 py-1">
                  <button
                    className={`px-3 py-1 rounded bg-${user.is_active ? 'red' : 'green'}-600 text-white hover:bg-${user.is_active ? 'red' : 'green'}-700 text-sm transition`}
                    onClick={() => handleToggleActive(user.id)}
                  >
                    {user.is_active ? 'Pasifleştir' : 'Aktifleştir'}
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-6 text-gray-500">Kullanıcı bulunamadı.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminUsersPage; 