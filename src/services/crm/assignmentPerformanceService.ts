
import { supabase } from '@/integrations/supabase/client';
import { AssignmentPerformance } from '@/types/crm';

export class AssignmentPerformanceService {
  static transformPerformance(dbPerformance: any): AssignmentPerformance {
    return {
      ...dbPerformance,
      user_name: dbPerformance.profiles?.display_name || 'Unknown User',
      avg_response_time: String(dbPerformance.avg_response_time || ''),
      quality_score: dbPerformance.quality_score || 0,
      current_load: dbPerformance.current_load || 0,
      max_capacity: dbPerformance.max_capacity || 50,
      availability_status: dbPerformance.availability_status as 'available' | 'busy' | 'unavailable' || 'available'
    };
  }

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
      return (data || []).map(this.transformPerformance);
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
        .select(`
          *,
          profiles:user_id (
            display_name,
            email,
            role
          )
        `)
        .single();

      if (error) throw error;
      return data ? this.transformPerformance(data) : null;
    } catch (error) {
      console.error('Error updating assignment performance:', error);
      return null;
    }
  }
}
