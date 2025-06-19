
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
import { useCertificateNotificationsList, useCertificateNotificationCount } from '@/hooks/useCertificateNotifications';
import { SimpleCertificateNotificationService } from '@/services/notifications/simpleCertificateNotificationService';

export default function Notifications() {
  const { data: profile } = useProfile();
  const [filter, setFilter] = useState<'all' | 'unread' | 'important'>('all');
  
  // Add logging to validate our diagnosis
  const { data: realNotifications = [], isLoading } = useCertificateNotificationsList();
  const { data: realUnreadCount = 0 } = useCertificateNotificationCount();
  
  useEffect(() => {
    console.log('🔍 NOTIFICATION DIAGNOSIS:');
    console.log('📊 Mock notifications count:', mockNotifications.length);
    console.log('📊 Real certificate notifications count:', realNotifications.length);
    console.log('📊 Mock unread count:', mockNotifications.filter(n => !n.read).length);
    console.log('📊 Real unread count:', realUnreadCount);
    console.log('📋 Real notifications data:', realNotifications);
    console.log('👤 Current user profile:', profile);
    
    if (realNotifications.length === 0 && mockNotifications.length > 0) {
      console.log('❌ PROBLEM CONFIRMED: Using mock data instead of real certificate notifications');
    }
    
    if (realNotifications.length > 0) {
      console.log('✅ Real certificate notifications found - system is working');
    }
  }, [realNotifications, realUnreadCount, profile]);

  const mockNotifications = [
    {
      id: '1',
      title: 'Certificate Request Approved',
      message: 'Your CPR Level C certificate request has been approved.',
      type: 'success',
      category: 'CERTIFICATE',
      read: false,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      priority: 'HIGH'
    },
    {
      id: '2',
      title: 'Course Schedule Updated',
      message: 'The schedule for First Aid Basic course has been updated.',
      type: 'info',
      category: 'COURSE',
      read: false,
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      priority: 'NORMAL'
    },
    {
      id: '3',
      title: 'Compliance Check Required',
      message: 'Your annual compliance check is due in 7 days.',
      type: 'warning',
      category: 'COMPLIANCE',
      read: true,
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      priority: 'HIGH'
    },
    {
      id: '4',
      title: 'New User Registration',
      message: 'John Doe has registered and requires role assignment.',
      type: 'info',
      category: 'USER',
      read: true,
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      priority: 'NORMAL'
    }
  ];

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  const filteredNotifications = mockNotifications.filter(notification => {
    if (filter === 'unread') return !notification.read;
    if (filter === 'important') return notification.priority === 'HIGH';
    return true;
  });

  const unreadCount = mockNotifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Bell className="h-7 w-7 text-primary" />}
        title="Notifications"
        subtitle="Stay updated with system alerts and messages"
        actions={
          <div className="flex gap-2">
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Preferences
            </Button>
            <Button variant="outline">
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
            <div className="text-2xl font-bold mt-2">{mockNotifications.length}</div>
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
              {mockNotifications.filter(n => n.priority === 'HIGH').length}
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
              {mockNotifications.filter(n => n.read).length}
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
                    <Button variant="ghost" size="sm">
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
