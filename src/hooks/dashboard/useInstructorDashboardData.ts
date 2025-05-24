import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';

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

export const useInstructorDashboardData = () => {
  const { user } = useAuth();
  const { data: profile } = useProfile();

  // Fetch instructor metrics
  const { data: metrics, isLoading: metricsLoading, error: metricsError } = useQuery({
    queryKey: ['instructorMetrics', user?.id],
    queryFn: async () => {
      // Get upcoming classes count (next 14 days)
      const twoWeeksFromNow = new Date();
      twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);
      
      const { count: upcomingClasses, error: classesError } = await supabase
        .from('course_offerings')
        .select('*', { count: 'exact', head: true })
        .eq('instructor_id', user?.id)
        .gt('start_date', new Date().toISOString())
        .lt('start_date', twoWeeksFromNow.toISOString());

      if (classesError) throw classesError;

      // Get students taught count (last 12 months)
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('course_offerings')
        .select(`
          id,
          enrollments(id)
        `)
        .eq('instructor_id', user?.id)
        .gt('start_date', oneYearAgo.toISOString())
        .lt('start_date', new Date().toISOString());

      if (enrollmentsError) throw enrollmentsError;

      const studentsTaught = enrollments.reduce((total, offering) => 
        total + (offering.enrollments ? offering.enrollments.length : 0), 0);

      // Get certifications issued count (last 12 months)
      const { count: certificationsIssued, error: certError } = await supabase
        .from('certificates')
        .select('*', { count: 'exact', head: true })
        .eq('issued_by', user?.id)
        .gt('issued_date', oneYearAgo.toISOString());

      if (certError) throw certError;

      // Get teaching hours (last 3 months)
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      
      const { data: teachingLogs, error: logsError } = await supabase
        .from('teaching_logs')
        .select('hours')
        .eq('instructor_id', user?.id)
        .gt('date', threeMonthsAgo.toISOString());

      if (logsError) throw logsError;

      const teachingHours = teachingLogs.reduce((total, log) => 
        total + (log.hours || 0), 0);

      return {
        upcomingClasses: upcomingClasses || 0,
        studentsTaught,
        certificationsIssued: certificationsIssued || 0,
        teachingHours
      };
    },
    enabled: !!user
  });

  // Fetch upcoming schedule
  const { data: upcomingClasses, isLoading: classesLoading, error: classesError } = useQuery({
    queryKey: ['instructorUpcomingClasses', user?.id],
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
        .eq('instructor_id', user?.id)
        .gt('start_date', new Date().toISOString())
        .order('start_date', { ascending: true })
        .limit(5);

      if (error) throw error;

      return data.map(item => ({
        id: item.id,
        name: item.courses?.name || 'Unnamed Course',
        date: new Date(item.start_date).toLocaleDateString(),
        time: item.start_time || 'TBD',
        studentCount: item.enrollments ? item.enrollments.length : 0
      }));
    },
    enabled: !!user
  });

  // Fetch certification status
  const { data: certificationStatus, isLoading: certLoading, error: certError } = useQuery({
    queryKey: ['instructorCertificationStatus', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('instructor_certifications')
        .select(`
          id,
          certification_type,
          expiry_date
        `)
        .eq('instructor_id', user?.id);

      if (error) throw error;

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
          name: cert.certification_type,
          expiryDate: expiryDate.toLocaleDateString(),
          status,
          daysRemaining: daysRemaining > 0 ? daysRemaining : 0
        };
      });
    },
    enabled: !!user
  });

  // Fetch progression path data
  const { data: progressionData, isLoading: progressionLoading, error: progressionError } = useQuery({
    queryKey: ['instructorProgressionData', user?.id, profile?.role],
    queryFn: async () => {
      if (!profile?.role) {
        throw new Error("User role not available");
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

      // Get progression requirements
      const { data: requirements, error: reqError } = await supabase
        .from('progression_requirements')
        .select(`
          id,
          requirement_name,
          from_role,
          to_role
        `)
        .eq('from_role', currentRole)
        .eq('to_role', nextRole);

      if (reqError) throw reqError;

      // Get completed requirements
      const { data: completed, error: compError } = await supabase
        .from('completed_requirements')
        .select(`
          requirement_id
        `)
        .eq('instructor_id', user?.id);

      if (compError) throw compError;

      const completedIds = completed.map(item => item.requirement_id);
      
      const formattedRequirements = requirements.map(req => ({
        id: req.id,
        name: req.requirement_name,
        completed: completedIds.includes(req.id)
      }));

      const completedCount = formattedRequirements.filter(req => req.completed).length;
      const progressPercentage = requirements.length > 0 
        ? Math.round((completedCount / requirements.length) * 100) 
        : 0;

      return {
        currentRole,
        nextRole,
        progressPercentage,
        requirements: formattedRequirements
      };
    },
    enabled: !!user && !!profile?.role
  });

  const isLoading = metricsLoading || classesLoading || certLoading || progressionLoading;
  const error = metricsError || classesError || certError || progressionError;

  return {
    metrics,
    upcomingClasses,
    certificationStatus,
    progressionData,
    isLoading,
    error
  };
};