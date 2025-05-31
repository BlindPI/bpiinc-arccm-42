
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';

interface SystemAdminData {
  totalUsers: number;
  activeCourses: number;
  systemHealth: {
    status: string;
    message: string;
  };
}

interface ProviderData {
  activeInstructors: number;
  upcomingCourses: number;
  certificationsIssued: number;
  instructorApplications: number;
}

interface InstructorData {
  upcomingClasses: number;
  studentsTaught: number;
  certificationsIssued: number;
  teachingHours: number;
}

interface StudentData {
  activeCourses: number;
  completedCourses: number;
  certificates: number;
  studyHours: number;
}

// Extracted data fetching functions with explicit return types
async function fetchSystemAdminData(): Promise<SystemAdminData> {
  const [usersResult, coursesResult, systemHealth] = await Promise.all([
    supabase.from('profiles').select('id, role, status').eq('status', 'ACTIVE'),
    supabase.from('courses').select('id, status').eq('status', 'ACTIVE'),
    supabase.from('profiles').select('id').limit(1)
  ]);

  return {
    totalUsers: usersResult.data?.length || 0,
    activeCourses: coursesResult.data?.length || 0,
    systemHealth: {
      status: systemHealth.error ? 'DOWN' : 'HEALTHY',
      message: systemHealth.error ? 'System issues detected' : 'All systems operational'
    }
  };
}

async function fetchProviderData(profileId: string): Promise<ProviderData> {
  const [instructorsResult, coursesResult, certificatesResult] = await Promise.all([
    supabase.from('profiles').select('id').in('role', ['IC', 'IP', 'IT']),
    supabase.from('courses').select('id').gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    supabase.from('certificates').select('id').gte('created_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())
  ]);

  return {
    activeInstructors: instructorsResult.data?.length || 0,
    upcomingCourses: coursesResult.data?.length || 0,
    certificationsIssued: certificatesResult.data?.length || 0,
    instructorApplications: 0
  };
}

async function fetchInstructorData(userId: string): Promise<InstructorData> {
  const [sessionsResult, certificatesResult] = await Promise.all([
    supabase.from('teaching_sessions').select('id').eq('instructor_id', userId).gte('session_date', new Date().toISOString()),
    supabase.from('certificates').select('id').eq('created_by', userId).gte('created_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())
  ]);

  return {
    upcomingClasses: sessionsResult.data?.length || 0,
    studentsTaught: 0,
    certificationsIssued: certificatesResult.data?.length || 0,
    teachingHours: 0
  };
}

async function fetchStudentData(userId: string): Promise<StudentData> {
  const [enrollmentsResult, certificatesResult] = await Promise.all([
    supabase.from('course_enrollments').select('id, status').eq('student_id', userId),
    supabase.from('certificates').select('id').eq('recipient_id', userId)
  ]);

  const activeCourses = enrollmentsResult.data?.filter(e => e.status === 'ENROLLED').length || 0;
  const completedCourses = enrollmentsResult.data?.filter(e => e.status === 'COMPLETED').length || 0;

  return {
    activeCourses,
    completedCourses,
    certificates: certificatesResult.data?.length || 0,
    studyHours: 0
  };
}

export const useSystemAdminRealData = () => {
  return useQuery<SystemAdminData>({
    queryKey: ['system-admin-dashboard-data'],
    queryFn: fetchSystemAdminData
  });
};

export const useProviderRealData = () => {
  const { data: profile } = useProfile();
  
  return useQuery<ProviderData | null>({
    queryKey: ['provider-dashboard-data', profile?.id],
    queryFn: async (): Promise<ProviderData | null> => {
      if (!profile?.id) return null;
      return fetchProviderData(profile.id);
    },
    enabled: !!profile?.id
  });
};

export const useInstructorRealData = (userId: string) => {
  return useQuery<InstructorData>({
    queryKey: ['instructor-dashboard-data', userId],
    queryFn: () => fetchInstructorData(userId)
  });
};

export const useStudentRealData = (userId: string) => {
  return useQuery<StudentData>({
    queryKey: ['student-dashboard-data', userId],
    queryFn: () => fetchStudentData(userId)
  });
};
