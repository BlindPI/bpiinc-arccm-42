import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { formatDistanceToNow } from 'date-fns';
import { 
  useCertificateNotificationsList, 
  useCertificateNotificationCount, 
  useMarkCertificateNotificationAsRead,
  useCertificateNotificationSubscription 
} from '@/hooks/useCertificateNotifications';
import { CertificateNotification } from '@/services/notifications/simpleCertificateNotificationService';

export function SimpleCertificateNotificationBell() {
  const [open, setOpen] = useState(false);
  const { data: notifications = [], isLoading } = useCertificateNotificationsList();
  const { data: unreadCount = 0 } = useCertificateNotificationCount();
  const markAsRead = useMarkCertificateNotificationAsRead();
  
  // Enable real-time notifications
  useCertificateNotificationSubscription();

  const handleNotificationClick = (notification: CertificateNotification) => {
    if (!notification.read_at) {
      markAsRead.mutate(notification.id);
    }
    
    // Navigate to certificates page if needed
    if (notification.certificate_request_id || notification.batch_id) {
      window.location.href = '/certificates';
    }
  };

  const getNotificationIcon = (type: CertificateNotification['notification_type']) => {
    switch (type) {
      case 'batch_submitted':
        return '📤';
      case 'batch_approved':
        return '✅';
      case 'batch_rejected':
        return '❌';
      case 'certificate_approved':
        return '🎓';
      case 'certificate_rejected':
        return '⚠️';
      default:
        return '📋';
    }
  };

  const getNotificationColor = (type: CertificateNotification['notification_type']) => {
    switch (type) {
      case 'batch_approved':
      case 'certificate_approved':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'batch_rejected':
      case 'certificate_rejected':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'batch_submitted':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent className="w-96">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Certificate Notifications
            {unreadCount > 0 && (
              <Badge variant="secondary">{unreadCount} unread</Badge>
            )}
          </SheetTitle>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-120px)] mt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No certificate notifications yet</p>
              <p className="text-sm">You'll be notified about certificate updates here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification, index) => (
                <div key={notification.id}>
                  <div
                    className={`
                      p-4 rounded-lg border cursor-pointer transition-all hover:shadow-sm
                      ${notification.read_at 
                        ? 'bg-white border-gray-200' 
                        : getNotificationColor(notification.notification_type)
                      }
                    `}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-2xl flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.notification_type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <h4 className={`text-sm font-medium ${
                            notification.read_at ? 'text-gray-900' : 'text-gray-900'
                          }`}>
                            {notification.title}
                          </h4>
                          {!notification.read_at && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                          )}
                        </div>
                        
                        <p className={`text-sm mt-1 ${
                          notification.read_at ? 'text-gray-600' : 'text-gray-700'
                        }`}>
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </span>
                          
                          {notification.email_sent && (
                            <span className="text-xs text-green-600 flex items-center gap-1">
                              ✉️ Email sent
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {index < notifications.length - 1 && <Separator className="my-2" />}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        
        {notifications.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => {
                window.location.href = '/certificates';
                setOpen(false);
              }}
            >
              View All Certificates
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}