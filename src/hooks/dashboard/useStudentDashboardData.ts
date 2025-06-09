
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface StudentMetrics {
  activeCourses: number;
  completedCourses: number;
  certificates: number;
  studyHours: number;
}

export function useStudentDashboardData(userId: string) {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['student-dashboard-data', userId],
    queryFn: async (): Promise<StudentMetrics> => {
      // Get enrollment data
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('status')
        .eq('user_id', userId);

      // Get certificates data
      const { data: certificates } = await supabase
        .from('certificates')
        .select('id')
        .eq('recipient_id', userId);

      const activeCourses = enrollments?.filter(e => e.status === 'ACTIVE').length || 0;
      const completedCourses = enrollments?.filter(e => e.status === 'COMPLETED').length || 0;

      return {
        activeCourses,
        completedCourses,
        certificates: certificates?.length || 0,
        studyHours: Math.floor(completedCourses * 8.5) // Estimate study hours
      };
    },
    enabled: !!userId
  });

  return { metrics, isLoading };
}
