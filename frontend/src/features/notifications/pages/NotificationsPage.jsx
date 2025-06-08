import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  selectAllNotifications,
  selectNotificationsStatus,
  selectNotificationsPagination,
} from '../notificationsSlice';
import { notificationApiService } from '../services/notificationService';
import NotificationItem from '../components/NotificationItem';

const NotificationsPage = () => {
  const dispatch = useDispatch();
  const notifications = useSelector(selectAllNotifications);
  const status = useSelector(selectNotificationsStatus);
  const pagination = useSelector(selectNotificationsPagination);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    dispatch(fetchNotifications({ page: currentPage, limit: 20 }));
  }, [dispatch, currentPage]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await dispatch(markNotificationAsRead(notificationId));
    } catch (error) {
      console.error('Bildirim okundu olarak işaretlenemedi:', error);
    }
  };

  const handleMarkAllRead = () => {
    dispatch(markAllNotificationsAsRead());
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleCreateTestNotification = async () => {
    try {
      await notificationApiService.createTestNotification({
        message: 'Test bildirimi oluşturuldu!',
        type: 'INFO'
      });
      // Refresh notifications
      dispatch(fetchNotifications({ page: currentPage, limit: 20 }));
    } catch (error) {
      console.error('Test bildirimi oluşturma hatası:', error);
    }
  };

  const renderPagination = () => {
    if (pagination.totalPages <= 1) return null;

    const pages = [];
    for (let i = 1; i <= pagination.totalPages; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
            i === currentPage
              ? 'bg-primary-600 text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          {i}
        </button>
      );
    }

    return (
      <div className="flex items-center justify-center space-x-2 mt-6">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Önceki
        </button>
        {pages}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === pagination.totalPages}
          className="px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Sonraki
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bildirimler</h1>
          <p className="mt-1 text-sm text-gray-500">
            Tüm bildirimlerinizi buradan görüntüleyebilirsiniz
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={handleCreateTestNotification}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Test Bildirimi Oluştur
          </button>
          {notifications.length > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Tümünü Okundu İşaretle
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
        {status === 'loading' && (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Bildirimler yükleniyor...</p>
          </div>
        )}

        {status === 'failed' && (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <p className="text-red-600 font-medium">Bildirimler yüklenirken hata oluştu</p>
            <button
              onClick={() => dispatch(fetchNotifications({ page: currentPage, limit: 20 }))}
              className="mt-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Tekrar Dene
            </button>
          </div>
        )}

        {status === 'succeeded' && notifications.length === 0 && (
          <div className="p-12 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz bildirim yok</h3>
            <p className="text-gray-500">Yeni bildirimler burada görünecek</p>
          </div>
        )}

        {status === 'succeeded' && notifications.length > 0 && (
          <div className="divide-y divide-gray-200">
            {notifications.map((notification) => (
              <div key={notification.id} className="hover:bg-gray-50 transition-colors duration-200">
                <NotificationItem
                  notification={notification}
                  onMarkAsRead={() => handleMarkAsRead(notification.id)}
                  showFullContent={true} // Tam sayfa görünümünde daha detaylı göster
                />
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {renderPagination()}

        {/* Stats */}
        {status === 'succeeded' && pagination.totalCount > 0 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center">
              Toplam {pagination.totalCount} bildirim - Sayfa {pagination.currentPage} / {pagination.totalPages}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage; 