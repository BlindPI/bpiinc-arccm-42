import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  BellOff, 
  Check, 
  CheckCheck, 
  Loader2, 
  Settings, 
  Trash2, 
  X,
  MessageSquare,
  Clock,
  ArrowUpDown,
  CheckCircle,
  XCircle,
  ClipboardCheck,
  Megaphone
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { ScrollArea } from '../ui/ScrollArea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/DropdownMenu';
import { Notification, NotificationService } from '../../services/notifications/notificationService';
import { formatDistanceToNow } from 'date-fns';

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  // Real-time notification subscription
  useEffect(() => {
    const subscribeToNotifications = (userId: string) => {
      // Mock subscription for the example
      console.log(`Subscribing to notifications for user ${userId}`);
      
      // In a real implementation, this would use Supabase's realtime features
      // or another realtime service
      
      // Mock initial unread count
      setUnreadCount(3);
    };
    
    // Simulate a logged-in user
    const mockUserId = 'user-123';
    subscribeToNotifications(mockUserId);
    
    return () => {
      // Cleanup subscription
      console.log('Unsubscribing from notifications');
    };
  }, []);
  
  // Load notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen, activeTab]);
  
  const loadNotifications = () => {
    setIsLoading(true);
    
    // Simulate fetching notifications
    setTimeout(() => {
      const mockNotifications: Notification[] = [
        {
          id: '1',
          userId: 'user-123',
          type: 'requirement_assigned',
          title: 'New Requirement Assigned',
          message: 'You have been assigned a new compliance requirement: Annual Security Assessment.',
          link: '/compliance/requirements/req-123',
          created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          read: false
        },
        {
          id: '2',
          userId: 'user-123',
          type: 'submission_approved',
          title: 'Submission Approved',
          message: 'Your submission for "Data Protection Policy" has been approved.',
          link: '/compliance/submissions/sub-456',
          created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          read: false
        },
        {
          id: '3',
          userId: 'user-123',
          type: 'comment_added',
          title: 'New Comment Added',
          message: 'Admin has added a comment to your "Security Training" submission.',
          link: '/compliance/submissions/sub-789',
          created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
          read: false
        },
        {
          id: '4',
          userId: 'user-123',
          type: 'tier_switched',
          title: 'Compliance Tier Changed',
          message: 'Your compliance tier has been changed from Basic to Robust.',
          link: '/compliance/dashboard',
          created_at: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
          read: true
        },
        {
          id: '5',
          userId: 'user-123',
          type: 'system_announcement',
          title: 'System Maintenance',
          message: 'The system will be undergoing maintenance on Saturday from 2-4 AM EST.',
          link: '/announcements',
          created_at: new Date(Date.now() - 345600000).toISOString(), // 4 days ago
          read: true
        }
      ];
      
      // Filter based on active tab
      const filteredNotifications = activeTab === 'unread' 
        ? mockNotifications.filter(n => !n.read)
        : mockNotifications;
      
      setNotifications(filteredNotifications);
      setIsLoading(false);
    }, 500);
  };
  
  const handleMarkAsRead = (notification: Notification) => {
    if (notification.read) return;
    
    // Update local state
    setNotifications(
      notifications.map(n => 
        n.id === notification.id ? { ...n, read: true } : n
      )
    );
    
    // Update unread count
    setUnreadCount(prev => Math.max(0, prev - 1));
    
    // In a real implementation, this would call the NotificationService
    console.log(`Marking notification ${notification.id} as read`);
  };
  
  const handleMarkAllAsRead = () => {
    // Update local state
    setNotifications(
      notifications.map(n => ({ ...n, read: true }))
    );
    
    // Update unread count
    setUnreadCount(0);
    
    // In a real implementation, this would call the NotificationService
    console.log('Marking all notifications as read');
  };
  
  const handleDeleteNotification = (notification: Notification) => {
    // Update local state
    setNotifications(
      notifications.filter(n => n.id !== notification.id)
    );
    
    // Update unread count if needed
    if (!notification.read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    
    // In a real implementation, this would call the NotificationService
    console.log(`Deleting notification ${notification.id}`);
  };
  
  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      handleMarkAsRead(notification);
    }
    
    // Navigate to link in a real implementation
    console.log(`Navigating to ${notification.link}`);
    
    // Close dropdown
    setIsOpen(false);
  };
  
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'requirement_assigned':
        return <ClipboardCheck className="h-4 w-4" />;
      case 'submission_approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'submission_rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'tier_switched':
        return <ArrowUpDown className="h-4 w-4 text-blue-500" />;
      case 'comment_added':
        return <MessageSquare className="h-4 w-4 text-purple-500" />;
      case 'due_date_approaching':
        return <Clock className="h-4 w-4 text-amber-500" />;
      case 'system_announcement':
        return <Megaphone className="h-4 w-4 text-blue-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };
  
  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative p-2">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500 text-white"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-[370px]">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                className="h-8 w-8 p-0"
                onClick={handleMarkAllAsRead}
                title="Mark all as read"
              >
                <CheckCheck className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              className="h-8 w-8 p-0"
              onClick={() => console.log('Open notification settings')}
              title="Notification settings"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </DropdownMenuLabel>
        
        <Tabs value={activeTab} onValueChange={(value) => {
          setActiveTab(value);
        }}>
          <div className="px-3 pb-2">
            <TabsList className="w-full">
              <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
              <TabsTrigger value="unread" className="flex-1">Unread</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value={activeTab} className="m-0">
            <Card className="border-0 shadow-none">
              <ScrollArea className="h-[300px]">
                {isLoading ? (
                  <div className="flex justify-center items-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[250px] text-center p-4">
                    <BellOff className="h-12 w-12 text-gray-400 opacity-20 mb-2" />
                    <p className="text-gray-500">
                      {activeTab === 'unread' 
                        ? "You're all caught up!" 
                        : "No notifications yet"}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {notifications.map(notification => (
                      <div 
                        key={notification.id} 
                        className={`p-3 hover:bg-gray-100 transition-colors cursor-pointer ${
                          !notification.read ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 pt-1">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-start justify-between gap-2">
                              <p className={`text-sm font-medium ${!notification.read ? 'text-blue-600' : ''}`}>
                                {notification.title}
                              </p>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                {!notification.read && (
                                  <Button
                                    variant="ghost"
                                    className="h-6 w-6 p-0 min-w-0"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMarkAsRead(notification);
                                    }}
                                    title="Mark as read"
                                  >
                                    <Check className="h-3 w-3" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  className="h-6 w-6 p-0 min-w-0 text-gray-500"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteNotification(notification);
                                  }}
                                  title="Delete notification"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600">{notification.message}</p>
                            <p className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </Card>
          </TabsContent>
        </Tabs>
        
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="cursor-pointer"
          onClick={() => {
            console.log('Navigate to all notifications');
            setIsOpen(false);
          }}
        >
          View all notifications
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}