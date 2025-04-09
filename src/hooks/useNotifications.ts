
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Notification } from '@/types/supabase-schema';

export function useNotifications() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        console.info('useNotifications: No user ID available');
        return [];
      }

      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('useNotifications: Error fetching notifications:', error);
          throw error;
        }

        return data || [] as Notification[];
      } catch (error) {
        console.error('useNotifications: Unexpected error:', error);
        throw error;
      }
    },
    enabled: !!user?.id,
  });
}
