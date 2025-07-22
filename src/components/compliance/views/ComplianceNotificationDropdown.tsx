import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Bell, CheckCircle, AlertCircle, XCircle, Clock, FileText } from 'lucide-react';
import {
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ComplianceNotification } from '@/contexts/ComplianceDashboardContext';

interface ComplianceNotificationDropdownProps {
  notifications: ComplianceNotification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
}

interface NotificationItemProps {
  notification: ComplianceNotification;
  onMarkRead: () => void;
}

function NotificationItem({ notification, onMarkRead }: NotificationItemProps) {
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'document_approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'document_rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'document_uploaded':
        return <FileText className="h-4 w-4 text-blue-600" />;
      case 'action_due':
        return <Clock className="h-4 w-4 text-orange-600" />;
      case 'tier_changed':
        return <AlertCircle className="h-4 w-4 text-purple-600" />;
      default:
        return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  const getNotificationBgColor = (type: string) => {
    switch (type) {
      case 'document_approved':
        return 'bg-green-50 hover:bg-green-100';
      case 'document_rejected':
        return 'bg-red-50 hover:bg-red-100';
      case 'document_uploaded':
        return 'bg-blue-50 hover:bg-blue-100';
      case 'action_due':
        return 'bg-orange-50 hover:bg-orange-100';
      case 'tier_changed':
        return 'bg-purple-50 hover:bg-purple-100';
      default:
        return 'bg-gray-50 hover:bg-gray-100';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return 'Recently';
    }
  };

  return (
    <DropdownMenuItem
      className={`flex flex-col items-start space-y-1 p-3 cursor-pointer ${getNotificationBgColor(notification.type)} ${
        !notification.read ? 'border-l-4 border-l-blue-500' : ''
      }`}
      onClick={onMarkRead}
    >
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center space-x-2">
          {getNotificationIcon(notification.type)}
          <span className="font-medium text-sm">{notification.title}</span>
          {!notification.read && (
            <Badge variant="secondary" className="h-2 w-2 p-0 rounded-full bg-blue-500"></Badge>
          )}
        </div>
        <span className="text-xs text-gray-500">{formatTimestamp(notification.timestamp)}</span>
      </div>
      <p className="text-xs text-gray-600 w-full text-left">{notification.message}</p>
    </DropdownMenuItem>
  );
}

export function ComplianceNotificationDropdown({
  notifications,
  onMarkRead,
  onMarkAllRead,
}: ComplianceNotificationDropdownProps) {
  const unreadNotifications = notifications.filter(n => !n.read);
  const recentNotifications = notifications.slice(0, 8); // Show up to 8 recent notifications

  return (
    <DropdownMenuContent align="end" className="w-96 max-h-96 overflow-y-auto">
      <DropdownMenuLabel className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Bell className="h-4 w-4" />
          <span>Notifications</span>
          {unreadNotifications.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {unreadNotifications.length} unread
            </Badge>
          )}
        </div>
        {unreadNotifications.length > 0 && (
          <Button variant="ghost" size="sm" onClick={onMarkAllRead} className="text-xs">
            Mark all read
          </Button>
        )}
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      
      <div className="space-y-1">
        {recentNotifications.length > 0 ? (
          recentNotifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkRead={() => onMarkRead(notification.id)}
            />
          ))
        ) : (
          <DropdownMenuItem disabled className="text-center text-gray-500 py-4">
            <div className="flex flex-col items-center space-y-2">
              <Bell className="h-8 w-8 text-gray-300" />
              <span>No notifications</span>
            </div>
          </DropdownMenuItem>
        )}
      </div>
      
      {notifications.length > 8 && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled className="text-center text-xs text-gray-500">
            Showing {recentNotifications.length} of {notifications.length} notifications
          </DropdownMenuItem>
        </>
      )}
    </DropdownMenuContent>
  );
}