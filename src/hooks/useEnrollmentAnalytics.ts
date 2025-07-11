
import { useQuery } from '@tanstack/react-query';
import { EnrollmentService, type EnrollmentWithDetails } from '@/services/enrollment/enrollmentService';
import { useAuth } from '@/contexts/AuthContext';

export const useEnrollmentMetrics = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['enrollment-metrics'],
    queryFn: () => EnrollmentService.getEnrollmentMetrics(),
    enabled: !!user,
    refetchInterval: 30000, // Refresh every 30 seconds for real-time updates
  });
};

export const useFilteredEnrollments = (filters = {}) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['enrollments-filtered', filters],
    queryFn: () => EnrollmentService.getFilteredEnrollments(filters),
    enabled: !!user,
  });
};

export const useEnrollmentTrends = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['enrollment-trends'],
    queryFn: async () => {
      const metrics = await EnrollmentService.getEnrollmentMetrics();
      return {
        trends: metrics.enrollmentTrends,
        growth: metrics.enrollmentTrends.percentageChange > 0 ? 'up' : 
                metrics.enrollmentTrends.percentageChange < 0 ? 'down' : 'stable'
      };
    },
    enabled: !!user,
  });
};

export const useEnrollmentMetricsWithThinkific = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['enrollment-metrics-with-thinkific'],
    queryFn: () => EnrollmentService.getEnrollmentMetricsWithThinkific(),
    enabled: !!user,
    refetchInterval: 60000, // Refresh every minute for Thinkific data
  });
};
