
import { supabase } from '@/integrations/supabase/client';
import { TeamPerformanceMetric } from './types';

export class PerformanceService {
  async recordTeamPerformance(metric: Omit<TeamPerformanceMetric, 'id' | 'recorded_by'>): Promise<void> {
    try {
      const { error } = await supabase
        .from('team_performance_metrics')
        .insert({
          ...metric,
          recorded_by: (await supabase.auth.getUser()).data.user?.id
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

      if (error) {
        console.warn('Performance summary function not available yet:', error);
        return null;
      }
      
      return data?.[0] || null;
    } catch (error) {
      console.error('Error fetching team performance summary:', error);
      return null;
    }
  }
}
