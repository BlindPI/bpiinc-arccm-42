
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';

export interface InstructorMetrics {
  upcomingClasses: number;
  studentsTaught: number;
  certificationsIssued: number;
  teachingHours: number;
}

export interface UpcomingClass {
  id: string;
  name: string;
  date: string;
  time: string;
  studentCount: number;
}

export interface CertificationStatus {
  id: string;
  name: string;
  expiryDate: string;
  status: 'valid' | 'expiring' | 'expired';
  daysRemaining?: number;
}

export interface ProgressionData {
  currentRole: string;
  nextRole: string | null;
  progressPercentage: number;
  requirements: {
    id: string;
    name: string;
    completed: boolean;
  }[];
}

// Default empty data structures
const emptyMetrics: InstructorMetrics = {
  upcomingClasses: 0,
  studentsTaught: 0,
  certificationsIssued: 0,
  teachingHours: 0
};

const emptyCertifications: CertificationStatus[] = [];

const getDefaultProgression = (currentRole?: string): ProgressionData => {
  return {
    currentRole: currentRole || 'IT',
    nextRole: currentRole === 'IT' ? 'IP' : currentRole === 'IP' ? 'IC' : null,
    progressPercentage: 0,
    requirements: []
  };
};

export const useInstructorDashboardData = () => {
  const { user } = useAuth();
  const { data: profile } = useProfile();

  // Safe metrics fetching
  const { data: metrics, isLoading: metricsLoading, error: metricsError } = useQuery({
    queryKey: ['instructorMetrics', user?.id],
    queryFn: async () => {
      try {
        if (!user?.id) {
          throw new Error('User ID not available');
        }

        const result = {
          upcomingClasses: 0,
          studentsTaught: 0,
          certificationsIssued: 0,
          teachingHours: 0
        };

        // Safely get upcoming classes count
        try {
          const twoWeeksFromNow = new Date();
          twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);
          
          const { count, error } = await supabase
            .from('course_offerings')
            .select('*', { count: 'exact', head: true })
            .eq('instructor_id', user.id)
            .gt('start_date', new Date().toISOString())
            .lt('start_date', twoWeeksFromNow.toISOString());

          if (error) {
            console.warn('Error fetching upcoming classes:', error);
          } else {
            result.upcomingClasses = count || 0;
          }
        } catch (err) {
          console.warn('Exception fetching upcoming classes:', err);
        }

        // Safely get students taught count
        try {
          const oneYearAgo = new Date();
          oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
          
          const { data: enrollments, error } = await supabase
            .from('course_offerings')
            .select(`
              id,
              enrollments(id)
            `)
            .eq('instructor_id', user.id)
            .gt('start_date', oneYearAgo.toISOString())
            .lt('start_date', new Date().toISOString());

          if (error) {
            console.warn('Error fetching enrollments:', error);
          } else if (enrollments) {
            result.studentsTaught = enrollments.reduce((total, offering) => 
              total + (offering.enrollments ? offering.enrollments.length : 0), 0);
          }
        } catch (err) {
          console.warn('Exception fetching students taught:', err);
        }

        // Safely get certifications issued count
        try {
          const oneYearAgo = new Date();
          oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
          
          const { count, error } = await supabase
            .from('certificates')
            .select('*', { count: 'exact', head: true })
            .eq('issued_by', user.id)
            .gt('issue_date', oneYearAgo.toISOString());

          if (error) {
            console.warn('Error fetching certifications issued:', error);
          } else {
            result.certificationsIssued = count || 0;
          }
        } catch (err) {
          console.warn('Exception fetching certifications issued:', err);
        }

        // Safely get teaching hours
        try {
          const threeMonthsAgo = new Date();
          threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
          
          const { data: teachingSessions, error } = await supabase
            .from('teaching_sessions')
            .select('hours_taught')
            .eq('instructor_id', user.id)
            .gt('session_date', threeMonthsAgo.toISOString());

          if (error) {
            console.warn('Error fetching teaching hours:', error);
          } else if (teachingSessions) {
            result.teachingHours = teachingSessions.reduce((total, session) => 
              total + (Number(session.hours_taught) || 0), 0);
          }
        } catch (err) {
          console.warn('Exception fetching teaching hours:', err);
        }

        return result;
      } catch (err) {
        console.error('Critical error in instructor metrics fetch:', err);
        throw err;
      }
    },
    enabled: !!user?.id,
    retry: 2,
    retryDelay: 1000,
    staleTime: 30000
  });

  // Safe upcoming schedule fetching
  const { data: upcomingClasses, isLoading: classesLoading, error: classesError } = useQuery({
    queryKey: ['instructorUpcomingClasses', user?.id],
    queryFn: async () => {
      try {
        if (!user?.id) {
          return [];
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
          .eq('instructor_id', user.id)
          .gt('start_date', new Date().toISOString())
          .order('start_date', { ascending: true })
          .limit(5);

        if (error) {
          console.error('Error fetching upcoming classes:', error);
          return [];
        }

        if (!data || data.length === 0) {
          return [];
        }

        return data.map(item => ({
          id: item.id,
          name: item.courses?.name || 'Unnamed Course',
          date: new Date(item.start_date).toLocaleDateString(),
          time: 'TBD',
          studentCount: item.enrollments ? item.enrollments.length : 0
        }));
      } catch (err) {
        console.error('Critical error in upcoming classes fetch:', err);
        return [];
      }
    },
    enabled: !!user?.id,
    retry: 2,
    retryDelay: 1000,
    staleTime: 30000
  });

  // Safe certification status fetching
  const { data: certificationStatus, isLoading: certLoading, error: certError } = useQuery({
    queryKey: ['instructorCertificationStatus', user?.id],
    queryFn: async () => {
      try {
        if (!user?.id) {
          return emptyCertifications;
        }

        // Check if instructor_qualifications table exists
        const { data, error } = await supabase
          .from('instructor_qualifications')
          .select(`
            id,
            qualification_type,
            expiry_date
          `)
          .eq('instructor_id', user.id);

        if (error) {
          console.warn('Error fetching certification status:', error);
          return emptyCertifications;
        }

        if (!data || data.length === 0) {
          return emptyCertifications;
        }

        const today = new Date();
        const sixtyDaysFromNow = new Date();
        sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);

        return data.map(cert => {
          const expiryDate = new Date(cert.expiry_date);
          const daysRemaining = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          let status: 'valid' | 'expiring' | 'expired';
          if (expiryDate < today) {
            status = 'expired';
          } else if (expiryDate < sixtyDaysFromNow) {
            status = 'expiring';
          } else {
            status = 'valid';
          }

          return {
            id: cert.id,
            name: cert.qualification_type,
            expiryDate: expiryDate.toLocaleDateString(),
            status,
            daysRemaining: daysRemaining > 0 ? daysRemaining : 0
          };
        });
      } catch (err) {
        console.error('Critical error in certification status fetch:', err);
        return emptyCertifications;
      }
    },
    enabled: !!user?.id,
    retry: 2,
    retryDelay: 1000,
    staleTime: 30000
  });

  // Safe progression data fetching
  const { data: progressionData, isLoading: progressionLoading, error: progressionError } = useQuery({
    queryKey: ['instructorProgressionData', user?.id, profile?.role],
    queryFn: async () => {
      try {
        if (!user?.id || !profile?.role) {
          return getDefaultProgression(profile?.role);
        }

        const currentRole = profile.role;
        
        // Determine next role
        let nextRole = null;
        if (currentRole === 'IT') nextRole = 'IP';
        else if (currentRole === 'IP') nextRole = 'IC';
        
        if (!nextRole) {
          return {
            currentRole,
            nextRole: null,
            progressPercentage: 100,
            requirements: []
          };
        }

        // Try to get progression requirements
        try {
          const { data: requirements, error: reqError } = await supabase
            .from('progression_requirements')
            .select(`
              id,
              title,
              description
            `)
            .eq('requirement_type', 'progression')
            .order('sort_order', { ascending: true });

          if (reqError) {
            console.warn('Error fetching progression requirements:', reqError);
            return getDefaultProgression(currentRole);
          }

          // Try to get completed requirements
          let completedIds = [];
          try {
            const { data: completed, error: compError } = await supabase
              .from('user_requirement_progress')
              .select('requirement_id')
              .eq('user_id', user.id)
              .eq('status', 'approved');

            if (!compError && completed) {
              completedIds = completed.map(item => item.requirement_id);
            }
          } catch (err) {
            console.warn('Error fetching completed requirements:', err);
          }
          
          const formattedRequirements = (requirements || []).map(req => ({
            id: req.id,
            name: req.title || req.description || 'Unknown Requirement',
            completed: completedIds.includes(req.id)
          }));

          const completedCount = formattedRequirements.filter(req => req.completed).length;
          const progressPercentage = requirements && requirements.length > 0 
            ? Math.round((completedCount / requirements.length) * 100) 
            : 0;

          return {
            currentRole,
            nextRole,
            progressPercentage,
            requirements: formattedRequirements
          };
        } catch (err) {
          console.warn('Error in progression requirements fetch:', err);
          return getDefaultProgression(currentRole);
        }
      } catch (err) {
        console.error('Critical error in progression data fetch:', err);
        return getDefaultProgression(profile?.role);
      }
    },
    enabled: !!user?.id && !!profile?.role,
    retry: 2,
    retryDelay: 1000,
    staleTime: 30000
  });

  const isLoading = metricsLoading || classesLoading || certLoading || progressionLoading;
  
  // Only consider it an error if all data fetching failed and we have no fallback data
  const hasData = metrics || upcomingClasses || certificationStatus || progressionData;
  const error = !hasData && (metricsError || classesError || certError || progressionError)
    ? new Error('Failed to load dashboard data')
    : null;

  return {
    metrics: metrics || emptyMetrics,
    upcomingClasses: upcomingClasses || [],
    certificationStatus: certificationStatus || emptyCertifications,
    progressionData: progressionData || getDefaultProgression(profile?.role),
    isLoading,
    error
  };
};
