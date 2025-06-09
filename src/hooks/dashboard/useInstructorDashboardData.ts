
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface InstructorMetrics {
  upcomingClasses: number;
  studentsTaught: number;
  certificationsIssued: number;
  teachingHours: number;
}

export function useInstructorDashboardData(userId: string) {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['instructor-dashboard-data', userId],
    queryFn: async (): Promise<InstructorMetrics> => {
      // Get teaching sessions
      const { data: sessions } = await supabase
        .from('teaching_sessions')
        .select('*')
        .eq('instructor_id', userId);

      // Get certificates issued
      const { data: certificates } = await supabase
        .from('certificates')
        .select('id')
        .eq('issued_by', userId);

      const upcomingClasses = sessions?.filter(s => 
        new Date(s.session_date) > new Date()
      ).length || 0;

      const teachingHours = sessions?.reduce((total, session) => 
        total + (session.duration_minutes || 0), 0
      ) / 60 || 0;

      return {
        upcomingClasses,
        studentsTaught: sessions?.reduce((total, session) => 
          total + (session.attendance_count || 0), 0
        ) || 0,
        certificationsIssued: certificates?.length || 0,
        teachingHours: Math.round(teachingHours)
      };
    },
    enabled: !!userId
  });

  return { metrics, isLoading };
}
