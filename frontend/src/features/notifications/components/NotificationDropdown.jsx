// frontend/src/features/notifications/components/NotificationDropdown.jsx
import React, { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom'; // React Router kullanıyorsanız
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  selectAllNotifications,
  selectNotificationsStatus,
  // selectNotificationsPagination, // Gerekirse sayfalama için
} from '../notificationsSlice';
import NotificationItem from './NotificationItem'; // Bir sonraki adımda oluşturacağız

const NotificationDropdown = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const allNotifications = useSelector(selectAllNotifications);
  // Sadece okunmamış bildirimler göster
  const unreadNotifications = allNotifications.filter(notification => !notification.isRead);
  const status = useSelector(selectNotificationsStatus);
  // const pagination = useSelector(selectNotificationsPagination);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (isOpen && !hasFetchedRef.current && status === 'idle') {
      hasFetchedRef.current = true;
      dispatch(fetchNotifications({ page: 1, limit: 5 }));
    }
    
    // Dropdown kapandığında fetch flag'ini reset et
    if (!isOpen) {
      hasFetchedRef.current = false;
    }
  }, [isOpen, status, dispatch]);

  const handleMarkAsRead = (notificationId) => {
    dispatch(markNotificationAsRead(notificationId));
  };

  const handleMarkAllRead = () => {
    dispatch(markAllNotificationsAsRead());
  };

  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40"
        onClick={onClose}
      />
      
      {/* Dropdown */}
      <div
        className="absolute right-0 mt-2 w-80 sm:w-96 origin-top-right bg-white divide-y divide-gray-100 rounded-xl shadow-strong ring-1 ring-black ring-opacity-5 focus:outline-none z-50 border border-gray-200"
        role="menu"
        aria-orientation="vertical"
        aria-labelledby="menu-button"
        tabIndex="-1"
      >
        {/* Header */}
        <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-xl border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-900">Bildirimler</h3>
            </div>
            {unreadNotifications.length > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-primary-600 hover:text-primary-700 font-medium hover:underline transition-colors duration-200"
              >
                Tümünü okundu işaretle
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="py-1 max-h-60 sm:max-h-80 overflow-y-auto" role="none">
          {status === 'loading' && (
            <div className="px-4 py-6 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-500">Yükleniyor...</p>
            </div>
          )}
          
          {status === 'failed' && (
            <div className="px-4 py-6 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              </div>
              <p className="text-sm text-red-600">Bildirimler yüklenirken hata oluştu.</p>
            </div>
          )}
          
          {status === 'succeeded' && unreadNotifications.length === 0 && (
            <div className="px-4 py-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
              </div>
              <p className="text-sm text-gray-500 font-medium">Yeni bildirim yok</p>
              <p className="text-xs text-gray-400 mt-1">Bildirimler burada görünecek</p>
            </div>
          )}
          
          {status === 'succeeded' && unreadNotifications.length > 0 &&
            unreadNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={() => handleMarkAsRead(notification.id)}
                onCloseDropdown={onClose}
              />
            ))
          }
        </div>
        
        {/* Footer */}
        {allNotifications.length > 0 && (
          <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-b-xl border-t border-gray-200">
            <Link
              to="/notifications"
              onClick={onClose}
              className="block w-full py-2.5 text-sm text-center text-primary-600 hover:text-primary-700 font-medium hover:bg-white rounded-lg transition-all duration-200 border border-transparent hover:border-primary-200"
              role="menuitem"
              tabIndex="-1"
            >
              Tüm bildirimleri görüntüle
            </Link>
          </div>
        )}
      </div>
    </>
  );
};

export default NotificationDropdown;
