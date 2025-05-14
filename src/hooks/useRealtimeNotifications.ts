
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Notification } from '@/types/notifications';

export function useRealtimeNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  useEffect(() => {
    if (!user?.id) return;
    
    // Set up real-time subscription for new notifications
    const channel = supabase
      .channel('public:notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        // Extract the notification from the payload
        const newNotification = payload.new as Notification;
        
        // Show browser notification if supported and permitted
        if (window.Notification && Notification.permission === 'granted') {
          new window.Notification(newNotification.title, {
            body: newNotification.message,
            icon: newNotification.action_url || '/notification-icon.png'
          });
        }
        
        // Show toast notification
        toast.info(newNotification.title, {
          description: newNotification.message,
          duration: 5000,
          action: newNotification.action_url ? {
            label: 'View',
            onClick: () => {
              window.open(newNotification.action_url as string, '_blank');
            }
          } : undefined
        });
        
        // Invalidate queries to update UI
        queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
        queryClient.invalidateQueries({ queryKey: ['notification-count', user.id] });
      })
      .subscribe();
    
    // Request browser notification permission if not already granted
    if (window.Notification && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);
  
  return null;
}
