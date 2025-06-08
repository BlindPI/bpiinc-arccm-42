
import { useQuery } from '@tanstack/react-query';
import type { InstructorPerformanceMetrics, ExecutiveDashboardMetrics } from '@/types/team-management';
import { cacheManager } from '@/services/cache/cacheManager';

export function useReportingAnalytics() {
  const { data: instructorMetrics = [], isLoading: isLoadingInstructors } = useQuery({
    queryKey: ['instructor-performance-metrics'],
    queryFn: async (): Promise<InstructorPerformanceMetrics[]> => {
      // Check cache first
      const cached = cacheManager.get<InstructorPerformanceMetrics[]>('instructor-metrics');
      if (cached) return cached;

      // Simulated data - replace with actual API call
      const data: InstructorPerformanceMetrics[] = [
        {
          instructorId: '1',
          instructorName: 'John Doe',
          totalSessions: 25,
          totalHours: 200,
          averageRating: 4.8,
          certificatesIssued: 150,
          complianceScore: 98
        }
      ];

      // Cache the result
      cacheManager.set('instructor-metrics', data, 10 * 60 * 1000); // 10 minutes
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: executiveMetrics, isLoading: isLoadingExecutive } = useQuery({
    queryKey: ['executive-dashboard-metrics'],
    queryFn: async (): Promise<ExecutiveDashboardMetrics> => {
      // Check cache first
      const cached = cacheManager.get<ExecutiveDashboardMetrics>('executive-metrics');
      if (cached) return cached;

      // Simulated data - replace with actual API call
      const data: ExecutiveDashboardMetrics = {
        totalUsers: 1250,
        activeInstructors: 45,
        totalCertificates: 3200,
        monthlyGrowth: 12.5,
        complianceScore: 94.2,
        performanceIndex: 87.8,
        revenueMetrics: {
          current: 125000,
          target: 150000,
          variance: -16.7
        },
        trainingMetrics: {
          sessionsCompleted: 284,
          averageSatisfaction: 4.6,
          certificationRate: 89.2
        },
        operationalMetrics: {
          systemUptime: 99.8,
          processingTime: 1.2,
          errorRate: 0.3
        }
      };

      // Cache the result
      cacheManager.set('executive-metrics', data, 15 * 60 * 1000); // 15 minutes
      return data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const invalidateCache = () => {
    cacheManager.invalidatePattern('instructor-metrics');
    cacheManager.invalidatePattern('executive-metrics');
  };

  return {
    instructorMetrics,
    executiveMetrics,
    isLoadingInstructors,
    isLoadingExecutive,
    invalidateCache
  };
}
