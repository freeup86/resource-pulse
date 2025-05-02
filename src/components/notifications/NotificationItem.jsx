import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import StatusBadge from '../common/StatusBadge';

const NotificationItem = ({ notification, onMarkAsRead }) => {
  const { id, message, type, created_at, is_read } = notification;
  
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'allocation_change':
        return <i className="fas fa-exchange-alt text-blue-500"></i>;
      case 'deadline_approaching':
        return <i className="fas fa-clock text-yellow-500"></i>;
      case 'resource_conflict':
        return <i className="fas fa-exclamation-triangle text-red-500"></i>;
      case 'capacity_threshold':
        return <i className="fas fa-battery-three-quarters text-orange-500"></i>;
      case 'weekly_digest':
        return <i className="fas fa-envelope text-green-500"></i>;
      default:
        return <i className="fas fa-bell text-gray-500"></i>;
    }
  };

  const handleClick = () => {
    if (!is_read) {
      onMarkAsRead(id);
    }
  };

  return (
    <div 
      className={`p-3 border-b hover:bg-gray-50 cursor-pointer ${!is_read ? 'bg-blue-50' : ''}`}
      onClick={handleClick}
    >
      <div className="flex items-start">
        <div className="mr-3">
          {getNotificationIcon(type)}
        </div>
        <div className="flex-1">
          <p className={`text-sm ${!is_read ? 'font-semibold' : ''}`}>{message}</p>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(created_at), { addSuffix: true })}
            </span>
            {!is_read && (
              <StatusBadge status="new" text="New" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationItem;