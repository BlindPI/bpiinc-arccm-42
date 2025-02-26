
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface Notification {
  id: string;
  user_id: string | null;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'ACTION';
  read: boolean;
  read_at: string | null;
  created_at: string;
  action_url?: string | null;
}

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

        return data || [];
      } catch (error) {
        console.error('useNotifications: Unexpected error:', error);
        throw error;
      }
    },
    enabled: !!user?.id,
  });
}
