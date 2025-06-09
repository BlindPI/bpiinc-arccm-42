
import { supabase } from '@/integrations/supabase/client';
import { AssignmentPerformance } from '@/types/crm';

export class AssignmentPerformanceService {
  static async getAssignmentPerformance(): Promise<AssignmentPerformance[]> {
    try {
      const { data, error } = await supabase
        .from('crm_assignment_performance')
        .select(`
          *,
          profiles:user_id (
            display_name,
            email,
            role
          )
        `);

      if (error) throw error;

      return (data || []).map(performance => ({
        ...performance,
        user_name: performance.profiles?.display_name || 'Unknown User',
        avg_response_time: String(performance.avg_response_time || ''),
        quality_score: performance.quality_score || 0,
        current_load: performance.current_load || 0,
        max_capacity: performance.max_capacity || 50,
        availability_status: performance.availability_status || 'available'
      }));
    } catch (error) {
      console.error('Error fetching assignment performance:', error);
      return [];
    }
  }

  static async updateAssignmentPerformance(
    userId: string,
    updates: Partial<AssignmentPerformance>
  ): Promise<AssignmentPerformance | null> {
    try {
      const { data, error } = await supabase
        .from('crm_assignment_performance')
        .upsert({
          user_id: userId,
          assignment_date: new Date().toISOString().split('T')[0],
          ...updates,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating assignment performance:', error);
      return null;
    }
  }
}
