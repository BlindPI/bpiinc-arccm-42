
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface CourseAuditLog {
  id: string;
  course_id: string;
  action: string;
  performed_by?: string;
  performed_at: string;
  changes?: Record<string, any>;
  reason?: string;
  performer_name?: string;
}

export function useCourseAuditLogs(courseId?: string) {
  return useQuery({
    queryKey: ['course-audit-logs', courseId],
    queryFn: async () => {
      if (!courseId) return [];
      
      // First get the audit logs
      const { data, error } = await supabase
        .from('course_audit_logs')
        .select('*')
        .eq('course_id', courseId)
        .order('performed_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching course audit logs:', error);
        throw error;
      }
      
      // Process logs and fetch performer names separately to avoid join issues
      const logsWithPerformerNames = await Promise.all(
        data.map(async (log) => {
          let performer_name = 'Unknown';
          
          // If there's a performer ID, try to get their display name
          if (log.performed_by) {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('display_name')
              .eq('id', log.performed_by)
              .maybeSingle();
              
            if (profileData?.display_name) {
              performer_name = profileData.display_name;
            }
          }
          
          return {
            ...log,
            performer_name
          };
        })
      );
      
      return logsWithPerformerNames as CourseAuditLog[];
    },
    enabled: !!courseId,
  });
}
