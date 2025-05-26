
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { 
  Notification, 
  NotificationFilters, 
  NotificationPreference, 
  NotificationType,
  NotificationBadge,
  NotificationDigest,
  CreateNotificationParams,
  NotificationCountResult,
  UpdateNotificationPreferenceParams
} from '@/types/notifications';
import { useEffect } from 'react';

/**
 * Hook to fetch notifications with optional filtering
 */
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
        
        if (filters.isDismissed !== undefined) {
          query = query.eq('is_dismissed', filters.isDismissed);
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

/**
 * Hook to mark a notification as read
 */
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
      queryClient.invalidateQueries({ queryKey: ['notification-badges', user?.id] });
    },
    onError: (error: any) => {
      toast.error(`Failed to mark notification as read: ${error.message}`);
    }
  });
};

/**
 * Hook to mark a notification as dismissed
 */
export const useDismissNotification = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          is_dismissed: true,
          updated_at: new Date().toISOString() 
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
      toast.error(`Failed to dismiss notification: ${error.message}`);
    }
  });
};

/**
 * Hook to mark all notifications as read
 */
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
      queryClient.invalidateQueries({ queryKey: ['notification-badges', user?.id] });
      toast.success('All notifications marked as read');
    },
    onError: (error: any) => {
      toast.error(`Failed to mark notifications as read: ${error.message}`);
    }
  });
};

/**
 * Hook to get notification counts
 */
export const useNotificationCount = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['notification-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return { total: 0, unread: 0, byCategoryAndPriority: {} } as NotificationCountResult;
      
      // Get total count
      const { count: totalCount, error: totalError } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_dismissed', false);
      
      if (totalError) throw totalError;
      
      // Get unread count
      const { count: unreadCount, error: unreadError } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false)
        .eq('is_dismissed', false);
      
      if (unreadError) throw unreadError;
      
      // Get counts by category and priority
      const { data: countData, error: countError } = await supabase
        .from('notifications')
        .select('category, priority, read')
        .eq('user_id', user.id)
        .eq('is_dismissed', false);
        
      if (countError) throw countError;
      
      // Get badge counts by page
      const { data: badgeData, error: badgeError } = await supabase
        .from('notification_badges')
        .select('page_path, badge_count')
        .eq('user_id', user.id)
        .gt('badge_count', 0);
        
      if (badgeError) throw badgeError;
      
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
      
      // Process badge counts by page
      const byPage: Record<string, number> = {};
      
      if (badgeData) {
        badgeData.forEach(badge => {
          byPage[badge.page_path] = badge.badge_count;
        });
      }
      
      return { 
        total: totalCount || 0, 
        unread: unreadCount || 0,
        byCategoryAndPriority,
        byPage
      } as NotificationCountResult;
    },
    enabled: !!user?.id,
  });
};

/**
 * Hook to get notification badges for pages/tabs
 */
export const useNotificationBadges = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['notification-badges', user?.id],
    queryFn: async () => {
      if (!user?.id) return [] as NotificationBadge[];
      
      const { data, error } = await supabase
        .from('notification_badges')
        .select('*')
        .eq('user_id', user.id)
        .gt('badge_count', 0);
      
      if (error) throw error;
      return data as NotificationBadge[];
    },
    enabled: !!user?.id,
  });
};

/**
 * Hook to clear notification badges for a specific page
 */
export const useClearPageBadges = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (pagePath: string) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { error } = await supabase.rpc('mark_page_notifications_as_read', {
        p_user_id: user.id,
        p_page_path: pagePath
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['notification-count', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['notification-badges', user?.id] });
    },
    onError: (error: any) => {
      toast.error(`Failed to clear page badges: ${error.message}`);
    }
  });
};

/**
 * Hook to get notification types
 */
export const useNotificationTypes = () => {
  return useQuery({
    queryKey: ['notification-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notification_types')
        .select('*')
        .order('category')
        .order('display_name');
      
      if (error) throw error;
      return data as NotificationType[];
    }
  });
};

/**
 * Hook to get notification preferences
 */
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
        
        console.log('Fetched notification preferences:', data);
        return data as NotificationPreference[];
      } catch (error) {
        console.error('Failed to fetch notification preferences:', error);
        return [] as NotificationPreference[];
      }
    },
    enabled: !!user?.id,
  });
};

/**
 * Hook to update notification preferences
 */
