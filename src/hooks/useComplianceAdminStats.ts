
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
      try {
        // Try to get data from the system_admin_metrics view
        const { data, error } = await supabase
          .from('system_admin_metrics')
          .select('*')
          .single();

        if (error) {
          console.warn('system_admin_metrics view not available, calculating manually:', error);
          
          // Fallback to manual calculation using existing tables
          const [usersResult, tiersResult, recordsResult] = await Promise.all([
            supabase.from('profiles').select('*', { count: 'exact', head: true }),
            supabase.from('profiles').select('compliance_tier', { count: 'exact' }),
            supabase.from('user_compliance_records').select('compliance_status', { count: 'exact' })
          ]);

          const totalUsers = usersResult.count || 0;
          const tierData = tiersResult.data || [];
          const basicTierCount = tierData.filter(t => t.compliance_tier === 'basic').length;
          const robustTierCount = tierData.filter(t => t.compliance_tier === 'robust').length;
          
          const recordData = recordsResult.data || [];
          const pendingReviews = recordData.filter(r => r.compliance_status === 'pending').length;
          
          // Calculate average completion rate based on existing data
          const avgCompletionRate = totalUsers > 0 ? Math.round(((totalUsers - pendingReviews) / totalUsers) * 100) : 0;

          return {
            totalUsers,
            pendingReviews,
            basicTierCount,
            robustTierCount,
            avgCompletionRate,
            complianceStatus: avgCompletionRate >= 80 ? 'good' : avgCompletionRate >= 60 ? 'warning' : 'critical'
          };
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
      } catch (error) {
        console.error('Error fetching admin stats:', error);
        
        // Return safe defaults if all else fails
        return {
          totalUsers: 0,
          pendingReviews: 0,
          basicTierCount: 0,
          robustTierCount: 0,
          avgCompletionRate: 0,
          complianceStatus: 'critical'
        };
      }
    },
    refetchInterval: 30000,
    staleTime: 15000
  });
}
