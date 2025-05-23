
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
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

export const useProviderDashboardData = () => {
  const { user } = useAuth();
  const { data: profile } = useProfile();

  // Get provider ID for the current user
  const { data: providerId, isLoading: providerIdLoading } = useQuery({
    queryKey: ['providerId', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      // First try to get from authorized_providers table
      const { data, error } = await supabase
        .from('authorized_providers')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (!error && data?.id) {
        return data.id;
      }
      
      // If not found, use the user ID as fallback
      return user.id;
    },
    enabled: !!user?.id,
    retry: 2,
    retryDelay: 1000,
    staleTime: 60000
  });

  // Fetch provider metrics from the provider_metrics table
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['providerMetrics', providerId],
    queryFn: async () => {
      if (!providerId) return null;
      
      // First try to get from provider_metrics table
      const { data, error } = await supabase
        .from('provider_metrics')
        .select('*')
        .eq('provider_id', providerId)
        .single();
      
      if (!error && data) {
        return {
          activeInstructors: data.active_instructors || 0,
          upcomingCourses: data.courses_offered || 0,
          certificationsIssued: 0, // Will calculate separately
          instructorApplications: 0 // Will calculate separately
        };
      }
      
      // If not found in provider_metrics, calculate on the fly
      const result: ProviderMetrics = {
        activeInstructors: 0,
        upcomingCourses: 0,
        certificationsIssued: 0,
        instructorApplications: 0
      };
      
      // Get active instructors count
      try {
        const { count } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .in('role', ['IC', 'IP', 'IT'])
          .eq('status', 'ACTIVE');
        
        result.activeInstructors = count || 0;
      } catch (err) {
        console.warn('Error fetching active instructors:', err);
      }
      
      // Get upcoming courses count
      try {
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        
        const { count } = await supabase
          .from('course_offerings')
          .select('*', { count: 'exact', head: true })
          .gt('start_date', new Date().toISOString())
          .lt('start_date', thirtyDaysFromNow.toISOString());
        
        result.upcomingCourses = count || 0;
      } catch (err) {
        console.warn('Error fetching upcoming courses:', err);
      }
      
      // Get certifications issued count
      try {
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        
        const { count } = await supabase
          .from('certificates')
          .select('*', { count: 'exact', head: true })
          .eq('issued_by', user.id)
          .gt('issue_date', oneYearAgo.toISOString());
        
        result.certificationsIssued = count || 0;
      } catch (err) {
        console.warn('Error fetching certifications issued:', err);
      }
      
      // Get instructor applications count
      try {
        const { count } = await supabase
          .from('instructor_applications')
          .select('*', { count: 'exact', head: true })
          .eq('provider_id', providerId)
          .eq('status', 'PENDING');
        
        result.instructorApplications = count || 0;
      } catch (err) {
        console.warn('Error fetching instructor applications:', err);
      }
      
      return result;
    },
    enabled: !!providerId,
    retry: 2,
    retryDelay: 1000,
    staleTime: 30000
  });

  // Fetch upcoming courses
  const { data: upcomingCourses, isLoading: coursesLoading } = useQuery({
    queryKey: ['providerUpcomingCourses', providerId],
    queryFn: async () => {
      if (!providerId) return [];
      
      const { data, error } = await supabase
        .from('course_offerings')
        .select(`
          id,
          course_id,
          courses(name),
          start_date,
          end_date,
          enrollments(id)
        `)
        .eq('provider_id', providerId)
        .gt('start_date', new Date().toISOString())
        .order('start_date', { ascending: true })
        .limit(5);
      
      if (error) {
        console.error('Error fetching upcoming courses:', error);
        return [];
      }
      
      if (!data || data.length === 0) {
        return [];
      }
      
      return data.map(item => ({
        id: item.id,
        name: item.courses?.name || 'Unnamed Course',
        date: new Date(item.start_date).toLocaleDateString(),
        time: new Date(item.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        enrolledCount: item.enrollments?.length || 0
      }));
    },
    enabled: !!providerId,
    retry: 2,
    retryDelay: 1000,
    staleTime: 30000
  });

  // Fetch instructor status
  const { data: instructorStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['providerInstructorStatus', providerId],
    queryFn: async () => {
      if (!providerId) return [];
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, role')
        .in('role', ['IC', 'IP', 'IT'])
        .eq('status', 'ACTIVE');
      
      if (error) {
        console.error('Error fetching instructor status:', error);
        return [
          { id: '1', type: 'Certified Instructors', count: 0 },
          { id: '2', type: 'Provisional Instructors', count: 0 },
          { id: '3', type: 'Instructor Trainees', count: 0 }
        ];
      }
      
      if (!data || data.length === 0) {
        return [
          { id: '1', type: 'Certified Instructors', count: 0 },
          { id: '2', type: 'Provisional Instructors', count: 0 },
          { id: '3', type: 'Instructor Trainees', count: 0 }
        ];
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
    },
    enabled: !!providerId,
    retry: 2,
    retryDelay: 1000,
    staleTime: 30000
  });

  const isLoading = providerIdLoading || metricsLoading || coursesLoading || statusLoading;
  
  return {
    metrics: metrics || {
      activeInstructors: 0,
      upcomingCourses: 0,
      certificationsIssued: 0,
      instructorApplications: 0
    },
    upcomingCourses: upcomingCourses || [],
    instructorStatus: instructorStatus || [
      { id: '1', type: 'Certified Instructors', count: 0 },
      { id: '2', type: 'Provisional Instructors', count: 0 },
      { id: '3', type: 'Instructor Trainees', count: 0 }
    ],
    isLoading,
    error: null
  };
};