export const useUpdateNotificationPreferences = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ 
      notificationTypeId, 
      updates 
    }: UpdateNotificationPreferenceParams) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      console.log('updateNotificationPreferences called with:', {
        userId: user.id,
        notificationTypeId,
        updates
      });
      
      // First get the notification type to get its category
      const { data: notificationType, error: typeError } = await supabase
        .from('notification_types')
        .select('category')
        .eq('id', notificationTypeId)
        .single();
      
      if (typeError) {
        console.error('Error fetching notification type:', typeError);
        throw typeError;
      }
      
      console.log('Found notification type:', notificationType);
      
      // Check if preference exists for this category
      const { data: existingPrefs, error: checkError } = await supabase
        .from('notification_preferences')
        .select('id')
        .eq('user_id', user.id)
        .eq('category', notificationType.category);
      
      if (checkError) {
        console.error('Error checking existing preferences:', checkError);
        throw checkError;
      }
      
      console.log('Existing preferences for category:', existingPrefs);
      
      if (existingPrefs && existingPrefs.length > 0) {
        // Update existing preference by category
        console.log('Updating existing preference');
        const { error } = await supabase
          .from('notification_preferences')
          .update({
            ...updates,
            notification_type_id: notificationTypeId, // Store the type ID for reference
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)
          .eq('category', notificationType.category);
        
        if (error) {
          console.error('Error updating preference:', error);
          throw error;
        }
      } else {
        // Create new preference with category
        console.log('Creating new preference');
        const { error } = await supabase
          .from('notification_preferences')
          .insert([{
            user_id: user.id,
            notification_type_id: notificationTypeId,
            category: notificationType.category,
            in_app_enabled: true,
            email_enabled: true,
            browser_enabled: false,
            ...updates
          }]);
        
        if (error) {
          console.error('Error creating preference:', error);
          throw error;
        }
      }
      
      console.log('Preference update completed successfully');
    },
    onSuccess: () => {
      console.log('Invalidating queries after preference update');
      queryClient.invalidateQueries({ queryKey: ['notification-preferences', user?.id] });
      toast.success('Notification preferences updated');
    },
    onError: (error: any) => {
      console.error('Preference update failed:', error);
      toast.error(`Failed to update preferences: ${error.message}`);
    }
  });
};

/**
 * Hook to get notification digest settings
 */
export const useNotificationDigests = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['notification-digests', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('notification_digests')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data as NotificationDigest[];
    },
    enabled: !!user?.id,
  });
};

/**
 * Hook to update notification digest settings
 */
export const useUpdateNotificationDigest = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ 
      digestType, 
      isEnabled,
      nextScheduledAt 
    }: { 
      digestType: 'daily' | 'weekly', 
      isEnabled: boolean,
      nextScheduledAt?: string
    }) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('notification_digests')
        .update({ 
          is_enabled: isEnabled,
          next_scheduled_at: nextScheduledAt
        })
        .eq('user_id', user.id)
        .eq('digest_type', digestType);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-digests', user?.id] });
      toast.success('Digest settings updated');
    },
    onError: (error: any) => {
      toast.error(`Failed to update digest settings: ${error.message}`);
    }
  });
};

/**
 * Hook to create a notification
 */
export const useCreateNotification = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (params: CreateNotificationParams) => {
      const { data, error } = await supabase.functions.invoke('send-notification', {
        body: {
          userId: params.userId,
          title: params.title,
          message: params.message,
          type: params.type || 'INFO',
          category: params.category || 'GENERAL',
          priority: params.priority || 'NORMAL',
          actionUrl: params.actionUrl,
          sendEmail: params.sendEmail !== false,
          metadata: {
            ...params.metadata,
            page_path: params.pagePath
          }
        }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['notifications', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['notification-count', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['notification-badges', variables.userId] });
    },
    onError: (error: any) => {
      toast.error(`Failed to create notification: ${error.message}`);
    }
  });
};

/**
 * Real-time notification subscription
 */
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
          const notification = payload.new as Notification;
          
          new window.Notification(notification.title, {
            body: notification.message,
            icon: notification.action_url || '/notification-icon.png'
          });
        }
        
        // Invalidate queries to update UI
        queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
        queryClient.invalidateQueries({ queryKey: ['notification-count', user.id] });
        queryClient.invalidateQueries({ queryKey: ['notification-badges', user.id] });
        
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
