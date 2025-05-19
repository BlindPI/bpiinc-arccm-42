
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Notification, NotificationFilters, NotificationPreference } from '@/types/notifications';
import { useEffect } from 'react';

export const useNotifications = (filters?: NotificationFilters) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['notifications', user?.id, filters],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      // Apply filters if provided
      if (filters) {
        if (filters.read !== undefined) {
          query = query.eq('read', filters.read);
        }
        
        if (filters.category) {
          query = query.eq('category', filters.category);
        }
        
        if (filters.priority) {
          query = query.eq('priority', filters.priority);
        }
        
        if (filters.fromDate) {
          query = query.gte('created_at', filters.fromDate);
        }
        
        if (filters.toDate) {
          query = query.lte('created_at', filters.toDate);
        }
        
        if (filters.searchTerm) {
          query = query.or(`title.ilike.%${filters.searchTerm}%,message.ilike.%${filters.searchTerm}%`);
        }
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as Notification[];
    },
    enabled: !!user?.id,
  });
};

export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          read: true,
          read_at: new Date().toISOString() 
        })
        .eq('id', notificationId)
        .eq('user_id', user?.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['notification-count', user?.id] });
    },
    onError: (error: any) => {
      toast.error(`Failed to mark notification as read: ${error.message}`);
    }
  });
};

export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (categoryFilter?: string) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      let query = supabase
        .from('notifications')
        .update({ 
          read: true,
          read_at: new Date().toISOString() 
        })
        .eq('user_id', user.id)
        .eq('read', false);
        
      if (categoryFilter) {
        query = query.eq('category', categoryFilter);
      }
      
      const { error } = await query;
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['notification-count', user?.id] });
      toast.success('All notifications marked as read');
    },
    onError: (error: any) => {
      toast.error(`Failed to mark notifications as read: ${error.message}`);
    }
  });
};

export const useNotificationCount = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['notification-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return { total: 0, unread: 0, byCategoryAndPriority: {} };
      
      // Get total count
      const { count: totalCount, error: totalError } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      if (totalError) throw totalError;
      
      // Get unread count
      const { count: unreadCount, error: unreadError } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false);
      
      if (unreadError) throw unreadError;
      
      // Get counts by category and priority
      const { data: countData, error: countError } = await supabase
        .from('notifications')
        .select('category, priority, read')
        .eq('user_id', user.id);
        
      if (countError) throw countError;
      
      // Process counts by category and priority
      const byCategoryAndPriority: Record<string, any> = {};
      
      if (countData) {
        countData.forEach(notification => {
          const { category, priority, read } = notification;
          
          // Initialize if doesn't exist
          if (!byCategoryAndPriority[category]) {
            byCategoryAndPriority[category] = {
              total: 0,
              unread: 0,
              byPriority: {
                LOW: { total: 0, unread: 0 },
                NORMAL: { total: 0, unread: 0 },
                HIGH: { total: 0, unread: 0 },
                URGENT: { total: 0, unread: 0 }
              }
            };
          }
          
          // Increment category counts
          byCategoryAndPriority[category].total += 1;
          if (!read) {
            byCategoryAndPriority[category].unread += 1;
          }
          
          // Increment priority counts
          if (byCategoryAndPriority[category].byPriority[priority]) {
            byCategoryAndPriority[category].byPriority[priority].total += 1;
            if (!read) {
              byCategoryAndPriority[category].byPriority[priority].unread += 1;
            }
          }
        });
      }
      
      return { 
        total: totalCount || 0, 
        unread: unreadCount || 0,
        byCategoryAndPriority
      };
    },
    enabled: !!user?.id,
  });
};

export const useNotificationPreferences = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['notification-preferences', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      try {
        const { data, error } = await supabase
          .from('notification_preferences')
          .select('*')
          .eq('user_id', user.id);
        
        if (error) throw error;
        return data as NotificationPreference[];
      } catch (error) {
        console.error('Failed to fetch notification preferences:', error);
        return [] as NotificationPreference[];
      }
    },
    enabled: !!user?.id,
  });
};

export const useUpdateNotificationPreferences = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ 
      category, 
      updates 
    }: { 
      category: string, 
      updates: Partial<NotificationPreference> 
    }) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      // Check if preference exists
      const { data: existingPrefs, error: checkError } = await supabase
        .from('notification_preferences')
        .select('id')
        .eq('user_id', user.id)
        .eq('category', category);
      
      if (checkError) throw checkError;
      
      if (existingPrefs && existingPrefs.length > 0) {
        // Update existing preference
        const { error } = await supabase
          .from('notification_preferences')
          .update({
            ...updates,
          })
          .eq('user_id', user.id)
          .eq('category', category);
        
        if (error) throw error;
      } else {
        // Create new preference
        const { error } = await supabase
          .from('notification_preferences')
          .insert([{
            user_id: user.id,
            category,
            ...updates
          }]);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences', user?.id] });
      toast.success('Notification preferences updated');
    },
    onError: (error: any) => {
      toast.error(`Failed to update preferences: ${error.message}`);
    }
  });
};

// Real-time notification subscription
export const useNotificationSubscription = () => {
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
        // Show browser notification if supported and permitted
        if (window.Notification && window.Notification.permission === 'granted') {
          const notificationData = payload.new as Notification;
          
          new window.Notification(notificationData.title, {
            body: notificationData.message,
            icon: notificationData.action_url || '/notification-icon.png'
          });
        }
        
        // Invalidate queries to update UI
        queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
        queryClient.invalidateQueries({ queryKey: ['notification-count', user.id] });
        
        // Show toast for new notification
        toast.info(payload.new.title, {
          description: payload.new.message,
          action: payload.new.action_url ? {
            label: 'View',
            onClick: () => window.open(payload.new.action_url as string, '_blank')
          } : undefined
        });
      })
      .subscribe();
    
    // Request browser notification permission on subscription
    if (window.Notification && window.Notification.permission !== 'denied') {
      window.Notification.requestPermission();
    }
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);
  
  return null;
};
