
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import type { Notification } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';

interface NotificationItemProps {
  notification: Notification;
  onClick?: () => void;
}

export function NotificationItem({ notification, onClick }: NotificationItemProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const handleMarkAsRead = async () => {
    if (!user?.id || notification.read_at) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notification.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
      onClick?.();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  return (
    <div
      className={`rounded-lg border p-4 transition-colors hover:bg-gray-50 ${
        notification.read_at ? 'bg-white' : 'bg-blue-50'
      }`}
    >
      <div className="space-y-1">
        <div className="flex items-start justify-between">
          <h4 className="font-medium">{notification.title}</h4>
          <span className="text-xs text-gray-500">
            {notification.created_at
              ? formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })
              : ''}
          </span>
        </div>
        <p className="text-sm text-gray-500">{notification.message}</p>
        {!notification.read_at && (
          <div className="mt-2 flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAsRead}
            >
              Mark as read
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

