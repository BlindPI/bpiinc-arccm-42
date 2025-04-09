
import { useState } from 'react';
import { 
  AlertCircle, 
  Bell, 
  BookOpen, 
  CheckCircle, 
  FileCheck, 
  Info, 
  MailWarning, 
  ShieldAlert, 
  User, 
  Users, 
  XCircle 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { Notification } from '@/types/notifications';
import { useMarkNotificationAsRead } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';

interface NotificationItemProps {
  notification: Notification;
  onClick?: () => void;
}

export function NotificationItem({ notification, onClick }: NotificationItemProps) {
  const [isRead, setIsRead] = useState(notification.read);
  const markAsRead = useMarkNotificationAsRead();

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isRead) return;
    
    markAsRead.mutate(notification.id, {
      onSuccess: () => setIsRead(true)
    });
  };

  const handleClick = () => {
    if (!isRead) {
      handleMarkAsRead(new Event('click') as unknown as React.MouseEvent);
    }
    
    if (notification.action_url) {
      window.location.href = notification.action_url;
    }
    
    if (onClick) onClick();
  };

  const getIcon = () => {
    // First check category
    switch (notification.category) {
      case 'CERTIFICATE':
        return <FileCheck className="h-6 w-6 text-blue-500" />;
      case 'COURSE':
        return <BookOpen className="h-6 w-6 text-green-500" />;
      case 'ACCOUNT':
        return <User className="h-6 w-6 text-purple-500" />;
      case 'SUPERVISION':
        return <Users className="h-6 w-6 text-orange-500" />;
      case 'ROLE_MANAGEMENT':
        return <ShieldAlert className="h-6 w-6 text-indigo-500" />;
      case 'SYSTEM':
        return <MailWarning className="h-6 w-6 text-gray-500" />;
    }
    
    // Then fallback to type
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
  
  const getPriorityBadge = () => {
    switch (notification.priority) {
      case 'LOW':
        return null; // Don't show badge for low priority
      case 'HIGH':
        return <Badge variant="secondary" className="ml-2">High</Badge>;
      case 'URGENT':
        return <Badge variant="destructive" className="ml-2">Urgent</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-colors",
        isRead ? "bg-gray-50" : "bg-white border-l-4",
        {
          "border-l-primary": notification.priority === 'NORMAL',
          "border-l-amber-500": notification.priority === 'HIGH',
          "border-l-red-500": notification.priority === 'URGENT',
          "border-l-slate-300": notification.priority === 'LOW'
        }
      )}
      onClick={handleClick}
    >
      <CardContent className="p-4">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          <div className="flex-grow">
            <div className="flex items-center justify-between mb-1">
              <h4 className={`text-sm font-medium ${isRead ? 'text-gray-700' : 'text-gray-900'} flex items-center`}>
                {notification.title}
                {getPriorityBadge()}
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
            <div className="mt-2 flex items-center justify-between">
              {notification.action_url && (
                <Button 
                  variant="link" 
                  className="h-auto p-0 text-sm text-primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(notification.action_url, '_blank');
                  }}
                >
                  View details
                </Button>
              )}
              
              {!isRead && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-1 text-xs"
                  onClick={handleMarkAsRead}
                >
                  Mark as read
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
