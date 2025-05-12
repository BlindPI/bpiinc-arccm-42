
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
      
      // Fetch audit logs with performer information
      const { data, error } = await supabase
        .from('course_audit_logs')
        .select(`
          *,
          performer:performed_by(id, display_name)
        `)
        .eq('course_id', courseId)
        .order('performed_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching course audit logs:', error);
        throw error;
      }
      
      // Add formatted performer_name to each log
      const logsWithPerformerNames = data.map(log => ({
        ...log,
        performer_name: log.performer?.display_name || 'Unknown'
      }));
      
      return logsWithPerformerNames as CourseAuditLog[];
    },
    enabled: !!courseId,
  });
}
