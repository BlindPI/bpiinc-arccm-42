
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';

export function useNotificationSubscription() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user?.id) return;

    console.log('🔍 Setting up notification subscription for user:', user.id);

    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🔍 Notification change received:', payload);
          
          // Invalidate notification queries to refresh data
          queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
          queryClient.invalidateQueries({ queryKey: ['notification-count', user.id] });
          
          // Show browser notification if supported and permission granted
          if (window.Notification && window.Notification.permission === 'granted' && payload.eventType === 'INSERT') {
            const notification = payload.new as any;
            if (notification && notification.title) {
              new window.Notification(notification.title, {
                body: notification.message,
                icon: '/favicon.ico'
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      console.log('🔍 Cleaning up notification subscription');
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);
}
