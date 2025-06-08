
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { InstructorPerformanceMetrics } from '@/types/team-management';

export interface ReportingMetrics {
  totalReports: number;
  completedReports: number;
  pendingReports: number;
  overdueReports: number;
  reportsByType: Record<string, number>;
  reportsByStatus: Record<string, number>;
}

export interface UserPerformanceData {
  userId: string;
  userName: string;
  totalTasks: number;
  completedTasks: number;
  averageCompletionTime: number;
  performanceScore: number;
}

export function useReportingAnalytics() {
  const reportingMetricsQuery = useQuery({
    queryKey: ['reporting-metrics'],
    queryFn: async (): Promise<ReportingMetrics> => {
      // For now, return mock data since we don't have reporting tables
      return {
        totalReports: 45,
        completedReports: 38,
        pendingReports: 5,
        overdueReports: 2,
        reportsByType: {
          'Performance': 15,
          'Compliance': 12,
          'Training': 18
        },
        reportsByStatus: {
          'Completed': 38,
          'Pending': 5,
          'Overdue': 2
        }
      };
    }
  });

  const instructorPerformanceQuery = useQuery({
    queryKey: ['instructor-performance-summary'],
    queryFn: async (): Promise<InstructorPerformanceMetrics[]> => {
      const { data: instructors, error } = await supabase
        .from('profiles')
        .select('id, display_name, role')
        .in('role', ['IC', 'IP', 'IT']);

      if (error) throw error;

      // Get performance metrics for each instructor
      const performanceData = await Promise.all(
        (instructors || []).map(async (instructor) => {
          const { data, error } = await supabase.rpc('get_instructor_performance_metrics', {
            p_instructor_id: instructor.id
          });

          if (error) {
            console.error('Error fetching instructor metrics:', error);
            // Return complete fallback data with all required properties
            return {
              instructorId: instructor.id,
              instructorName: instructor.display_name,
              role: instructor.role,
              totalSessions: 0,
              totalHours: 0,
              averageRating: 0,
              averageSessionRating: 0,
              certificatesIssued: 0,
              complianceScore: 0,
              studentsCount: 0
            } as InstructorPerformanceMetrics;
          }

          // Ensure all required properties are present
          return {
            instructorId: data?.instructorId || instructor.id,
            instructorName: data?.instructorName || instructor.display_name,
            role: data?.role || instructor.role,
            totalSessions: data?.totalSessions || 0,
            totalHours: data?.totalHours || 0,
            averageRating: data?.averageRating || 0,
            averageSessionRating: data?.averageSessionRating || 0,
            certificatesIssued: data?.certificatesIssued || 0,
            complianceScore: data?.complianceScore || 0,
            studentsCount: data?.studentsCount || 0
          } as InstructorPerformanceMetrics;
        })
      );

      return performanceData;
    }
  });

  const userPerformanceQuery = useQuery({
    queryKey: ['user-performance-data'],
    queryFn: async (): Promise<UserPerformanceData[]> => {
      // Mock data for user performance
      return [
        {
          userId: '1',
          userName: 'John Doe',
          totalTasks: 25,
          completedTasks: 23,
          averageCompletionTime: 2.5,
          performanceScore: 92
        },
        {
          userId: '2',
          userName: 'Jane Smith',
          totalTasks: 30,
          completedTasks: 28,
          averageCompletionTime: 2.1,
          performanceScore: 94
        }
      ];
    }
  });

  return {
    reportingMetrics: reportingMetricsQuery.data,
    instructorPerformance: instructorPerformanceQuery.data || [],
    userPerformance: userPerformanceQuery.data || [],
    isLoading: reportingMetricsQuery.isLoading || instructorPerformanceQuery.isLoading || userPerformanceQuery.isLoading,
    error: reportingMetricsQuery.error || instructorPerformanceQuery.error || userPerformanceQuery.error
  };
}
