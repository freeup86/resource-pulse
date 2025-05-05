import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import StatusBadge from '../common/StatusBadge';
import { RefreshCw, Clock, AlertTriangle, Battery, Mail, Bell } from 'lucide-react';

const NotificationItem = ({ notification, onMarkAsRead }) => {
  const { id, message, type, created_at, is_read } = notification;
  
  const getNotificationIcon = (type) => {
    const iconProps = { size: 16 };
    
    switch (type) {
      case 'allocation_change':
        return <RefreshCw {...iconProps} className="text-blue-500" />;
      case 'deadline_approaching':
        return <Clock {...iconProps} className="text-yellow-500" />;
      case 'resource_conflict':
        return <AlertTriangle {...iconProps} className="text-red-500" />;
      case 'capacity_threshold':
        return <Battery {...iconProps} className="text-orange-500" />;
      case 'weekly_digest':
        return <Mail {...iconProps} className="text-green-500" />;
      default:
        return <Bell {...iconProps} className="text-gray-500" />;
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
        <div className="mr-3 mt-0.5">
          {getNotificationIcon(type)}
        </div>
        <div className="flex-1">
          <p className={`text-sm text-gray-800 ${!is_read ? 'font-semibold' : ''}`}>{message}</p>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-500">
              {created_at ? formatDistanceToNow(new Date(created_at), { addSuffix: true }) : 'Just now'}
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