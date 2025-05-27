
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Notification preferences hooks
export function useNotificationPreferences() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['notification-preferences', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('🔍 Error fetching notification preferences:', error);
        throw error;
      }

      console.log('🔍 Fetched notification preferences:', data);
      return data || [];
    },
    enabled: !!user?.id
  });
}

export function useNotificationTypes() {
  return useQuery({
    queryKey: ['notification-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notification_types')
        .select('*')
        .order('category, display_name');

      if (error) {
        console.error('🔍 Error fetching notification types:', error);
        throw error;
      }

      console.log('🔍 Fetched notification types:', data);
      return data || [];
    }
  });
}

export function useUpdateNotificationPreferences() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      category, 
      updates 
    }: {
      category: string;
      updates: {
        in_app_enabled: boolean;
        email_enabled: boolean;
        browser_enabled: boolean;
      };
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      console.log('🔍 Updating notification preferences for category:', { category, updates, userId: user.id });

      // Use upsert to handle the unique constraint properly
      const { data, error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          category: category,
          in_app_enabled: updates.in_app_enabled,
          email_enabled: updates.email_enabled,
          browser_enabled: updates.browser_enabled,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,category'
        })
        .select()
        .single();

      if (error) {
        console.error('🔍 Error updating notification preference:', error);
        throw error;
      }

      console.log('🔍 Successfully updated preference:', data);
      return data;
    },
    onSuccess: () => {
      console.log('🔍 Notification preference update successful');
      queryClient.invalidateQueries({ queryKey: ['notification-preferences', user?.id] });
    },
    onError: (error: any) => {
      console.error('🔍 Failed to update notification preference:', error);
      toast.error(`Failed to save notification preference: ${error.message}`);
    }
  });
}

// Additional notification hooks for other functionality
export function useNotifications(filters?: any) {
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
      if (filters?.read !== undefined) {
        query = query.eq('read', filters.read);
      }
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      if (filters?.priority) {
        query = query.eq('priority', filters.priority);
      }
      if (filters?.searchTerm) {
        query = query.or(`title.ilike.%${filters.searchTerm}%,message.ilike.%${filters.searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id
  });
}

export function useNotificationCount() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['notification-count', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      // Get total count
      const { count: total, error: totalError } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (totalError) throw totalError;

      // Get unread count
      const { count: unread, error: unreadError } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (unreadError) throw unreadError;

      // Get counts by category and priority
      const { data: byCategoryData, error: categoryError } = await supabase
        .from('notifications')
        .select('category, priority, read')
        .eq('user_id', user.id);

      if (categoryError) throw categoryError;

      const byCategoryAndPriority = byCategoryData?.reduce((acc: any, notification) => {
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
        total: total || 0,
        unread: unread || 0,
        byCategoryAndPriority: byCategoryAndPriority || {}
      };
    },
    enabled: !!user?.id
  });
}

export function useMarkNotificationAsRead() {
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
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['notification-count', user?.id] });
    }
  });
}

export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (category?: string) => {
      let query = supabase
        .from('notifications')
        .update({ 
          read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('user_id', user?.id)
        .eq('read', false);

      if (category) {
        query = query.eq('category', category);
      }

      const { error } = await query;

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['notification-count', user?.id] });
      toast.success('All notifications marked as read');
    }
  });
}

export function useDismissNotification() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          is_dismissed: true 
        })
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['notification-count', user?.id] });
    }
  });
}
