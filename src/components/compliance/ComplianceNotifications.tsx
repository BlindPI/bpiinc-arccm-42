import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  CheckCircle,
  AlertTriangle,
  Upload,
  Settings,
  X
} from 'lucide-react';
import { useComplianceDashboard } from '@/contexts/ComplianceDashboardContext';
import { toast } from 'sonner';

export function ComplianceNotifications() {
  const { state, dispatch } = useComplianceDashboard();
  const [showAll, setShowAll] = useState(false);
  const [lastNotificationCount, setLastNotificationCount] = useState(0);

  const unreadNotifications = state.notifications.filter(n => !n.read);
  const visibleNotifications = showAll
    ? state.notifications.slice(0, 5)
    : unreadNotifications.slice(0, 3);

  // Show toast for new notifications
  useEffect(() => {
    const currentCount = state.notifications.length;
    if (currentCount > lastNotificationCount && lastNotificationCount > 0) {
      const newNotification = state.notifications[0]; // Latest notification
      if (newNotification && !newNotification.read) {
        const icon = getNotificationIcon(newNotification.type);
        toast(newNotification.title, {
          description: newNotification.message,
          duration: 5000,
        });
      }
    }
    setLastNotificationCount(currentCount);
  }, [state.notifications.length, lastNotificationCount]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'document_uploaded':
        return <Upload className="h-4 w-4" />;
      case 'document_approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'document_rejected':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'action_due':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'tier_changed':
        return <Settings className="h-4 w-4 text-blue-600" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const markAsRead = (notificationId: string) => {
    dispatch({ type: 'MARK_NOTIFICATION_READ', payload: notificationId });
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return timestamp;
    }
  };

  if (state.notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-20 right-4 z-50 w-80 max-w-sm">
      {/* Notification Bell Indicator */}
      {unreadNotifications.length > 0 && !showAll && (
        <div className="mb-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAll(true)}
            className="w-full justify-between"
          >
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              New notifications
            </div>
            <Badge variant="destructive">
              {unreadNotifications.length}
            </Badge>
          </Button>
        </div>
      )}

      {/* Notification List */}
      {showAll && (
        <div className="bg-white rounded-lg shadow-lg border max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between p-3 border-b">
            <h3 className="font-medium">Notifications</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAll(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="divide-y">
            {visibleNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 hover:bg-gray-50 transition-colors ${
                  !notification.read ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          {formatTimestamp(notification.timestamp)}
                        </p>
                      </div>
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                          className="ml-2"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {state.notifications.length > visibleNotifications.length && (
            <div className="p-3 border-t text-center">
              <Button variant="ghost" size="sm">
                View all notifications
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}