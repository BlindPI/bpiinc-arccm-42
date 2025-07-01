import { useQuery } from '@tanstack/react-query';
import { TrendCalculationService } from '@/services/analytics/trendCalculationService';

export interface AdvancedAnalyticsTrends {
  certificatesTrend: string;
  instructorsTrend: string;
  complianceTrend: string;
  issuesCount: number;
  issuesTrend: string;
}

export function useAdvancedAnalyticsTrends() {
  return useQuery({
    queryKey: ['advanced-analytics-trends'],
    queryFn: async (): Promise<AdvancedAnalyticsTrends> => {
      try {
        const [certificatesGrowth, instructorsGrowth, complianceGrowth, issuesData] = await Promise.all([
          TrendCalculationService.calculateMonthlyGrowth('certificates'),
          TrendCalculationService.calculateMonthlyGrowth('instructors'),
          TrendCalculationService.calculateComplianceGrowth(),
          TrendCalculationService.getSystemIssuesCount()
        ]);

        return {
          certificatesTrend: certificatesGrowth.formattedPercentage + ' from last month',
          instructorsTrend: instructorsGrowth.formattedPercentage + ' from last month',
          complianceTrend: complianceGrowth.formattedPercentage + ' from last month',
          issuesCount: issuesData.current,
          issuesTrend: issuesData.trend.formattedPercentage + ' from last week'
        };
      } catch (error) {
        console.error('Error calculating advanced analytics trends:', error);
        return {
          certificatesTrend: '0% from last month',
          instructorsTrend: '0% from last month',
          complianceTrend: '0% from last month',
          issuesCount: 0,
          issuesTrend: '0% from last week'
        };
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}