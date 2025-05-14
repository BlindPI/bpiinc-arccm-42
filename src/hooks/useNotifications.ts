
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { toast } from 'sonner';
import type { Notification } from '@/types/notifications';

interface NotificationCounts {
  total: number;
  unread: number;
  byCategoryAndPriority?: Record<string, { total: number; unread: number }>;
}

// Hook to fetch notification counts
export function useNotificationCount() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['notificationCount', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        return { total: 0, unread: 0 };
      }

      // Fetch notifications to calculate counts
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching notification counts:', error);
        throw error;
      }

      // Calculate counts
      const total = data.length;
      const unread = data.filter(n => !n.read).length;

      // Calculate counts by category and priority
      const byCategoryAndPriority = data.reduce((acc: any, notification) => {
        const category = notification.category || 'GENERAL';
        if (!acc[category]) {
          acc[category] = { total: 0, unread: 0 };
        }

        acc[category].total++;
        if (!notification.read) {
          acc[category].unread++;
        }

        return acc;
      }, {});

      return {
        total,
        unread,
        byCategoryAndPriority
      } as NotificationCounts;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    refetchOnWindowFocus: true,
  });
}

// Hook to fetch notifications with filtering
export function useNotifications(filters = {}) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['notifications', user?.id, filters],
    queryFn: async () => {
      if (!user?.id) {
        return [];
      }

      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.hasOwnProperty('read')) {
        query = query.eq('read', filters.read);
      }

      if (filters.category && filters.category !== 'all') {
        query = query.eq('category', filters.category);
      }

      if (filters.priority) {
        query = query.eq('priority', filters.priority);
      }

      if (filters.searchTerm) {
        query = query.or(`title.ilike.%${filters.searchTerm}%,message.ilike.%${filters.searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching notifications:', error);
        throw error;
      }

      return data as Notification[];
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true
  });
}

// Hook to subscribe to notifications in realtime
export function useNotificationSubscription() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user?.id) return;

    // Create a channel for realtime notifications
    const channel = supabase
      .channel('db-notifications')
      .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          }, 
          (payload) => {
            console.log('Notification change detected:', payload);
            
            // Invalidate queries to refresh notification data
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notificationCount'] });
            
            // Show toast for new notifications
            if (payload.eventType === 'INSERT') {
              const notification = payload.new;
              // Only show toast for high priority notifications
              if (notification.priority === 'HIGH' || notification.priority === 'URGENT') {
                toast.info(notification.title, {
                  description: notification.message,
                  duration: 6000,
                });
              }
            }
          })
      .subscribe();

    // Clean up subscription
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  return null;
}

// Hook to mark all notifications as read
export function useMarkAllNotificationsAsRead() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (category?: string) => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      let query = supabase
        .from('notifications')
        .update({
          read: true,
          read_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('read', false);

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error marking notifications as read:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notificationCount'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to mark notifications as read: ${error.message}`);
    }
  });
}

// Hook to mark a single notification as read
export function useMarkNotificationAsRead() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('notifications')
        .update({
          read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error marking notification as read:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notificationCount'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to mark notification as read: ${error.message}`);
    }
  });
}
