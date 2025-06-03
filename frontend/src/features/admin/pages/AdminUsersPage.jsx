import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import api from '../../../services/api';
import { toast } from 'react-hot-toast';

const AdminUsersPage = () => {
  const { token } = useSelector((state) => state.adminAuth);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return <div className="text-center py-10">Yükleniyor...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Kullanıcı Yönetimi</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
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
            {users.map((user) => (
              <tr key={user.id} className="text-center">
                <td className="border px-2 py-1">{user.id}</td>
                <td className="border px-2 py-1">{user.Name}</td>
                <td className="border px-2 py-1">{user.Mail}</td>
                <td className="border px-2 py-1">{user.company?.Name}</td>
                <td className="border px-2 py-1">
                  <span className={user.is_active ? 'text-green-600' : 'text-red-600'}>
                    {user.is_active ? 'Aktif' : 'Pasif'}
                  </span>
                </td>
                <td className="border px-2 py-1">
                  {user.is_SuperAdmin ? 'SuperAdmin' : 'Kullanıcı'}
                </td>
                <td className="border px-2 py-1">
                  <button
                    className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 text-sm"
                    onClick={() => handleToggleActive(user.id)}
                  >
                    {user.is_active ? 'Pasifleştir' : 'Aktifleştir'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminUsersPage; 