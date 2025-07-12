import { supabase } from '@/integrations/supabase/client';

// Utility functions to prevent deep type instantiation
export const queryWorkflowInstances = async (filters?: any) => {
  const query = supabase
    .from('workflow_instances')
    .select('*');
    
  if (filters?.entity_type) {
    query.eq('entity_type', filters.entity_type);
  }
  if (filters?.entity_id) {
    query.eq('entity_id', filters.entity_id);
  }
  if (filters?.status) {
    query.in('status', filters.status);
  }
  
  const response = await query;
  return response;
};

export const queryCourseSchedules = async (teamId: string, limit = 5) => {
  const response = await supabase
    .from('course_schedules')
    .select('id, start_date, status, current_enrollment, course_id')
    .eq('team_id', teamId)
    .order('start_date', { ascending: false })
    .limit(limit);
    
  return response;
};

export const queryCertificates = async (locationId: string, limit = 5) => {
  const response = await supabase
    .from('certificates')
    .select('id, recipient_name, course_name, issue_date, status, created_at')
    .eq('location_id', locationId)
    .order('issue_date', { ascending: false })
    .limit(limit);
    
  return response;
};

// Safe type casting function
export const safeQueryResult = <T>(data: any): T[] => {
  return (data || []) as T[];
};

export const safeSingleResult = <T>(data: any): T | null => {
  return data as T | null;
};