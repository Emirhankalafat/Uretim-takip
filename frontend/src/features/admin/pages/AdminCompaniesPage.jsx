import { useEffect, useState } from 'react';
import api from '../../../services/api';
import { toast } from 'react-hot-toast';

const AdminCompaniesPage = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompanies = async () => {
      setLoading(true);
      try {
        const res = await api.get('/admin/companies');
        setCompanies(res.data.companies || []);
      } catch (err) {
        toast.error('Şirketler yüklenemedi!');
      } finally {
        setLoading(false);
      }
    };
    fetchCompanies();
  }, []);

  if (loading) {
    return <div className="text-center py-10">Yükleniyor...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Şirketler</h1>
      <div className="overflow-x-auto rounded shadow bg-white">
        <table className="min-w-full border">
          <thead>
            <tr>
              <th className="px-4 py-2 border">ID</th>
              <th className="px-4 py-2 border">Ad</th>
              <th className="px-4 py-2 border">Kullanıcı</th>
              <th className="px-4 py-2 border">Ürün</th>
              <th className="px-4 py-2 border">Sipariş</th>
              <th className="px-4 py-2 border">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((company) => (
              <tr key={company.id} className="text-center hover:bg-blue-50 transition">
                <td className="border px-2 py-1">{company.id}</td>
                <td className="border px-2 py-1">{company.Name}</td>
                <td className="border px-2 py-1">{company._count?.users || 0}</td>
                <td className="border px-2 py-1">{company._count?.products || 0}</td>
                <td className="border px-2 py-1">{company._count?.orders || 0}</td>
                <td className="border px-2 py-1">
                  <button className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 text-sm transition">
                    Detay
                  </button>
                </td>
              </tr>
            ))}
            {companies.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-6 text-gray-500">Şirket bulunamadı.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminCompaniesPage; 