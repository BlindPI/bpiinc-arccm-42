
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ComplianceAdminStats {
  totalUsers: number;
  basicTierCount: number;
  robustTierCount: number;
  pendingReviews: number;
  avgCompletionRate: number;
  complianceStatus: 'good' | 'warning' | 'critical';
}

export function useComplianceAdminStats() {
  return useQuery({
    queryKey: ['compliance-admin-stats'],
    queryFn: async (): Promise<ComplianceAdminStats> => {
      try {
        // Get tier distribution
        const { data: tierData, error: tierError } = await supabase.rpc('get_tier_distribution');
        if (tierError) throw tierError;

        // Get compliance analytics for completion rates
        const { data: analyticsData, error: analyticsError } = await supabase.rpc('get_compliance_analytics');
        if (analyticsError) throw analyticsError;

        // Calculate statistics
        const totalUsers = tierData?.reduce((sum: number, tier: any) => sum + Number(tier.user_count), 0) || 0;
        const basicTierCount = tierData?.find((tier: any) => tier.tier_name === 'basic')?.user_count || 0;
        const robustTierCount = tierData?.find((tier: any) => tier.tier_name === 'robust')?.user_count || 0;
        
        const pendingReviews = analyticsData?.reduce((sum: number, metric: any) => 
          sum + Number(metric.pending_users), 0) || 0;
        
        const avgCompletionRate = tierData?.reduce((sum: number, tier: any) => 
          sum + Number(tier.completion_percentage), 0) / Math.max(tierData?.length || 1, 1) || 0;

        // Determine compliance status
        let complianceStatus: 'good' | 'warning' | 'critical' = 'good';
        if (avgCompletionRate < 60) {
          complianceStatus = 'critical';
        } else if (avgCompletionRate < 80) {
          complianceStatus = 'warning';
        }

        return {
          totalUsers: Number(totalUsers),
          basicTierCount: Number(basicTierCount),
          robustTierCount: Number(robustTierCount),
          pendingReviews: Number(pendingReviews),
          avgCompletionRate: Math.round(Number(avgCompletionRate)),
          complianceStatus
        };
      } catch (error) {
        console.error('Error fetching compliance admin stats:', error);
        // Return default values instead of throwing to prevent UI crash
        return {
          totalUsers: 0,
          basicTierCount: 0,
          robustTierCount: 0,
          pendingReviews: 0,
          avgCompletionRate: 0,
          complianceStatus: 'good'
        };
      }
    },
    refetchInterval: 300000, // Refresh every 5 minutes
    staleTime: 120000 // Consider data stale after 2 minutes
  });
}
