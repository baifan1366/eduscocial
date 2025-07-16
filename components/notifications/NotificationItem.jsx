'use client';

import { Heart, MessageCircle, UserPlus, Bell } from 'lucide-react';

// Simple date formatting function to replace date-fns
const formatTimeAgo = (date) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now - new Date(date)) / 1000);
  
  if (diffInSeconds < 60) {
    return 'just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else {
    const months = Math.floor(diffInSeconds / 2592000);
    return `${months} month${months > 1 ? 's' : ''} ago`;
  }
};

const getNotificationIcon = (type) => {
  switch (type) {
    case 'like':
      return <Heart className="w-4 h-4 text-red-500" />;
    case 'comment':
      return <MessageCircle className="w-4 h-4 text-blue-500" />;
    case 'reply':
      return <MessageCircle className="w-4 h-4 text-green-500" />;
    case 'follow':
      return <UserPlus className="w-4 h-4 text-green-500" />;
    case 'mention':
      return <Bell className="w-4 h-4 text-yellow-500" />;
    default:
      return <Bell className="w-4 h-4 text-gray-500" />;
  }
};

export default function NotificationItem({ notification, onMarkAsRead }) {
  const handleClick = () => {
    if (!notification.read) {
      onMarkAsRead([notification.id]);
    }
  };

  return (
    <div
      className={`p-3 rounded-lg cursor-pointer transition-colors ${
        notification.read 
          ? 'bg-gray-700 hover:bg-gray-600' 
          : 'bg-gray-600 hover:bg-gray-500 border-l-4 border-[#FF7D00]'
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-1">
          {getNotificationIcon(notification.type)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className={`text-sm font-medium ${
              notification.read ? 'text-gray-300' : 'text-white'
            }`}>
              {notification.title}
            </p>
            {!notification.read && (
              <div className="w-2 h-2 bg-[#FF7D00] rounded-full flex-shrink-0"></div>
            )}
          </div>
          
          <p className={`text-sm mt-1 ${
            notification.read ? 'text-gray-400' : 'text-gray-200'
          }`}>
            {notification.message}
          </p>
          
          <p className="text-xs text-gray-500 mt-2">
            {formatTimeAgo(notification.created_at)}
          </p>
        </div>
      </div>
    </div>
  );
}