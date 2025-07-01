
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Bell, X, Check, AlertCircle, Info, CheckCircle } from 'lucide-react';

interface Notification {
  id: string | number;
  type: 'lead_qualified' | 'deal_closed' | 'task_due' | 'meeting_reminder' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high';
  read?: boolean;
}

interface NotificationCenterProps {
  notifications: Notification[];
}

export function NotificationCenter({ notifications }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notificationList, setNotificationList] = useState(notifications);

  const unreadCount = notificationList.filter(n => !n.read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'lead_qualified':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'deal_closed':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'task_due':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'meeting_reminder':
        return <Info className="h-4 w-4 text-purple-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const markAsRead = (id: string | number) => {
    setNotificationList(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotificationList(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
  };

  const removeNotification = (id: string | number) => {
    setNotificationList(prev => prev.filter(n => n.id !== id));
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    return `${Math.floor(minutes / 1440)}d ago`;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="border-b p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                Mark all read
              </Button>
            )}
          </div>
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {notificationList.length > 0 ? (
            notificationList.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 border-b hover:bg-gray-50 transition-colors ${
                  !notification.read ? 'bg-blue-50/50' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  {getNotificationIcon(notification.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm truncate">
                        {notification.title}
                      </p>
                      <div className="flex items-center gap-1">
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                            className="h-6 w-6 p-0"
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeNotification(notification.id)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatTimestamp(notification.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center">
              <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No notifications</p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
