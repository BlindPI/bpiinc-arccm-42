import { useState } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { NotificationItem } from './NotificationItem';
import { NotificationFilters } from '@/types/notifications';
import { BellOff, Inbox } from 'lucide-react';

interface NotificationListProps {
  filters?: NotificationFilters;
  limit?: number;
  onNotificationClick?: () => void;
  showActions?: boolean;
}

export function NotificationList({ 
  filters = {}, 
  limit, 
  onNotificationClick,
  showActions = true
}: NotificationListProps) {
  const [showAll, setShowAll] = useState(false);
  const { data: notifications = [], isLoading, isError } = useNotifications(filters);
  
  const displayedNotifications = limit && !showAll ? notifications.slice(0, limit) : notifications;
  
  if (isLoading) {
    return (
      <div className="space-y-4 py-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-4 border-b border-gray-100">
            <div className="flex items-start gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/4" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-red-100 p-3 text-red-600 mb-4">
          <Inbox className="h-6 w-6" />
        </div>
        <div className="text-sm text-gray-500">
          Failed to load notifications. Please try again later.
        </div>
      </div>
    );
  }
  
  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-gray-100 p-3 text-gray-500 mb-4">
          <BellOff className="h-6 w-6" />
        </div>
        <div className="text-sm text-gray-500">
          {filters.read === false
            ? "You have no unread notifications"
            : "No notifications yet"}
        </div>
      </div>
    );
  }
  
  return (
    <div className="relative">
      <div className="space-y-0">
        {displayedNotifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onClick={onNotificationClick}
            showActions={showActions}
          />
        ))}
      </div>
      
      {limit && notifications.length > limit && !showAll && (
        <div className="absolute bottom-0 left-0 right-0 flex justify-center py-4 bg-gradient-to-t from-background to-transparent">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowAll(true)}
          >
            Show all {notifications.length} notifications
          </Button>
        </div>
      )}
    </div>
  );
}
