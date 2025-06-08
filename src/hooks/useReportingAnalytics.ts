
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

// Type guard for instructor performance metrics
function isInstructorPerformanceMetrics(data: any): data is InstructorPerformanceMetrics {
  return data && typeof data === 'object' && 
    'instructorId' in data && 'instructorName' in data && 'role' in data;
}

// Safe type conversion with validation
function parseInstructorMetrics(data: any): InstructorPerformanceMetrics {
  if (isInstructorPerformanceMetrics(data)) {
    return data;
  }
  
  // Fallback if data structure doesn't match
  if (data && typeof data === 'object') {
    return {
      instructorId: data.instructorId || data.instructor_id || '',
      instructorName: data.instructorName || data.instructor_name || 'Unknown',
      role: data.role || 'IT',
      totalSessions: data.totalSessions || data.total_sessions || 0,
      totalHours: data.totalHours || data.total_hours || 0,
      averageRating: data.averageRating || data.average_rating || 0,
      averageSessionRating: data.averageSessionRating || data.average_session_rating || 0,
      certificatesIssued: data.certificatesIssued || data.certificates_issued || 0,
      complianceScore: data.complianceScore || data.compliance_score || 0,
      studentsCount: data.studentsCount || data.students_count || 0
    };
  }
  
  // Ultimate fallback
  return {
    instructorId: '',
    instructorName: 'Unknown',
    role: 'IT',
    totalSessions: 0,
    totalHours: 0,
    averageRating: 0,
    averageSessionRating: 0,
    certificatesIssued: 0,
    complianceScore: 0,
    studentsCount: 0
  };
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
            return parseInstructorMetrics({
              instructorId: instructor.id,
              instructorName: instructor.display_name,
              role: instructor.role
            });
          }

          // Parse and validate the response data
          return parseInstructorMetrics(data);
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
