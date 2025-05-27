
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
      notificationTypeId, 
      updates 
    }: {
      notificationTypeId: string;
      updates: {
        in_app_enabled: boolean;
        email_enabled: boolean;
        browser_enabled: boolean;
      };
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      console.log('🔍 Updating notification preferences:', { notificationTypeId, updates, userId: user.id });

      // First, try to update existing preference
      const { data: existingPref } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .eq('notification_type_id', notificationTypeId)
        .single();

      if (existingPref) {
        console.log('🔍 Updating existing preference');
        const { data, error } = await supabase
          .from('notification_preferences')
          .update({
            in_app_enabled: updates.in_app_enabled,
            email_enabled: updates.email_enabled,
            browser_enabled: updates.browser_enabled,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)
          .eq('notification_type_id', notificationTypeId)
          .select()
          .single();

        if (error) {
          console.error('🔍 Error updating notification preference:', error);
          throw error;
        }

        console.log('🔍 Successfully updated preference:', data);
        return data;
      } else {
        console.log('🔍 Creating new preference');
        
        // Get the notification type to determine category
        const { data: notificationType } = await supabase
          .from('notification_types')
          .select('category')
          .eq('id', notificationTypeId)
          .single();

        const { data, error } = await supabase
          .from('notification_preferences')
          .insert({
            user_id: user.id,
            notification_type_id: notificationTypeId,
            category: notificationType?.category || 'GENERAL',
            in_app_enabled: updates.in_app_enabled,
            email_enabled: updates.email_enabled,
            browser_enabled: updates.browser_enabled
          })
          .select()
          .single();

        if (error) {
          console.error('🔍 Error creating notification preference:', error);
          throw error;
        }

        console.log('🔍 Successfully created preference:', data);
        return data;
      }
    },
    onSuccess: () => {
      console.log('🔍 Notification preference update successful');
      // Invalidate and refetch notification preferences
      queryClient.invalidateQueries({ queryKey: ['notification-preferences', user?.id] });
    },
    onError: (error: any) => {
      console.error('🔍 Failed to update notification preference:', error);
      toast.error(`Failed to save notification preference: ${error.message}`);
    }
  });
}

// Additional notification hooks for other functionality
export function useNotifications() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
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
    }
  });
}
