
import { useState } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { NotificationItem } from './NotificationItem';
import { NotificationFilters } from '@/types/notifications';
import { BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NotificationListProps {
  filters?: NotificationFilters;
  onNotificationClick?: () => void;
  limit?: number;
}

export function NotificationList({ filters = {}, onNotificationClick, limit }: NotificationListProps) {
  const [showAll, setShowAll] = useState(false);
  const { data: notifications = [], isLoading, isError } = useNotifications(filters);
  
  const displayedNotifications = limit && !showAll ? notifications.slice(0, limit) : notifications;
  
  if (isLoading) {
    return (
      <div className="space-y-4 py-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-start gap-4 px-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  if (isError) {
    return (
      <div className="flex h-[450px] items-center justify-center text-center">
        <div className="text-sm text-gray-500">
          Failed to load notifications. Please try again later.
        </div>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col h-[450px] items-center justify-center text-center gap-4">
        <BellOff className="h-12 w-12 text-gray-300" />
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
      <ScrollArea className="h-[450px] pr-4">
        <div className="space-y-4 py-4">
          {displayedNotifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onClick={onNotificationClick}
            />
          ))}
        </div>
      </ScrollArea>
      
      {limit && notifications.length > limit && !showAll && (
        <div className="absolute bottom-0 left-0 right-0 flex justify-center py-4 bg-gradient-to-t from-background to-transparent">
          <Button 
            variant="outline" 
            onClick={() => setShowAll(true)}
          >
            Show all {notifications.length} notifications
          </Button>
        </div>
      )}
    </div>
  );
}
