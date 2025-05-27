
import { supabase } from '@/integrations/supabase/client';
import type { TeamPerformanceMetric } from './types';

export class PerformanceService {
  async recordTeamPerformance(metric: Omit<TeamPerformanceMetric, 'id' | 'recorded_by'>): Promise<void> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User must be authenticated to record performance');
      }

      const { error } = await supabase
        .from('team_performance_metrics')
        .insert({
          ...metric,
          recorded_by: user.id,
          recorded_date: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error recording team performance:', error);
      throw error;
    }
  }

  async getTeamPerformanceSummary(teamId: string, period: string = 'monthly'): Promise<any> {
    try {
      const { data, error } = await supabase.rpc('get_team_performance_summary', {
        p_team_id: teamId,
        p_period: period
      });

      if (error) throw error;
      return data?.[0] || null;
    } catch (error) {
      console.error('Error fetching team performance summary:', error);
      return null;
    }
  }
}
