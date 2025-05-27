
import { useQuery } from '@tanstack/react-query';
import { AnalyticsService } from '@/services/analytics/analyticsService';

export function useAdvancedAnalytics() {
  const certificateTrends = useQuery({
    queryKey: ['certificate-trends-cached'],
    queryFn: async () => {
      const cacheKey = 'certificate_trends_30_day';
      const cached = await AnalyticsService.getCachedData(cacheKey);
      
      if (cached) {
        return cached;
      }
      
      const data = await AnalyticsService.getCertificateTrends(30, 'day');
      await AnalyticsService.setCachedData(cacheKey, data, 30);
      return data;
    },
    staleTime: 1000 * 60 * 15, // 15 minutes
  });

  const instructorMetrics = useQuery({
    queryKey: ['instructor-metrics-cached'],
    queryFn: async () => {
      const cacheKey = 'instructor_performance_metrics';
      const cached = await AnalyticsService.getCachedData(cacheKey);
      
      if (cached) {
        return cached;
      }
      
      const data = await AnalyticsService.getInstructorPerformanceMetrics();
      await AnalyticsService.setCachedData(cacheKey, data, 60);
      return data;
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  const complianceOverview = useQuery({
    queryKey: ['compliance-overview-cached'],
    queryFn: async () => {
      const cacheKey = 'compliance_overview';
      const cached = await AnalyticsService.getCachedData(cacheKey);
      
      if (cached) {
        return cached;
      }
      
      const data = await AnalyticsService.getComplianceOverview();
      await AnalyticsService.setCachedData(cacheKey, data, 20);
      return data;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  return {
    certificateTrends,
    instructorMetrics,
    complianceOverview,
    isLoading: certificateTrends.isLoading || instructorMetrics.isLoading || complianceOverview.isLoading
  };
}
