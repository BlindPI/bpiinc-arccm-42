
import React, { useCallback } from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  CheckIcon, 
  X, 
  Bell, 
  CalendarClock, 
  FileText, 
  UserCircle, 
  ShieldCheck, 
  Briefcase, 
  AlertTriangle,
  ExternalLink
} from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { useNotifications, useMarkNotificationAsRead, useDismissNotification } from '@/hooks/useNotifications';
import type { NotificationFilters, NotificationCategory } from '@/types/notifications';

interface NotificationListProps {
  filters?: NotificationFilters;
  onNotificationClick?: () => void;
}

export function NotificationList({ filters, onNotificationClick }: NotificationListProps) {
  const { data: notifications = [], isLoading, error } = useNotifications(filters);
  const markAsRead = useMarkNotificationAsRead();
  const dismissNotification = useDismissNotification();

  const handleNotificationClick = useCallback((notificationId: string, actionUrl?: string) => {
    markAsRead.mutate(notificationId);
    
    if (actionUrl) {
      window.open(actionUrl, '_blank');
    }
    
    onNotificationClick?.();
  }, [markAsRead, onNotificationClick]);

  const handleDismiss = useCallback((notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    dismissNotification.mutate(notificationId);
  }, [dismissNotification]);

  // Get category icon
  const getCategoryIcon = (category: NotificationCategory) => {
    switch (category) {
      case 'GENERAL':
        return <Bell className="h-4 w-4" />;
      case 'CERTIFICATE':
        return <FileText className="h-4 w-4" />;
      case 'COURSE':
        return <CalendarClock className="h-4 w-4" />;
      case 'ACCOUNT':
        return <UserCircle className="h-4 w-4" />;
      case 'ROLE_MANAGEMENT':
        return <ShieldCheck className="h-4 w-4" />;
      case 'SUPERVISION':
        return <UserCircle className="h-4 w-4" />;
      case 'INSTRUCTOR':
        return <Briefcase className="h-4 w-4" />;
      case 'PROVIDER':
        return <Briefcase className="h-4 w-4" />;
      case 'SYSTEM':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'HIGH':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'NORMAL':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'LOW':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 mx-auto text-red-500 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Notifications</h3>
        <p className="text-gray-500">Please try again later</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-start space-x-3 p-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="text-center py-12">
        <Bell className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Notifications</h3>
        <p className="text-gray-500">You're all caught up! Check back later for updates.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`
            group relative p-4 rounded-lg border transition-all duration-200 cursor-pointer
            ${notification.read 
              ? 'bg-white border-gray-200 hover:bg-gray-50' 
              : 'bg-blue-50 border-blue-200 hover:bg-blue-100'
            }
            ${getPriorityColor(notification.priority || 'NORMAL')}
          `}
          onClick={() => handleNotificationClick(notification.id, notification.action_url || undefined)}
        >
          {/* Unread indicator */}
          {!notification.read && (
            <div className="absolute top-3 left-3">
              <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
            </div>
          )}

          <div className="flex items-start space-x-3 ml-4">
            {/* Category icon */}
            <div className={`
              p-2 rounded-full 
              ${notification.read ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-600'}
            `}>
              {getCategoryIcon(notification.category as NotificationCategory)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className={`text-sm font-medium ${notification.read ? 'text-gray-900' : 'text-blue-900'} mb-1`}>
                    {notification.title}
                  </h4>
                  <p className={`text-sm ${notification.read ? 'text-gray-600' : 'text-blue-700'} line-clamp-2`}>
                    {notification.message}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-1 ml-2">
                  {notification.action_url && (
                    <ExternalLink className="h-4 w-4 text-gray-400" />
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => handleDismiss(notification.id, e)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Metadata */}
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center space-x-2">
                  {notification.category && (
                    <Badge variant="outline" className="text-xs">
                      {notification.category}
                    </Badge>
                  )}
                  {notification.priority && notification.priority !== 'NORMAL' && (
                    <Badge 
                      variant={notification.priority === 'URGENT' || notification.priority === 'HIGH' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {notification.priority}
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
