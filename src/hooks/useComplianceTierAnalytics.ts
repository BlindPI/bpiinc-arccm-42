
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ComplianceAnalyticsData {
  distribution: Array<{
    name: string;
    value: number;
  }>;
  completionTime: Array<{
    name: string;
    basic: number;
    robust: number;
  }>;
  metrics: Array<{
    metric: string;
    basic: number;
    robust: number;
  }>;
  performance: Array<{
    name: string;
    basic: number;
    robust: number;
  }>;
  total: number;
}

export function useComplianceTierAnalytics() {
  return useQuery({
    queryKey: ['compliance-tier-analytics'],
    queryFn: async (): Promise<ComplianceAnalyticsData> => {
      try {
        // Get tier distribution
        const { data: tierData, error: tierError } = await supabase.rpc('get_tier_distribution');
        if (tierError) {
          console.error('Tier distribution error:', tierError);
          throw tierError;
        }

        // Get compliance analytics
        const { data: analyticsData, error: analyticsError } = await supabase.rpc('get_compliance_analytics');
        if (analyticsError) {
          console.error('Analytics error:', analyticsError);
          throw analyticsError;
        }

        console.log('Raw tier data:', tierData);
        console.log('Raw analytics data:', analyticsData);

        // Transform data for charts
        const distribution = (tierData || []).map((tier: any) => ({
          name: tier.tier_name === 'unassigned' ? 'Unassigned' : 
                tier.tier_name === 'basic' ? 'Basic Tier' : 'Robust Tier',
          value: Number(tier.user_count) || 0
        }));

        const completionTime = [
          {
            name: 'Overall Completion',
            basic: tierData?.find((t: any) => t.tier_name === 'basic')?.completion_percentage || 0,
            robust: tierData?.find((t: any) => t.tier_name === 'robust')?.completion_percentage || 0
          }
        ];

        const metrics = (analyticsData || []).map((metric: any) => ({
          metric: metric.metric_name || 'Unknown',
          basic: Number(metric.basic_completion_rate) || 0,
          robust: Number(metric.robust_completion_rate) || 0
        }));

        const performance = [
          {
            name: 'Completion Rate',
            basic: metrics.reduce((sum, m) => sum + m.basic, 0) / Math.max(metrics.length, 1),
            robust: metrics.reduce((sum, m) => sum + m.robust, 0) / Math.max(metrics.length, 1)
          },
          {
            name: 'User Coverage',
            basic: Number(analyticsData?.[0]?.total_users_basic) || 0,
            robust: Number(analyticsData?.[0]?.total_users_robust) || 0
          }
        ];

        const total = distribution.reduce((sum, item) => sum + item.value, 0);

        return {
          distribution,
          completionTime,
          metrics,
          performance,
          total
        };
      } catch (error) {
        console.error('Error fetching compliance tier analytics:', error);
        throw error;
      }
    },
    refetchInterval: 300000, // Refresh every 5 minutes
    staleTime: 120000, // Consider data stale after 2 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  });
}
