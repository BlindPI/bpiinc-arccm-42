
import { useQuery } from '@tanstack/react-query';
import { AnalyticsService } from '@/services/analytics/analyticsService';

export function useAdvancedAnalytics() {
  const { data: certificateTrends, isLoading: trendsLoading } = useQuery({
    queryKey: ['certificate-trends'],
    queryFn: () => AnalyticsService.getCertificateTrends()
  });

  const { data: instructorMetrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['instructor-metrics'],
    queryFn: () => AnalyticsService.getInstructorMetrics()
  });

  const { data: complianceOverview, isLoading: complianceLoading } = useQuery({
    queryKey: ['compliance-overview'],
    queryFn: () => AnalyticsService.getComplianceOverview()
  });

  return {
    certificateTrends,
    instructorMetrics,
    complianceOverview,
    isLoading: trendsLoading || metricsLoading || complianceLoading
  };
}
