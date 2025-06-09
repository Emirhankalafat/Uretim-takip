// NotificationIcon.jsx
import React, { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchUnreadCount, selectUnreadNotificationCount } from '../notificationsSlice';

const NotificationIcon = ({ onClick }) => {
  const dispatch = useDispatch();
  const unreadCount = useSelector(selectUnreadNotificationCount);
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Sadece bir kez çağır
    if (!hasInitialized.current) {
      dispatch(fetchUnreadCount());
      hasInitialized.current = true;
    }
  }, [dispatch]);

  return (
    <button
      onClick={onClick}
      className="relative p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 transition-all duration-200"
      title="Bildirimler"
    >
      <span className="sr-only">Bildirimleri görüntüle</span>
      {/* Bell icon */}
      <svg 
        className="h-6 w-6" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth="1.5" 
        stroke="currentColor" 
        aria-hidden="true"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" 
        />
      </svg>
      
      {/* Unread count badge */}
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[1.25rem] h-5 text-xs font-bold leading-none text-white bg-gradient-to-r from-red-500 to-red-600 rounded-full px-1.5 shadow-md animate-pulse">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
};

export default NotificationIcon;
