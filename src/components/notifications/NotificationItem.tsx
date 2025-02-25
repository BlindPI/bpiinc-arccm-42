
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import type { Notification } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, FileWarning, Files } from 'lucide-react';
import { cn } from '@/lib/utils';

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

  const getIcon = () => {
    switch (notification.type) {
      case 'DOCUMENT_EXPIRING':
        return <FileWarning className="h-5 w-5 text-amber-500" />;
      case 'DOCUMENT_EXPIRED':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'DOCUMENT_APPROVED':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'DOCUMENT_REJECTED':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Files className="h-5 w-5 text-gray-500" />;
    }
  };

  const getBackgroundColor = () => {
    if (notification.read_at) return 'bg-white';
    
    switch (notification.type) {
      case 'DOCUMENT_EXPIRING':
        return 'bg-amber-50';
      case 'DOCUMENT_EXPIRED':
        return 'bg-red-50';
      case 'DOCUMENT_APPROVED':
        return 'bg-green-50';
      case 'DOCUMENT_REJECTED':
        return 'bg-red-50';
      default:
        return 'bg-blue-50';
    }
  };

  const handleAction = () => {
    if (notification.metadata?.document_url) {
      window.open(notification.metadata.document_url, '_blank');
    }
    handleMarkAsRead();
  };

  return (
    <div
      className={cn(
        'rounded-lg border p-4 transition-colors hover:bg-gray-50',
        getBackgroundColor()
      )}
    >
      <div className="space-y-1">
        <div className="flex items-start gap-3">
          {getIcon()}
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <h4 className="font-medium">{notification.title}</h4>
              <span className="text-xs text-gray-500">
                {notification.created_at
                  ? formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })
                  : ''}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
            
            {notification.metadata?.document_type && (
              <div className="mt-2 text-xs text-gray-500">
                Document type: {notification.metadata.document_type}
                {notification.metadata.expiry_date && (
                  <span className="ml-2">
                    Expires: {new Date(notification.metadata.expiry_date).toLocaleDateString()}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-3 flex justify-end gap-2">
          {notification.metadata?.document_url && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleAction}
              className="text-xs"
            >
              View Document
            </Button>
          )}
          {!notification.read_at && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAsRead}
              className="text-xs"
            >
              Mark as read
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
