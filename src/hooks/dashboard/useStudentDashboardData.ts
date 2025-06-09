
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { StudentCertificate, StudentEnrollment } from '@/types/dashboard';

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
      // Get real enrollment data
      const { data: enrollments } = await supabase
        .from('course_enrollments')
        .select('status')
        .eq('user_id', userId);

      // Get real certificates data
      const { data: certificates } = await supabase
        .from('certificates')
        .select('id')
        .eq('user_id', userId);

      // Count active and completed courses
      const activeCourses = enrollments?.filter(e => e.status === 'enrolled' || e.status === 'in_progress').length || 0;
      const completedCourses = enrollments?.filter(e => e.status === 'completed').length || 0;

      // Calculate real study hours from course enrollments
      const { data: courseHours } = await supabase
        .from('course_enrollments')
        .select(`
          course_schedules!inner(
            courses!inner(length)
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'completed');

      const studyHours = courseHours?.reduce((total, enrollment) => {
        return total + (enrollment.course_schedules?.courses?.length || 0);
      }, 0) || 0;

      return {
        activeCourses,
        completedCourses,
        certificates: certificates?.length || 0,
        studyHours
      };
    },
    enabled: !!userId
  });

  // Get real certificates for widget
  const { data: certificates } = useQuery({
    queryKey: ['student-certificates', userId],
    queryFn: async (): Promise<StudentCertificate[]> => {
      const { data, error } = await supabase
        .from('certificates')
        .select('id, course_name, status, issue_date, expiry_date')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      return (data || []).map(cert => ({
        id: cert.id,
        courseName: cert.course_name || 'Unknown Course',
        status: cert.status || 'ACTIVE',
        issueDate: cert.issue_date || '',
        expiryDate: cert.expiry_date || ''
      }));
    },
    enabled: !!userId
  });

  // Get real enrollments for widget
  const { data: enrollments } = useQuery({
    queryKey: ['student-enrollments', userId],
    queryFn: async (): Promise<StudentEnrollment[]> => {
      const { data, error } = await supabase
        .from('course_enrollments')
        .select(`
          id,
          status,
          enrollment_date,
          course_schedules!inner(
            start_date,
            courses!inner(name)
          )
        `)
        .eq('user_id', userId)
        .order('enrollment_date', { ascending: false })
        .limit(5);

      if (error) throw error;

      return (data || []).map(enrollment => ({
        id: enrollment.id,
        courseName: enrollment.course_schedules?.courses?.name || 'Unknown Course',
        status: enrollment.status || 'enrolled',
        startDate: enrollment.course_schedules?.start_date,
        progress: enrollment.status === 'completed' ? 100 : 
                 enrollment.status === 'in_progress' ? 50 : 0
      }));
    },
    enabled: !!userId
  });

  return { 
    metrics, 
    certificates: certificates || [],
    enrollments: enrollments || [],
    isLoading 
  };
}
