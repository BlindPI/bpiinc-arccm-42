
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface StudentMetrics {
  activeCourses: number;
  completedCourses: number;
  certificates: number;
  studyHours: number;
}

export interface Enrollment {
  id: string;
  courseName: string;
  status: string;
  startDate?: string;
  progress: number;
}

export interface StudentCertificate {
  id: string;
  courseName: string;
  issueDate: string;
  expiryDate: string;
  status: string;
}

export const useStudentDashboardData = (studentId: string) => {
  // Get student metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['student-metrics', studentId],
    queryFn: async () => {
      try {
        // Get active enrollments
        const { count: activeCourses, error: activeError } = await supabase
          .from('course_enrollments')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', studentId)
          .eq('status', 'enrolled');

        if (activeError) throw activeError;

        // Get completed courses
        const { count: completedCourses, error: completedError } = await supabase
          .from('course_enrollments')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', studentId)
          .eq('status', 'completed');

        if (completedError) throw completedError;

        // Get certificates
        const { count: certificates, error: certsError } = await supabase
          .from('certificates')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', studentId)
          .eq('status', 'ACTIVE');

        if (certsError) throw certsError;

        // Calculate study hours from attendance
        const { data: attendanceData, error: attendanceError } = await supabase
          .from('session_attendance')
          .select(`
            teaching_sessions(duration_minutes)
          `)
          .eq('student_id', studentId)
          .eq('attendance_status', 'present');

        if (attendanceError) throw attendanceError;

        const studyHours = attendanceData?.reduce((total, record) => {
          const duration = record.teaching_sessions?.duration_minutes || 0;
          return total + (duration / 60);
        }, 0) || 0;

        return {
          activeCourses: activeCourses || 0,
          completedCourses: completedCourses || 0,
          certificates: certificates || 0,
          studyHours: Math.round(studyHours)
        };
      } catch (error) {
        console.error('Error fetching student metrics:', error);
        throw error;
      }
    },
    enabled: !!studentId
  });

  // Get current enrollments
  const { data: enrollments, isLoading: enrollmentsLoading } = useQuery({
    queryKey: ['student-enrollments', studentId],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('course_enrollments')
          .select(`
            id,
            status,
            enrollment_date,
            course_schedules(
              start_date,
              courses(name)
            )
          `)
          .eq('user_id', studentId)
          .in('status', ['enrolled', 'in_progress'])
          .limit(5);

        if (error) throw error;

        return data?.map(enrollment => ({
          id: enrollment.id,
          courseName: enrollment.course_schedules?.courses?.name || 'Unknown Course',
          status: enrollment.status,
          startDate: enrollment.course_schedules?.start_date,
          progress: enrollment.status === 'in_progress' ? 65 : 0
        })) || [];
      } catch (error) {
        console.error('Error fetching enrollments:', error);
        return [];
      }
    },
    enabled: !!studentId
  });

  // Get student certificates
  const { data: certificates, isLoading: certificatesLoading } = useQuery({
    queryKey: ['student-certificates', studentId],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('certificates')
          .select('id, course_name, issue_date, expiry_date, status')
          .eq('user_id', studentId)
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) throw error;

        return data?.map(cert => ({
          id: cert.id,
          courseName: cert.course_name,
          issueDate: cert.issue_date,
          expiryDate: cert.expiry_date,
          status: cert.status
        })) || [];
      } catch (error) {
        console.error('Error fetching certificates:', error);
        return [];
      }
    },
    enabled: !!studentId
  });

  return {
    metrics,
    enrollments: enrollments || [],
    certificates: certificates || [],
    isLoading: metricsLoading || enrollmentsLoading || certificatesLoading,
    error: null
  };
};
