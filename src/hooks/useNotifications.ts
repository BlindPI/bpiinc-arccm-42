
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Static notification types data
const NOTIFICATION_TYPES = [
  { id: 'certificate', display_name: 'Certificate Notifications', description: 'Certificate generation and updates', category: 'CERTIFICATE', icon: 'Award', default_priority: 'normal' },
  { id: 'course', display_name: 'Course Notifications', description: 'Course enrollment and completion', category: 'COURSE', icon: 'BookOpen', default_priority: 'normal' },
  { id: 'account', display_name: 'Account Notifications', description: 'Account security and updates', category: 'ACCOUNT', icon: 'User', default_priority: 'high' },
  { id: 'system', display_name: 'System Notifications', description: 'System maintenance and updates', category: 'SYSTEM', icon: 'Settings', default_priority: 'low' }
];

// Default notification preferences
const DEFAULT_PREFERENCES = {
  CERTIFICATE: { in_app_enabled: true, email_enabled: true, browser_enabled: false },
  COURSE: { in_app_enabled: true, email_enabled: true, browser_enabled: false },
  ACCOUNT: { in_app_enabled: true, email_enabled: true, browser_enabled: true },
  SYSTEM: { in_app_enabled: true, email_enabled: false, browser_enabled: false }
};

// Notification preferences hooks
export function useNotificationPreferences() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['notification-preferences', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      // Use user_preferences table with notification_preferences JSON column
      const { data, error } = await supabase
        .from('user_preferences')
        .select('notification_preferences')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('🔍 Error fetching notification preferences:', error);
        // Return default preferences if none exist
        return Object.entries(DEFAULT_PREFERENCES).map(([category, prefs]) => ({
          category,
          ...prefs
        }));
      }

      const preferences = data?.notification_preferences as any || {};
      
      // Merge with defaults for any missing categories
      const result = Object.entries(DEFAULT_PREFERENCES).map(([category, defaultPrefs]) => ({
        category,
        ...defaultPrefs,
        ...(preferences[category] || {})
      }));

      console.log('🔍 Fetched notification preferences:', result);
      return result;
    },
    enabled: !!user?.id
  });
}

export function useNotificationTypes() {
  return useQuery({
    queryKey: ['notification-types'],
    queryFn: async () => {
      console.log('🔍 Returning static notification types:', NOTIFICATION_TYPES);
      return NOTIFICATION_TYPES;
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

      // First get existing preferences
      const { data: existing } = await supabase
        .from('user_preferences')
        .select('notification_preferences')
        .eq('user_id', user.id)
        .single();

      const currentPrefs = (existing?.notification_preferences as any) || {};
      const updatedPrefs = {
        ...currentPrefs,
        [category]: updates
      };

      // Upsert the updated preferences
      const { data, error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          notification_preferences: updatedPrefs,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (error) {
        console.error('🔍 Error updating notification preference:', error);
        throw error;
      }

      console.log('🔍 Successfully updated preference:', data);
      return { category, ...updates };
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
