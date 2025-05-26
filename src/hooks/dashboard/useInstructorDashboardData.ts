
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface InstructorMetrics {
  upcomingClasses: number;
  studentsTaught: number;
  certificationsIssued: number;
  teachingHours: number;
}

export interface TeachingSession {
  id: string;
  courseName: string;
  sessionDate: string;
  attendanceCount: number;
  duration: number;
}

export interface ComplianceData {
  score: number;
  status: 'compliant' | 'warning' | 'critical';
  lastEvaluation?: string;
}

export const useInstructorDashboardData = (instructorId: string) => {
  const { user } = useAuth();

  // Get instructor metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['instructor-metrics', instructorId],
    queryFn: async () => {
      try {
        // Get upcoming classes (next 14 days)
        const fourteenDaysFromNow = new Date();
        fourteenDaysFromNow.setDate(fourteenDaysFromNow.getDate() + 14);

        const { count: upcomingClasses, error: upcomingError } = await supabase
          .from('teaching_sessions')
          .select('*', { count: 'exact', head: true })
          .eq('instructor_id', instructorId)
          .gte('session_date', new Date().toISOString())
          .lte('session_date', fourteenDaysFromNow.toISOString());

        if (upcomingError) throw upcomingError;

        // Get students taught (last 12 months)
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);

        const { data: sessionsData, error: sessionsError } = await supabase
          .from('teaching_sessions')
          .select('attendees')
          .eq('instructor_id', instructorId)
          .gte('session_date', twelveMonthsAgo.toISOString());

        if (sessionsError) throw sessionsError;

        const uniqueStudents = new Set();
        sessionsData?.forEach(session => {
          if (session.attendees) {
            session.attendees.forEach((studentId: string) => uniqueStudents.add(studentId));
          }
        });

        // Get certifications issued (last 12 months)
        const { count: certificationsIssued, error: certsError } = await supabase
          .from('certificates')
          .select('*', { count: 'exact', head: true })
          .eq('issued_by', instructorId)
          .gte('created_at', twelveMonthsAgo.toISOString());

        if (certsError) throw certsError;

        // Get teaching hours (last 3 months)
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        const { data: hoursData, error: hoursError } = await supabase
          .from('teaching_sessions')
          .select('teaching_hours_credit')
          .eq('instructor_id', instructorId)
          .gte('session_date', threeMonthsAgo.toISOString());

        if (hoursError) throw hoursError;

        const teachingHours = hoursData?.reduce((total, session) => 
          total + (session.teaching_hours_credit || 0), 0) || 0;

        return {
          upcomingClasses: upcomingClasses || 0,
          studentsTaught: uniqueStudents.size,
          certificationsIssued: certificationsIssued || 0,
          teachingHours: Math.round(teachingHours)
        };
      } catch (error) {
        console.error('Error fetching instructor metrics:', error);
        throw error;
      }
    },
    enabled: !!instructorId
  });

  // Get recent teaching sessions
  const { data: recentSessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ['instructor-sessions', instructorId],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('teaching_sessions')
          .select(`
            id,
            session_date,
            duration_minutes,
            attendance_count,
            courses(name)
          `)
          .eq('instructor_id', instructorId)
          .order('session_date', { ascending: false })
          .limit(5);

        if (error) throw error;

        return data?.map(session => ({
          id: session.id,
          courseName: session.courses?.name || 'Unknown Course',
          sessionDate: session.session_date,
          attendanceCount: session.attendance_count || 0,
          duration: session.duration_minutes || 0
        })) || [];
      } catch (error) {
        console.error('Error fetching teaching sessions:', error);
        return [];
      }
    },
    enabled: !!instructorId
  });

  // Get compliance data
  const { data: complianceData, isLoading: complianceLoading } = useQuery({
    queryKey: ['instructor-compliance', instructorId],
    queryFn: async () => {
      try {
        // Get recent evaluations
        const { data: evaluations, error } = await supabase
          .from('supervisor_evaluations')
          .select('teaching_competency, created_at')
          .eq('instructor_id', instructorId)
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;

        if (!evaluations || evaluations.length === 0) {
          return {
            score: 0,
            status: 'critical' as const,
            lastEvaluation: undefined
          };
        }

        const avgScore = evaluations.reduce((sum, eval) => sum + eval.teaching_competency, 0) / evaluations.length;
        const status = avgScore >= 80 ? 'compliant' : avgScore >= 60 ? 'warning' : 'critical';

        return {
          score: Math.round(avgScore),
          status,
          lastEvaluation: evaluations[0]?.created_at
        };
      } catch (error) {
        console.error('Error fetching compliance data:', error);
        return {
          score: 0,
          status: 'critical' as const,
          lastEvaluation: undefined
        };
      }
    },
    enabled: !!instructorId
  });

  return {
    metrics,
    recentSessions: recentSessions || [],
    complianceData,
    isLoading: metricsLoading || sessionsLoading || complianceLoading,
    error: null
  };
};
