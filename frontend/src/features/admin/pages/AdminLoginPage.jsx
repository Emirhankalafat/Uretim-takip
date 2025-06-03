import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import { toast } from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { adminLoginStart, adminLoginSuccess, adminLoginFailure } from '../adminAuthSlice';

const AdminLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((state) => state.adminAuth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(adminLoginStart());
    try {
      const response = await api.post('/auth/admin-login', {
        email,
        password
      });
      // Token ve CSRF token'ı kaydet
      localStorage.setItem('admin_token', response.data.token);
      if (response.data.csrfToken) {
        localStorage.setItem('csrf_token', response.data.csrfToken);
      }
      dispatch(adminLoginSuccess({
        admin: response.data.admin,
        token: response.data.token
      }));
      toast.success('Giriş başarılı!');
      navigate('/admin');
    } catch (err) {
      dispatch(adminLoginFailure(err.response?.data?.message || 'Giriş başarısız!'));
      toast.error(err.response?.data?.message || 'Giriş başarısız!');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded shadow">
        <h2 className="text-2xl font-bold mb-6 text-center">Admin Girişi</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">E-posta</label>
            <input
              type="email"
              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Şifre</label>
            <input
              type="password"
              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 transition"
            disabled={loading}
          >
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLoginPage; 