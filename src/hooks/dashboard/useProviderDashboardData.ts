
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

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

// Fallback data generators
const generateFallbackMetrics = (): ProviderMetrics => {
  console.warn('Using fallback provider metrics');
  return {
    activeInstructors: 0,
    upcomingCourses: 0,
    certificationsIssued: 0,
    instructorApplications: 0
  };
};

const generateFallbackCourses = (): UpcomingCourse[] => {
  console.warn('Using fallback upcoming courses data');
  return [];
};

const generateFallbackStatus = (): InstructorStatus[] => {
  console.warn('Using fallback instructor status data');
  return [
    { id: '1', type: 'Certified Instructors', count: 0 },
    { id: '2', type: 'Provisional Instructors', count: 0 },
    { id: '3', type: 'Instructor Trainees', count: 0 }
  ];
};

export const useProviderDashboardData = () => {
  const { user } = useAuth();

  // Fetch provider metrics with safe fallbacks
  const { data: metrics, isLoading: metricsLoading, error: metricsError } = useQuery({
    queryKey: ['providerMetrics', user?.id],
    queryFn: async () => {
      try {
        if (!user?.id) {
          throw new Error('User ID not available');
        }

        const result = {
          activeInstructors: 0,
          upcomingCourses: 0,
          certificationsIssued: 0,
          instructorApplications: 0
        };

        // Try to get active instructors count from profiles
        try {
          const { count, error } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .in('role', ['IC', 'IP', 'IT'])
            .eq('status', 'ACTIVE');

          if (!error) {
            result.activeInstructors = count || 0;
          }
        } catch (err) {
          console.warn('Error fetching active instructors:', err);
        }

        // Try to get upcoming courses count
        try {
          const thirtyDaysFromNow = new Date();
          thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
          
          const { count, error } = await supabase
            .from('course_offerings')
            .select('*', { count: 'exact', head: true })
            .gt('start_date', new Date().toISOString())
            .lt('start_date', thirtyDaysFromNow.toISOString());

          if (!error) {
            result.upcomingCourses = count || 0;
          }
        } catch (err) {
          console.warn('Error fetching upcoming courses:', err);
        }

        // Try to get certifications issued count
        try {
          const oneYearAgo = new Date();
          oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
          
          const { count, error } = await supabase
            .from('certificates')
            .select('*', { count: 'exact', head: true })
            .eq('issued_by', user.id)
            .gt('issue_date', oneYearAgo.toISOString());

          if (!error) {
            result.certificationsIssued = count || 0;
          }
        } catch (err) {
          console.warn('Error fetching certifications issued:', err);
        }

        // Try to get instructor applications count
        try {
          const { count, error } = await supabase
            .from('instructor_applications')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'PENDING');

          if (!error) {
            result.instructorApplications = count || 0;
          }
        } catch (err) {
          console.warn('Error fetching instructor applications:', err);
        }

        return result;
      } catch (err) {
        console.error('Critical error in provider metrics fetch:', err);
        throw err;
      }
    },
    enabled: !!user?.id,
    retry: 2,
    retryDelay: 1000,
    staleTime: 30000
  });

  // Fetch upcoming courses with safe handling
  const { data: upcomingCourses, isLoading: coursesLoading, error: coursesError } = useQuery({
    queryKey: ['providerUpcomingCourses', user?.id],
    queryFn: async () => {
      try {
        if (!user?.id) {
          return generateFallbackCourses();
        }

        const { data, error } = await supabase
          .from('course_offerings')
          .select(`
            id,
            course_id,
            courses(name),
            start_date,
            enrollments(id)
          `)
          .gt('start_date', new Date().toISOString())
          .order('start_date', { ascending: true })
          .limit(5);

        if (error) {
          console.error('Error fetching upcoming courses:', error);
          return generateFallbackCourses();
        }

        if (!data || data.length === 0) {
          return generateFallbackCourses();
        }

        return data.map(item => ({
          id: item.id,
          name: item.courses?.name || 'Unnamed Course',
          date: new Date(item.start_date).toLocaleDateString(),
          time: 'TBD',
          enrolledCount: item.enrollments ? item.enrollments.length : 0
        }));
      } catch (err) {
        console.error('Critical error in upcoming courses fetch:', err);
        return generateFallbackCourses();
      }
    },
    enabled: !!user?.id,
    retry: 2,
    retryDelay: 1000,
    staleTime: 30000
  });

  // Fetch instructor status with safe handling
  const { data: instructorStatus, isLoading: statusLoading, error: statusError } = useQuery({
    queryKey: ['providerInstructorStatus', user?.id],
    queryFn: async () => {
      try {
        if (!user?.id) {
          return generateFallbackStatus();
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('id, role')
          .in('role', ['IC', 'IP', 'IT'])
          .eq('status', 'ACTIVE');

        if (error) {
          console.error('Error fetching instructor status:', error);
          return generateFallbackStatus();
        }

        if (!data || data.length === 0) {
          return generateFallbackStatus();
        }

        // Count instructors by role
        const counts = {
          'IC': 0, // Certified Instructors
          'IP': 0, // Provisional Instructors
          'IT': 0  // Instructor Trainees
        };

        data.forEach(instructor => {
          if (instructor.role && instructor.role in counts) {
            counts[instructor.role as keyof typeof counts]++;
          }
        });

        return [
          { id: '1', type: 'Certified Instructors', count: counts.IC },
          { id: '2', type: 'Provisional Instructors', count: counts.IP },
          { id: '3', type: 'Instructor Trainees', count: counts.IT }
        ];
      } catch (err) {
        console.error('Critical error in instructor status fetch:', err);
        return generateFallbackStatus();
      }
    },
    enabled: !!user?.id,
    retry: 2,
    retryDelay: 1000,
    staleTime: 30000
  });

  const isLoading = metricsLoading || coursesLoading || statusLoading;
  
  // Only consider it an error if all data fetching failed and we have no fallback data
  const hasData = metrics || upcomingCourses || instructorStatus;
  const error = !hasData && (metricsError || coursesError || statusError)
    ? new Error('Failed to load dashboard data')
    : null;

  return {
    metrics: metrics || generateFallbackMetrics(),
    upcomingCourses: upcomingCourses || generateFallbackCourses(),
    instructorStatus: instructorStatus || generateFallbackStatus(),
    isLoading,
    error
  };
};
