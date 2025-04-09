
import { useState } from 'react';
import { AlertCircle, Bell, CheckCircle, Info, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Notification } from '@/types/supabase-schema';

interface NotificationItemProps {
  notification: Notification;
  onClick?: () => void;
}

export function NotificationItem({ notification, onClick }: NotificationItemProps) {
  const [isRead, setIsRead] = useState(notification.read);

  const markAsRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isRead) return;
    
    const { error } = await supabase
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('id', notification.id);
    
    if (!error) {
      setIsRead(true);
    }
  };

  const handleClick = () => {
    markAsRead(new Event('click') as unknown as React.MouseEvent);
    
    if (notification.action_url) {
      window.location.href = notification.action_url;
    }
    
    if (onClick) onClick();
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'SUCCESS':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'ERROR':
        return <XCircle className="h-6 w-6 text-red-500" />;
      case 'WARNING':
        return <AlertCircle className="h-6 w-6 text-amber-500" />;
      case 'ACTION':
        return <Bell className="h-6 w-6 text-blue-500" />;
      default:
        return <Info className="h-6 w-6 text-gray-500" />;
    }
  };

  return (
    <Card 
      className={`cursor-pointer transition-colors ${isRead ? 'bg-gray-50' : 'bg-white border-l-4 border-l-primary'}`}
      onClick={handleClick}
    >
      <CardContent className="p-4">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          <div className="flex-grow">
            <div className="flex items-center justify-between mb-1">
              <h4 className={`text-sm font-medium ${isRead ? 'text-gray-700' : 'text-gray-900'}`}>
                {notification.title}
              </h4>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                </span>
                {!isRead && (
                  <Badge className="bg-primary h-2 w-2 rounded-full p-0" />
                )}
              </div>
            </div>
            <p className={`text-sm ${isRead ? 'text-gray-500' : 'text-gray-700'}`}>
              {notification.message}
            </p>
            {notification.action_url && (
              <div className="mt-2">
                <Button 
                  variant="link" 
                  className="h-auto p-0 text-sm text-primary"
                >
                  View details
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
