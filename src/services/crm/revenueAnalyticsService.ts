
import { supabase } from '@/integrations/supabase/client';

export interface RevenueAnalytics {
  totalRevenue: number;
  revenueGrowth: number;
}

export class RevenueAnalyticsService {
  static async getRevenueAnalytics(timeRange: string): Promise<RevenueAnalytics> {
    try {
      // Get closed/won opportunities
      const { data: opportunities, error } = await supabase
        .from('crm_opportunities')
        .select('estimated_value, close_date')
        .eq('opportunity_status', 'closed_won');

      if (error) throw error;

      const totalRevenue = opportunities?.reduce((sum, opp) => sum + (opp.estimated_value || 0), 0) || 0;

      return {
        totalRevenue,
        revenueGrowth: 15.2 // Mock growth rate
      };
    } catch (error) {
      console.error('Error fetching revenue analytics:', error);
      return {
        totalRevenue: 0,
        revenueGrowth: 0
      };
    }
  }
}
