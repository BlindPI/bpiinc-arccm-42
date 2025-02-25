
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type Notification = {
  id: string;
  title: string;
  message: string;
  type: 'DOCUMENT_EXPIRING' | 'DOCUMENT_EXPIRED' | 'DOCUMENT_APPROVED' | 'DOCUMENT_REJECTED' | 'COMPLIANCE_WARNING' | 'TEACHING_MILESTONE' | 'EVALUATION_SUBMITTED' | 'ROLE_TRANSITION_UPDATE';
  status: 'PENDING' | 'SENT' | 'FAILED' | 'READ';
  created_at: string | null;
  read_at: string | null;
  metadata: {
    document_id?: string;
    document_type?: string;
    document_url?: string;
    expiry_date?: string;
    days_until_expiry?: number;
    compliance_id?: string;
    is_compliant?: boolean;
    completed_hours?: number;
    required_hours?: number;
  } | null;
};

export function useNotifications() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        console.warn('useNotifications: No user ID provided');
        return [];
      }

      try {
        const { data: notifications, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('recipient_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('useNotifications: Error fetching notifications:', error);
          toast.error('Failed to fetch notifications');
          throw error;
        }

        return notifications as Notification[];
      } catch (error) {
        console.error('useNotifications: Unexpected error:', error);
        toast.error('Error fetching notifications');
        throw error;
      }
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60, // Cache for 1 minute
    refetchInterval: 1000 * 30, // Refetch every 30 seconds
  });
}
