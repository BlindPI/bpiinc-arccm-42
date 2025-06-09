
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { InstructorSession, ComplianceData } from '@/types/dashboard';

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

  // Get recent sessions for widget
  const { data: recentSessions } = useQuery({
    queryKey: ['instructor-recent-sessions', userId],
    queryFn: async (): Promise<InstructorSession[]> => {
      const { data, error } = await supabase
        .from('teaching_sessions')
        .select(`
          id,
          session_date,
          duration_minutes,
          attendance_count,
          course_schedules(
            courses(name)
          )
        `)
        .eq('instructor_id', userId)
        .order('session_date', { ascending: false })
        .limit(5);

      if (error) throw error;

      return (data || []).map(session => ({
        id: session.id,
        courseName: session.course_schedules?.courses?.name || 'Unknown Course',
        sessionDate: session.session_date,
        attendanceCount: session.attendance_count || 0,
        duration: session.duration_minutes || 0
      }));
    },
    enabled: !!userId
  });

  // Get compliance data for widget
  const { data: complianceData } = useQuery({
    queryKey: ['instructor-compliance', userId],
    queryFn: async (): Promise<ComplianceData> => {
      const { data: issues } = await supabase
        .from('compliance_issues')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'OPEN');

      const openIssues = issues?.length || 0;
      const score = Math.max(100 - (openIssues * 15), 0);

      return {
        score,
        status: score >= 90 ? 'compliant' : score >= 70 ? 'warning' : 'critical',
        lastEvaluation: new Date().toISOString()
      };
    },
    enabled: !!userId
  });

  return { 
    metrics, 
    recentSessions: recentSessions || [],
    complianceData: complianceData || { score: 0, status: 'critical' },
    isLoading 
  };
}
