import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import api from '../../../services/api';
import { useNavigate } from 'react-router-dom';

const CompanyEditPage = () => {
  const { user } = useSelector((state) => state.auth);
  const [companyName, setCompanyName] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user?.is_SuperAdmin) return;
    fetchCompanyInfo();
    // eslint-disable-next-line
  }, [user]);

  const fetchCompanyInfo = async () => {
    setLoading(true);
    setError(null);
    try {
      // Kullanıcının bağlı olduğu şirketi çek
      const res = await api.get('/user/' + user.id);
      setCompanyName(res.data.data.company?.Name || '');
      setCompanyId(res.data.data.company?.id || '');
    } catch (err) {
      setError('Şirket bilgisi alınamadı.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      await api.post('/permissions/update-company-name', {
        companyId,
        newName: companyName
      });
      setSuccess('Şirket ismi başarıyla güncellendi.');
    } catch (err) {
      setError('Güncelleme başarısız.');
    }
  };

  if (!user?.is_SuperAdmin) {
    return (
      <div className="max-w-xl mx-auto mt-24 bg-danger-50 border border-danger-200 rounded-xl p-8 text-center">
        <div className="text-4xl mb-4">⛔</div>
        <h2 className="text-xl font-bold text-danger-800 mb-2">Erişim Reddedildi</h2>
        <p className="text-danger-700">Bu sayfayı sadece SuperAdmin görebilir.</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-10 animate-fade-in">
      <h1 className="text-2xl font-bold text-primary-800 mb-6 flex items-center">
        <span className="mr-2">🏢</span> Şirket İsmini Düzenle
      </h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-soft p-8 border border-gray-100">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Şirket İsmi</label>
          <input
            type="text"
            value={companyName}
            onChange={e => setCompanyName(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>
        <button
          type="submit"
          className="px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-all"
          disabled={loading}
        >
          Kaydet
        </button>
        {success && <div className="mt-4 text-green-700 bg-green-50 border border-green-200 rounded p-2">{success}</div>}
        {error && <div className="mt-4 text-danger-700 bg-danger-50 border border-danger-200 rounded p-2">{error}</div>}
      </form>
      <button
        onClick={() => navigate(-1)}
        className="mt-6 text-primary-600 hover:underline"
      >
        Geri Dön
      </button>
    </div>
  );
};

export default CompanyEditPage; 