import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import api from '../../../services/api';
import { toast } from 'react-hot-toast';
import {
  UsersIcon,
  BuildingOfficeIcon,
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon,
  UserPlusIcon,
  BuildingLibraryIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const AdminDashboardPage = () => {
  const { token } = useSelector((state) => state.auth);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await api.get('/admin/stats');
        setStats(response.data.stats);
        setError(null);
      } catch (err) {
        console.error('İstatistik yükleme hatası:', err);
        setError('İstatistikler yüklenirken bir hata oluştu.');
        toast.error('İstatistikler yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [token]);

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="overflow-hidden rounded-lg bg-white shadow">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Icon className={`h-6 w-6 text-${color}-600`} aria-hidden="true" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="truncate text-sm font-medium text-gray-500">{title}</dt>
              <dd>
                <div className="text-lg font-medium text-gray-900">{value}</div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">İstatistikler yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4 my-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Hata</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Sistem genel durumunu ve istatistiklerini görüntüleyin.
        </p>
      </div>

      <div className="mt-6">
        <h2 className="text-lg font-medium text-gray-900">Genel İstatistikler</h2>
        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="Toplam Şirket"
            value={stats?.totalCompanies || 0}
            icon={BuildingOfficeIcon}
            color="blue"
          />
          <StatCard
            title="Toplam Kullanıcı"
            value={stats?.totalUsers || 0}
            icon={UsersIcon}
            color="green"
          />
          <StatCard
            title="Aktif Kullanıcı"
            value={stats?.activeUsers || 0}
            icon={UsersIcon}
            color="green"
          />
          <StatCard
            title="Toplam Sipariş"
            value={stats?.totalOrders || 0}
            icon={ClipboardDocumentListIcon}
            color="purple"
          />
          <StatCard
            title="Yeni Şirketler (30 gün)"
            value={stats?.newCompanies || 0}
            icon={BuildingLibraryIcon}
            color="indigo"
          />
          <StatCard
            title="Yeni Kullanıcılar (30 gün)"
            value={stats?.newUsers || 0}
            icon={UserPlusIcon}
            color="teal"
          />
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900">Abonelik İstatistikleri</h2>
        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {stats?.subscriptionStats?.map((sub) => (
            <div key={sub.Suspscription_package} className="overflow-hidden rounded-lg bg-white shadow">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <BuildingOfficeIcon className="h-6 w-6 text-blue-600" aria-hidden="true" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="truncate text-sm font-medium text-gray-500">
                        {sub.Suspscription_package} Paketi
                      </dt>
                      <dd>
                        <div className="text-lg font-medium text-gray-900">
                          {sub._count.id} şirket
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          ))}
          <div className="overflow-hidden rounded-lg bg-orange-50 shadow">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClockIcon className="h-6 w-6 text-orange-600" aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="truncate text-sm font-medium text-orange-700">
                      Yakında Bitecek Abonelikler
                    </dt>
                    <dd>
                      <div className="text-lg font-medium text-orange-900">
                        {stats?.expiringSubscriptions || 0} şirket
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage; 