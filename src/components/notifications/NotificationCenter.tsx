
import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, X, Bell } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import type { Notification } from '@/types/unified-crm';

interface NotificationCenterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotificationCenter({ open, onOpenChange }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const queryClient = useQueryClient();

  const { data: rawNotifications = [] } = useQuery({
    queryKey: ['user-notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      // Transform database notifications to match our type
      return data.map(notification => ({
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: ['SUCCESS', 'ERROR', 'WARNING', 'INFO', 'ACTION'].includes(notification.type) 
          ? notification.type as 'SUCCESS' | 'ERROR' | 'WARNING' | 'INFO' | 'ACTION'
          : 'INFO',
        category: notification.category,
        priority: notification.priority,
        read: notification.read,
        read_at: notification.read_at,
        created_at: notification.created_at,
        updated_at: notification.updated_at,
        user_id: notification.user_id,
        metadata: notification.metadata as Record<string, any> || {},
        action_url: notification.action_url,
        badge_count: notification.badge_count,
        is_dismissed: notification.is_dismissed
      }));
    }
  });

  useEffect(() => {
    if (rawNotifications) {
      setNotifications(rawNotifications);
    }
  }, [rawNotifications]);

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('user_notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-notifications'] });
    }
  });

  const dismissMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('user_notifications')
        .update({ is_dismissed: true })
        .eq('id', notificationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-notifications'] });
    }
  });

  const handleMarkAsRead = (notificationId: string) => {
    markAsReadMutation.mutate(notificationId);
  };

  const handleDismiss = (notificationId: string) => {
    dismissMutation.mutate(notificationId);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive">{unreadCount}</Badge>
            )}
          </SheetTitle>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-100px)] mt-6">
          <div className="space-y-4">
            {notifications.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                No notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border rounded-lg ${
                    !notification.read ? 'bg-blue-50 border-blue-200' : 'bg-background'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium">{notification.title}</h4>
                        <Badge variant={notification.type === 'ERROR' ? 'destructive' : 'default'}>
                          {notification.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {format(new Date(notification.created_at), 'MMM dd, yyyy at h:mm a')}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {!notification.read && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleMarkAsRead(notification.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDismiss(notification.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
