
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

  // Get provider metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['providerMetrics', user?.id],
    queryFn: async () => {
      try {
        // Get active instructors associated with this provider
        const { count: activeInstructors, error: instructorsError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .in('role', ['IT', 'IP', 'IC'])
          .eq('status', 'ACTIVE');

        if (instructorsError) throw instructorsError;

        // Get upcoming courses (next 30 days)
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

        const { count: upcomingCourses, error: coursesError } = await supabase
          .from('course_schedules')
          .select('*', { count: 'exact', head: true })
          .gte('start_date', new Date().toISOString())
          .lte('start_date', thirtyDaysFromNow.toISOString())
          .eq('status', 'scheduled');

        if (coursesError) throw coursesError;

        // Get certifications issued (last 12 months)
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);

        const { count: certificationsIssued, error: certsError } = await supabase
          .from('certificates')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', twelveMonthsAgo.toISOString());

        if (certsError) throw certsError;

        // Get instructor applications (role transition requests)
        const { count: instructorApplications, error: appsError } = await supabase
          .from('role_transition_requests')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'PENDING')
          .in('to_role', ['IT', 'IP', 'IC']);

        if (appsError) throw appsError;

        return {
          activeInstructors: activeInstructors || 0,
          upcomingCourses: upcomingCourses || 0,
          certificationsIssued: certificationsIssued || 0,
          instructorApplications: instructorApplications || 0
        };
      } catch (err) {
        console.error('Error fetching provider metrics:', err);
        return {
          activeInstructors: 0,
          upcomingCourses: 0,
          certificationsIssued: 0,
          instructorApplications: 0
        };
      }
    },
    enabled: !!user
  });

  // Fetch upcoming courses with real data
  const { data: upcomingCourses, isLoading: coursesLoading } = useQuery({
    queryKey: ['providerUpcomingCourses', user?.id],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('course_schedules')
          .select(`
            id,
            start_date,
            current_enrollment,
            courses(name)
          `)
          .gte('start_date', new Date().toISOString())
          .eq('status', 'scheduled')
          .order('start_date', { ascending: true })
          .limit(5);

        if (error) throw error;

        return data?.map(item => ({
          id: item.id,
          name: item.courses?.name || 'Unknown Course',
          date: new Date(item.start_date).toLocaleDateString(),
          time: new Date(item.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          enrolledCount: item.current_enrollment || 0
        })) || [];
      } catch (err) {
        console.error('Error fetching upcoming courses:', err);
        return [];
      }
    },
    enabled: !!user
  });

  // Fetch instructor status with real data
  const { data: instructorStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['providerInstructorStatus', user?.id],
    queryFn: async () => {
      try {
        // Get counts by role
        const { data: roleCounts, error } = await supabase
          .from('profiles')
          .select('role')
          .in('role', ['IT', 'IP', 'IC'])
          .eq('status', 'ACTIVE');

        if (error) throw error;

        const statusMap = {
          'IC': 'Certified Instructors',
          'IP': 'Provisional Instructors', 
          'IT': 'Instructor Trainees'
        };

        const counts = roleCounts?.reduce((acc, profile) => {
          const type = statusMap[profile.role as keyof typeof statusMap];
          if (type) {
            acc[type] = (acc[type] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>) || {};

        return Object.entries(counts).map(([type, count], index) => ({
          id: (index + 1).toString(),
          type,
          count
        }));
      } catch (err) {
        console.error('Error fetching instructor status:', err);
        return [];
      }
    },
    enabled: !!user
  });

  const isLoading = metricsLoading || coursesLoading || statusLoading;

  return {
    metrics: metrics || {
      activeInstructors: 0,
      upcomingCourses: 0,
      certificationsIssued: 0,
      instructorApplications: 0
    },
    upcomingCourses: upcomingCourses || [],
    instructorStatus: instructorStatus || [],
    isLoading,
    error: null
  };
};
