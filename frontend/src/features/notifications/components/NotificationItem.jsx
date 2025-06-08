// frontend/src/features/notifications/components/NotificationItem.jsx
import React from 'react';
import { Link } from 'react-router-dom'; // Bildirimde link varsa yönlendirme için
import { formatDistanceToNow } from 'date-fns'; // Tarihi "X dakika önce" gibi göstermek için
import { tr } from 'date-fns/locale'; // Türkçe lokalleştirme

// İkonları bildirim tipine göre eşleştirebiliriz
import {
  InformationCircleIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ShoppingCartIcon,
  TruckIcon,
  UserGroupIcon,
  ArchiveBoxIcon,
  BellAlertIcon, // Genel veya bilinmeyen tip için
} from '@heroicons/react/24/outline';

const getNotificationIcon = (type) => {
  switch (type) {
    case 'INFO':
      return (
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
          <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
          </svg>
        </div>
      );
    case 'WARNING':
      return (
        <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
          <svg className="h-4 w-4 text-yellow-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
      );
    case 'ERROR':
      return (
        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
          <svg className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
      );
    case 'SUCCESS':
      return (
        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
          <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      );
    case 'NEW_ORDER':
      return (
        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
          <svg className="h-4 w-4 text-purple-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
          </svg>
        </div>
      );
    case 'ORDER_STATUS_UPDATE':
      return (
        <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
          <svg className="h-4 w-4 text-teal-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m4.5 4.5V19.5a1.5 1.5 0 001.5 1.5h3M2.25 13.5h16.5v1.875c0 .621-.504 1.125-1.125 1.125H3.375A1.125 1.125 0 012.25 14.625V13.5z" />
          </svg>
        </div>
      );
    case 'TASK_ASSIGNED':
      return (
        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
          <svg className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
          </svg>
        </div>
      );
    case 'STOCK_ALERT':
      return (
        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
          <svg className="h-4 w-4 text-orange-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
          </svg>
        </div>
      );
    case 'GENERAL':
    default:
      return (
        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
          <svg className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
        </div>
      );
  }
};

const NotificationItem = ({ notification, onMarkAsRead, onCloseDropdown, showFullContent = false }) => {
  const timeAgo = notification.createdAt
    ? formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: tr })
    : '';

  const handleMainClick = async () => {
    if (!notification.isRead) {
      try {
        await onMarkAsRead();
      } catch (error) {
        console.error('Bildirim okundu olarak işaretlenemedi:', error);
      }
    }
  };

  const handleMarkAsReadClick = async (e) => {
    e.preventDefault();
    e.stopPropagation(); 
    try {
      await onMarkAsRead();
    } catch (error) {
      console.error('Bildirim okundu olarak işaretlenemedi:', error);
    }
  };

  const itemContent = (
    <div
      className={`w-full p-4 flex items-start space-x-3 hover:bg-gray-50 transition-colors duration-200 ${
        notification.isRead ? '' : 'bg-gradient-to-r from-primary-50/50 to-blue-50/50 border-l-4 border-primary-500'
      }`}
    >
      <div className="flex-shrink-0 pt-0.5">
        {getNotificationIcon(notification.type)}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-5 ${
          notification.isRead ? 'text-gray-700' : 'font-semibold text-gray-900'
        }`}>
          {notification.message}
        </p>
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-gray-500">{timeAgo}</p>
          {!notification.isRead && (
            <div 
              onClick={handleMarkAsReadClick}
              className="text-xs text-primary-600 hover:text-primary-700 font-medium hover:underline focus:outline-none transition-colors duration-200 cursor-pointer"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleMarkAsReadClick(e);
                }
              }}
            >
              Okundu işaretle
            </div>
          )}
        </div>
        {!notification.isRead && (
          <div className="mt-2">
            <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
          </div>
        )}
      </div>
    </div>
  );

  if (notification.linkTo) {
    return (
      <Link
        to={notification.linkTo}
        onClick={() => {
          if (!notification.isRead) {
            onMarkAsRead();
          }
          if (onCloseDropdown) onCloseDropdown();
        }}
        className="block w-full text-left focus:outline-none focus:bg-gray-100 transition-colors duration-200"
        role="menuitem"
      >
        {itemContent}
      </Link>
    );
  }

  return (
    <div
      onClick={handleMainClick}
      className="block w-full text-left focus:outline-none focus:bg-gray-100 transition-colors duration-200 cursor-pointer"
      role="menuitem"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleMainClick();
        }
      }}
    >
      {itemContent}
    </div>
  );
};

export default NotificationItem;
