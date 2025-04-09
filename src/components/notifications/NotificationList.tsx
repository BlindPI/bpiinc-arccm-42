
import { useNotifications } from '@/hooks/useNotifications';
import { ScrollArea } from '@/components/ui/scroll-area';
import { NotificationItem } from './NotificationItem';
import { Skeleton } from '@/components/ui/skeleton';

interface NotificationListProps {
  onNotificationClick?: () => void;
}

export function NotificationList({ onNotificationClick }: NotificationListProps) {
  const { data: notifications = [], isLoading } = useNotifications();

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

  if (notifications.length === 0) {
    return (
      <div className="flex h-[450px] items-center justify-center text-center">
        <div className="text-sm text-gray-500">
          No notifications yet
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[450px] pr-4">
      <div className="space-y-4 py-4">
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onClick={onNotificationClick}
          />
        ))}
      </div>
    </ScrollArea>
  );
}
