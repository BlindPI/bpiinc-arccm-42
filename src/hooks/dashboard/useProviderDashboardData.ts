import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ProviderMetrics {
  activeInstructors: number;
  upcomingCourses: number;
  certificationsIssued: number;
  instructorApplications: number;
}

export interface UpcomingCourse {
  id: string;
  name: string;
  date: string;
  time: string;
  enrolledCount: number;
}

export interface InstructorStatus {
  id: string;
  type: string;
  count: number;
}

export const useProviderDashboardData = () => {
  const { user } = useAuth();

  // Get the provider ID for the current user
  const { data: providerId, isLoading: providerLoading } = useQuery({
    queryKey: ['providerId', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('authorized_providers')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      return data.id;
    },
    enabled: !!user
  });

  // Fetch provider metrics
  const { data: metrics, isLoading: metricsLoading, error: metricsError } = useQuery({
    queryKey: ['providerMetrics', providerId],
    queryFn: async () => {
      // Get active instructors count
      const { count: activeInstructors, error: instructorsError } = await supabase
        .from('instructors')
        .select('*', { count: 'exact', head: true })
        .eq('provider_id', providerId)
        .eq('status', 'ACTIVE');

      if (instructorsError) throw instructorsError;

      // Get upcoming courses count (next 30 days)
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      const { count: upcomingCourses, error: coursesError } = await supabase
        .from('course_offerings')
        .select('*', { count: 'exact', head: true })
        .eq('provider_id', providerId)
        .gt('start_date', new Date().toISOString())
        .lt('start_date', thirtyDaysFromNow.toISOString());

      if (coursesError) throw coursesError;

      // Get certifications issued count (last 12 months)
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      
      const { count: certificationsIssued, error: certError } = await supabase
        .from('certificates')
        .select('*', { count: 'exact', head: true })
        .eq('issued_by_provider', providerId)
        .gt('issued_date', oneYearAgo.toISOString());

      if (certError) throw certError;

      // Get instructor applications count
      const { count: instructorApplications, error: applicationsError } = await supabase
        .from('instructor_applications')
        .select('*', { count: 'exact', head: true })
        .eq('provider_id', providerId)
        .eq('status', 'PENDING');

      if (applicationsError) throw applicationsError;

      return {
        activeInstructors: activeInstructors || 0,
        upcomingCourses: upcomingCourses || 0,
        certificationsIssued: certificationsIssued || 0,
        instructorApplications: instructorApplications || 0
      };
    },
    enabled: !!user && !!providerId
  });

  // Fetch upcoming courses
  const { data: upcomingCourses, isLoading: coursesLoading, error: coursesError } = useQuery({
    queryKey: ['providerUpcomingCourses', providerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_offerings')
        .select(`
          id,
          course_id,
          courses(name),
          start_date,
          start_time,
          enrollments(id)
        `)
        .eq('provider_id', providerId)
        .gt('start_date', new Date().toISOString())
        .order('start_date', { ascending: true })
        .limit(5);

      if (error) throw error;

      return data.map(item => ({
        id: item.id,
        name: item.courses?.name || 'Unnamed Course',
        date: new Date(item.start_date).toLocaleDateString(),
        time: item.start_time || 'TBD',
        enrolledCount: item.enrollments ? item.enrollments.length : 0
      }));
    },
    enabled: !!user && !!providerId
  });

  // Fetch instructor status
  const { data: instructorStatus, isLoading: statusLoading, error: statusError } = useQuery({
    queryKey: ['providerInstructorStatus', providerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('instructors')
        .select(`
          id,
          role
        `)
        .eq('provider_id', providerId)
        .eq('status', 'ACTIVE');

      if (error) throw error;

      // Count instructors by role
      const counts = {
        'IC': 0, // Certified Instructors
        'IP': 0, // Provisional Instructors
        'IT': 0  // Instructor Trainees
      };

      data.forEach(instructor => {
        if (instructor.role in counts) {
          counts[instructor.role as keyof typeof counts]++;
        }
      });

      return [
        { id: '1', type: 'Certified Instructors', count: counts.IC },
        { id: '2', type: 'Provisional Instructors', count: counts.IP },
        { id: '3', type: 'Instructor Trainees', count: counts.IT }
      ];
    },
    enabled: !!user && !!providerId
  });

  const isLoading = providerLoading || metricsLoading || coursesLoading || statusLoading;
  const error = metricsError || coursesError || statusError;

  return {
    metrics,
    upcomingCourses,
    instructorStatus,
    isLoading,
    error
  };
};