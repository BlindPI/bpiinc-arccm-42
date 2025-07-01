import { useState } from 'react';
import { 
  CheckCircle, 
  AlertCircle, 
  Info, 
  AlertTriangle, 
  Clock, 
  X,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Notification } from '@/types/notifications';
import { useMarkNotificationAsRead, useDismissNotification } from '@/hooks/useNotifications';

interface NotificationItemProps {
  notification: Notification;
  onClick?: () => void;
  showActions?: boolean;
}

export function NotificationItem({ notification, onClick, showActions = true }: NotificationItemProps) {
  const [isRead, setIsRead] = useState(notification.read);
  const [isDismissed, setIsDismissed] = useState(notification.is_dismissed);
  const markAsRead = useMarkNotificationAsRead();
  const dismissNotification = useDismissNotification();
  
  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isRead) return;
    
    markAsRead.mutate(notification.id, {
      onSuccess: () => setIsRead(true)
    });
  };
  
  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    dismissNotification.mutate(notification.id, {
      onSuccess: () => setIsDismissed(true)
    });
  };
  
  const handleClick = () => {
    if (onClick) onClick();
    
    if (!isRead) {
      markAsRead.mutate(notification.id, {
        onSuccess: () => setIsRead(true)
      });
    }
    
    if (notification.action_url) {
      window.location.href = notification.action_url;
    }
  };
  
  const getIcon = () => {
    // First check category
    switch (notification.category) {
      case 'CERTIFICATE':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'COURSE':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'ACCOUNT':
        return <AlertCircle className="h-5 w-5 text-purple-500" />;
      case 'SYSTEM':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
    }
    
    // Then fallback to type
    switch (notification.type) {
      case 'SUCCESS':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'ERROR':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'WARNING':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'INFO':
        return <Info className="h-5 w-5 text-blue-500" />;
      case 'ACTION':
        return <ExternalLink className="h-5 w-5 text-purple-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };
  
  const getPriorityBadge = () => {
    switch (notification.priority) {
      case 'LOW':
        return null; // No badge for low priority
      case 'NORMAL':
        return null; // No badge for normal priority
      case 'HIGH':
        return (
          <Badge variant="outline" className="ml-2 border-amber-500 text-amber-700 text-[10px]">
            High
          </Badge>
        );
      case 'URGENT':
        return (
          <Badge variant="outline" className="ml-2 border-red-500 text-red-700 text-[10px]">
            Urgent
          </Badge>
        );
      default:
        return null;
    }
  };
  
  if (isDismissed) return null;
  
  return (
    <div 
      className={cn(
        "p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors",
        {
          "bg-white": isRead,
          "bg-blue-50": !isRead,
          "border-l-4 border-l-primary": notification.priority === 'NORMAL',
          "border-l-4 border-l-amber-500": notification.priority === 'HIGH',
          "border-l-4 border-l-red-500": notification.priority === 'URGENT',
          "border-l-4 border-l-slate-300": notification.priority === 'LOW'
        }
      )}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div>
              <h4 className={`text-sm font-medium ${isRead ? 'text-gray-700' : 'text-gray-900'} flex items-center`}>
                {notification.title}
                {getPriorityBadge()}
                {notification.badge_count && notification.badge_count > 1 && (
                  <Badge variant="secondary" className="ml-2 text-[10px]">
                    {notification.badge_count}
                  </Badge>
                )}
              </h4>
              <span className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
              </span>
            </div>
            
            {showActions && (
              <div className="flex space-x-1">
                {!isRead && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 text-blue-500 hover:text-blue-700"
                    onClick={handleMarkAsRead}
                  >
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 text-gray-400 hover:text-gray-600"
                  onClick={handleDismiss}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          
          <p className={`text-sm ${isRead ? 'text-gray-500' : 'text-gray-700'}`}>
            {notification.message}
          </p>
          <div className="mt-2 flex items-center justify-between">
            {notification.action_url && (
              <Button
                variant="link"
                size="sm"
                className="p-0 h-auto text-xs text-primary hover:text-primary/80"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(notification.action_url, '_blank');
                }}
              >
                View Details <ExternalLink className="ml-1 h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
