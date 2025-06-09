
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
      // Get real upcoming course schedules
      const { data: upcomingSchedules } = await supabase
        .from('course_schedules')
        .select('id')
        .eq('instructor_id', userId)
        .gte('start_date', new Date().toISOString());

      // Get real certificates issued by this instructor
      const { data: certificates } = await supabase
        .from('certificates')
        .select('id')
        .eq('issued_by', userId);

      // Get real students taught through course enrollments
      const { data: enrollments } = await supabase
        .from('course_enrollments')
        .select(`
          user_id,
          course_schedules!inner(instructor_id)
        `)
        .eq('course_schedules.instructor_id', userId);

      const uniqueStudents = new Set(enrollments?.map(e => e.user_id) || []).size;

      // Calculate real teaching hours from completed course schedules
      const { data: completedSchedules } = await supabase
        .from('course_schedules')
        .select(`
          start_date,
          end_date,
          courses!inner(length)
        `)
        .eq('instructor_id', userId)
        .lte('end_date', new Date().toISOString());

      const teachingHours = completedSchedules?.reduce((total, schedule) => {
        return total + (schedule.courses?.length || 0);
      }, 0) || 0;

      return {
        upcomingClasses: upcomingSchedules?.length || 0,
        studentsTaught: uniqueStudents,
        certificationsIssued: certificates?.length || 0,
        teachingHours
      };
    },
    enabled: !!userId
  });

  // Get real recent sessions for widget
  const { data: recentSessions } = useQuery({
    queryKey: ['instructor-recent-sessions', userId],
    queryFn: async (): Promise<InstructorSession[]> => {
      const { data, error } = await supabase
        .from('course_schedules')
        .select(`
          id,
          start_date,
          end_date,
          courses!inner(name, length),
          course_enrollments(user_id)
        `)
        .eq('instructor_id', userId)
        .lte('end_date', new Date().toISOString())
        .order('start_date', { ascending: false })
        .limit(5);

      if (error) throw error;

      return (data || []).map(session => ({
        id: session.id,
        courseName: session.courses?.name || 'Unknown Course',
        sessionDate: session.start_date,
        attendanceCount: session.course_enrollments?.length || 0,
        duration: session.courses?.length || 0
      }));
    },
    enabled: !!userId
  });

  // Get real compliance data for widget
  const { data: complianceData } = useQuery({
    queryKey: ['instructor-compliance', userId],
    queryFn: async (): Promise<ComplianceData> => {
      const { data: issues } = await supabase
        .from('compliance_issues')
        .select('severity, status')
        .eq('user_id', userId);

      const openIssues = issues?.filter(issue => issue.status === 'OPEN').length || 0;
      const criticalIssues = issues?.filter(issue => issue.severity === 'HIGH' && issue.status === 'OPEN').length || 0;
      
      // Calculate score based on open issues
      const score = Math.max(0, 100 - (openIssues * 10) - (criticalIssues * 20));

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
