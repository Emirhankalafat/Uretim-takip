import React, { useState, useEffect } from 'react';
import { 
  CpuChipIcon, 
  CircleStackIcon, 
  ServerIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

const SystemMonitoringPage = () => {
  const [monitoringData, setMonitoringData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const fetchMonitoringData = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/monitoring', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      const result = await response.json();
      
      if (response.ok) {
        setMonitoringData(result.data);
        setLastUpdated(new Date());
      } else {
        console.error('Monitoring data fetch failed:', result.message);
      }
    } catch (error) {
      console.error('Monitoring fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonitoringData();
  }, []);

  useEffect(() => {
    let interval;
    if (autoRefresh) {
      interval = setInterval(fetchMonitoringData, 30000); // 30 saniye
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const formatUptime = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const getStatusColor = (value, threshold) => {
    if (value > threshold * 0.9) return 'text-red-600 bg-red-50';
    if (value > threshold * 0.7) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const MetricCard = ({ title, value, unit, icon: Icon, status, subtitle }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <Icon className={`h-8 w-8 ${status}`} />
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
            <dd className="flex items-baseline">
              <div className="text-2xl font-semibold text-gray-900">
                {value}
                {unit && <span className="text-sm ml-1 text-gray-500">{unit}</span>}
              </div>
            </dd>
            {subtitle && (
              <dd className="text-sm text-gray-500">{subtitle}</dd>
            )}
          </dl>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Sistem verileri yükleniyor...</span>
      </div>
    );
  }

  if (!monitoringData) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Sistem verileri alınamadı</h3>
        <p className="mt-1 text-sm text-gray-500">Lütfen sayfayı yenileyin veya daha sonra tekrar deneyin.</p>
        <div className="mt-6">
          <button
            onClick={fetchMonitoringData}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <ArrowPathIcon className="h-5 w-5 mr-2" />
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Sistem İzleme
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Gerçek zamanlı sistem performans metrikleri
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="autoRefresh"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="autoRefresh" className="ml-2 text-sm text-gray-700">
                Otomatik yenile (30s)
              </label>
            </div>
            <button
              onClick={fetchMonitoringData}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <ArrowPathIcon className="h-4 w-4 mr-1" />
              Yenile
            </button>
          </div>
        </div>
      </div>

      {/* Last Updated */}
      {lastUpdated && (
        <div className="text-sm text-gray-500">
          Son güncelleme: {lastUpdated.toLocaleTimeString('tr-TR')}
        </div>
      )}

      {/* Alerts */}
      {monitoringData.performance.alerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Sistem Uyarıları</h3>
              <div className="mt-2 text-sm text-red-700">
                <ul className="list-disc pl-5 space-y-1">
                  {monitoringData.performance.alerts.map((alert, index) => (
                    <li key={index}>{alert}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Server Metrics */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Sunucu Metrikleri</h3>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Çalışma Süresi"
            value={formatUptime(monitoringData.server.uptime)}
            icon={ClockIcon}
            status="text-blue-600"
          />
          <MetricCard
            title="CPU Kullanımı"
            value={monitoringData.server.cpu}
            unit="%"
            icon={CpuChipIcon}
            status={getStatusColor(monitoringData.server.cpu, 100)}
          />
          <MetricCard
            title="Memory (Heap)"
            value={monitoringData.server.memory.heapUsed}
            unit="MB"
            subtitle={`/ ${monitoringData.server.memory.heapTotal} MB`}
            icon={ServerIcon}
            status={getStatusColor(monitoringData.performance.memoryUsagePercent, 100)}
          />
          <MetricCard
            title="RSS Memory"
            value={monitoringData.server.memory.rss}
            unit="MB"
            icon={ServerIcon}
            status="text-gray-600"
          />
        </div>
      </div>

      {/* Database Metrics */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Veritabanı Metrikleri</h3>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Yanıt Süresi"
            value={monitoringData.database.responseTime}
            unit="ms"
            icon={CircleStackIcon}
            status={getStatusColor(monitoringData.database.responseTime, 1000)}
          />
          <MetricCard
            title="Aktif Bağlantılar"
            value={monitoringData.database.activeConnections}
            subtitle={`/ ${monitoringData.database.maxConnections} max`}
            icon={CircleStackIcon}
            status={getStatusColor(monitoringData.database.activeConnections, monitoringData.database.maxConnections)}
          />
          <MetricCard
            title="Yavaş Sorgular"
            value={monitoringData.database.slowQueries}
            icon={ExclamationTriangleIcon}
            status={monitoringData.database.slowQueries > 0 ? "text-yellow-600" : "text-green-600"}
          />
          <MetricCard
            title="Pool Kullanımı"
            value={Math.round((monitoringData.database.activeConnections / monitoringData.database.maxConnections) * 100)}
            unit="%"
            icon={CircleStackIcon}
            status={getStatusColor(monitoringData.database.activeConnections, monitoringData.database.maxConnections)}
          />
        </div>
      </div>

      {/* Statistics */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Sistem İstatistikleri</h3>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Toplam Kullanıcılar"
            value={monitoringData.statistics.totalUsers}
            icon={CheckCircleIcon}
            status="text-green-600"
          />
          <MetricCard
            title="Toplam Şirketler"
            value={monitoringData.statistics.totalCompanies}
            icon={CheckCircleIcon}
            status="text-green-600"
          />
          <MetricCard
            title="Toplam Siparişler"
            value={monitoringData.statistics.totalOrders}
            icon={CheckCircleIcon}
            status="text-green-600"
          />
          <MetricCard
            title="Aktif Oturumlar"
            value={monitoringData.statistics.activeSessions}
            icon={CheckCircleIcon}
            status="text-blue-600"
          />
        </div>
      </div>

      {/* Slow Queries */}
      {monitoringData.performance.slowQueries.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Yavaş Sorgular</h3>
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {monitoringData.performance.slowQueries.map((query, index) => (
                <li key={index} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {query.query}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(query.timestamp).toLocaleTimeString('tr-TR')}
                      </p>
                    </div>
                    <div className="ml-2 flex-shrink-0">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {query.duration}ms
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemMonitoringPage;
