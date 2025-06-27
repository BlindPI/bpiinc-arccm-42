
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ComplianceAdminStats {
  totalUsers: number;
  pendingReviews: number;
  basicTierCount: number;
  robustTierCount: number;
  avgCompletionRate: number;
  complianceStatus: 'good' | 'warning' | 'critical';
}

export function useComplianceAdminStats() {
  return useQuery({
    queryKey: ['compliance-admin-stats'],
    queryFn: async (): Promise<ComplianceAdminStats> => {
      const { data, error } = await supabase
        .from('system_admin_metrics')
        .select('*')
        .single();

      if (error) {
        console.error('Error fetching admin stats:', error);
        throw error;
      }

      const complianceStatus = data.avg_completion_rate >= 80 ? 'good' : 
                              data.avg_completion_rate >= 60 ? 'warning' : 'critical';

      return {
        totalUsers: data.total_users || 0,
        pendingReviews: data.pending_reviews || 0,
        basicTierCount: data.basic_tier_count || 0,
        robustTierCount: data.robust_tier_count || 0,
        avgCompletionRate: data.avg_completion_rate || 0,
        complianceStatus
      };
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 15000 // Consider data stale after 15 seconds
  });
}
