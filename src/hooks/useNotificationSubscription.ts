
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function useNotificationSubscription() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user?.id) return;

    // Subscribe to real-time notifications
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('New notification received:', payload);
          
          // Invalidate queries to refresh data
          queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
          queryClient.invalidateQueries({ queryKey: ['notification-count', user.id] });
          
          // Show browser notification if permission granted
          if (window.Notification && window.Notification.permission === 'granted') {
            const notification = payload.new;
            new window.Notification(notification.title, {
              body: notification.message,
              icon: '/lovable-uploads/f753d98e-ff80-4947-954a-67f05f34088c.png',
              badge: '/lovable-uploads/f753d98e-ff80-4947-954a-67f05f34088c.png'
            });
          }
          
          // Show toast notification
          toast.info(payload.new.title, {
            description: payload.new.message,
            duration: 5000,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          // Refresh counts when notifications are updated (marked as read)
          queryClient.invalidateQueries({ queryKey: ['notification-count', user.id] });
          queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);
}
