import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bell, 
  Settings, 
  Check, 
  Trash2,
  Filter,
  Search,
  Mail,
  AlertTriangle,
  Info,
  CheckCircle
} from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { PageHeader } from '@/components/ui/PageHeader';
import { useCertificateNotificationsList, useCertificateNotificationCount, useMarkCertificateNotificationAsRead } from '@/hooks/useCertificateNotifications';
import { SimpleCertificateNotificationService } from '@/services/notifications/simpleCertificateNotificationService';
import { createTestNotifications, clearTestNotifications } from '@/utils/testNotificationSystem';
import { toast } from 'sonner';

export default function Notifications() {
  const { data: profile } = useProfile();
  const [filter, setFilter] = useState<'all' | 'unread' | 'important'>('all');
  
  // Use real certificate notifications
  const { data: realNotifications = [], isLoading } = useCertificateNotificationsList();
  const { data: realUnreadCount = 0 } = useCertificateNotificationCount();
  const markAsRead = useMarkCertificateNotificationAsRead();
  
  useEffect(() => {
    console.log('✅ NOTIFICATION SYSTEM FIXED:');
    console.log('📊 Certificate notifications count:', realNotifications.length);
    console.log('📊 Unread count:', realUnreadCount);
    console.log('📋 Notifications data:', realNotifications);
    console.log('👤 Current user profile:', profile);
    
    if (realNotifications.length === 0) {
      console.log('ℹ️ No certificate notifications yet - this is normal for new users');
    } else {
      console.log('✅ Certificate notifications loaded successfully');
    }
  }, [realNotifications, realUnreadCount, profile]);

  // Helper functions to map certificate notification types to UI types
  function getNotificationTypeFromCertificateType(type: string): string {
    switch (type) {
      case 'batch_approved':
      case 'certificate_approved':
        return 'success';
      case 'batch_rejected':
      case 'certificate_rejected':
        return 'warning';
      case 'batch_submitted':
        return 'info';
      default:
        return 'info';
    }
  }
  
  function getPriorityFromCertificateType(type: string): string {
    switch (type) {
      case 'batch_approved':
      case 'certificate_approved':
      case 'batch_rejected':
      case 'certificate_rejected':
        return 'HIGH';
      case 'batch_submitted':
        return 'NORMAL';
      default:
        return 'NORMAL';
    }
  }

  // Use real certificate notifications instead of mock data
  const notifications = realNotifications.map(notification => ({
    id: notification.id,
    title: notification.title,
    message: notification.message,
    type: getNotificationTypeFromCertificateType(notification.notification_type),
    category: 'CERTIFICATE',
    read: !!notification.read_at,
    timestamp: notification.created_at,
    priority: getPriorityFromCertificateType(notification.notification_type)
  }));

  // Handle marking notification as read
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead.mutateAsync(notificationId);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };
  
  // Handle marking all notifications as read
  const handleMarkAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      await Promise.all(
        unreadNotifications.map(notification =>
          markAsRead.mutateAsync(notification.id)
        )
      );
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  // Test functions for demonstration
  const handleCreateTestNotifications = async () => {
    try {
      await createTestNotifications();
      toast.success('Test notifications created successfully!');
    } catch (error) {
      toast.error('Failed to create test notifications');
      console.error(error);
    }
  };

  const handleClearNotifications = async () => {
    try {
      await clearTestNotifications();
      toast.success('All notifications cleared!');
    } catch (error) {
      toast.error('Failed to clear notifications');
      console.error(error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.read;
    if (filter === 'important') return notification.priority === 'HIGH';
    return true;
  });

  const unreadCount = realUnreadCount;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Bell className="h-7 w-7 text-primary" />}
        title="Notifications"
        subtitle="Stay updated with system alerts and messages"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCreateTestNotifications}>
              Add Test Data
            </Button>
            <Button variant="outline" size="sm" onClick={handleClearNotifications}>
              Clear All
            </Button>
            <Button
              variant="outline"
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
            >
              <Check className="h-4 w-4 mr-2" />
              Mark All Read
            </Button>
          </div>
        }
      />

      {/* Notification Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-600" />
              <span className="font-medium">Total</span>
            </div>
            <div className="text-2xl font-bold mt-2">{notifications.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-orange-600" />
              <span className="font-medium">Unread</span>
            </div>
            <div className="text-2xl font-bold mt-2">{unreadCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span className="font-medium">Important</span>
            </div>
            <div className="text-2xl font-bold mt-2">
              {notifications.filter(n => n.priority === 'HIGH').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="font-medium">Read</span>
            </div>
            <div className="text-2xl font-bold mt-2">
              {notifications.filter(n => n.read).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Notifications</CardTitle>
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                All
              </Button>
              <Button
                variant={filter === 'unread' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('unread')}
              >
                Unread ({unreadCount})
              </Button>
              <Button
                variant={filter === 'important' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('important')}
              >
                Important
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2 text-muted-foreground">Loading notifications...</span>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {filter === 'unread' ? 'No Unread Notifications' :
                 filter === 'important' ? 'No Important Notifications' :
                 'No Notifications'}
              </h3>
              <p className="text-gray-500">
                {notifications.length === 0
                  ? "You'll receive notifications here when there are certificate updates."
                  : "All caught up! No notifications match your current filter."
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-4 p-4 border rounded-lg ${
                    !notification.read ? 'bg-blue-50/50 border-blue-200' : ''
                  }`}
                >
                  <div className="mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{notification.title}</h4>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {notification.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(notification.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMarkAsRead(notification.id)}
                        title="Mark as read"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
