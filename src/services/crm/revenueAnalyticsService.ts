
import { supabase } from '@/integrations/supabase/client';

export interface MonthlyRevenueData {
  month: string;
  revenue: number;
  deals: number;
  totalRevenue: number;
}

export interface RevenueForecast {
  month: string;
  predicted: number;
  confidence: number;
}

export interface RevenueBySource {
  source: string;
  revenue: number;
  count: number;
}

export class RevenueAnalyticsService {
  static async getMonthlyRevenueComparison(months: number = 12): Promise<MonthlyRevenueData[]> {
    try {
      const { data, error } = await supabase
        .from('crm_opportunities')
        .select('estimated_value, stage, created_at, close_date')
        .eq('stage', 'closed_won')
        .gte('close_date', new Date(Date.now() - months * 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('close_date', { ascending: true });

      if (error) throw error;

      const monthlyData = (data || []).reduce((acc, opportunity) => {
        const month = new Date(opportunity.close_date).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short' 
        });
        
        if (!acc[month]) {
          acc[month] = { revenue: 0, deals: 0 };
        }
        
        acc[month].revenue += opportunity.estimated_value || 0;
        acc[month].deals += 1;
        
        return acc;
      }, {} as Record<string, { revenue: number; deals: number }>);

      return Object.entries(monthlyData).map(([month, data]) => ({
        month,
        revenue: data.revenue,
        deals: data.deals,
        totalRevenue: data.revenue
      }));
    } catch (error) {
      console.error('Error fetching monthly revenue:', error);
      return [];
    }
  }

  static async getRevenueForecast(periods: number = 6): Promise<RevenueForecast[]> {
    try {
      const { data, error } = await supabase
        .from('crm_opportunities')
        .select('estimated_value, probability, expected_close_date, stage')
        .eq('opportunity_status', 'open')
        .not('expected_close_date', 'is', null)
        .gte('expected_close_date', new Date().toISOString())
        .order('expected_close_date', { ascending: true });

      if (error) throw error;

      const forecastData = (data || []).reduce((acc, opportunity) => {
        const month = new Date(opportunity.expected_close_date).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short' 
        });
        
        if (!acc[month]) {
          acc[month] = { 
            predicted: 0, 
            totalProbability: 0, 
            count: 0 
          };
        }
        
        const weightedValue = (opportunity.estimated_value || 0) * (opportunity.probability || 0) / 100;
        acc[month].predicted += weightedValue;
        acc[month].totalProbability += opportunity.probability || 0;
        acc[month].count += 1;
        
        return acc;
      }, {} as Record<string, { predicted: number; totalProbability: number; count: number }>);

      return Object.entries(forecastData)
        .slice(0, periods)
        .map(([month, data]) => ({
          month,
          predicted: data.predicted,
          confidence: data.count > 0 ? data.totalProbability / data.count : 0
        }));
    } catch (error) {
      console.error('Error fetching revenue forecast:', error);
      return [];
    }
  }

  static async getRevenueBySource(): Promise<RevenueBySource[]> {
    try {
      const { data, error } = await supabase
        .from('crm_opportunities')
        .select(`
          estimated_value,
          lead_source,
          stage
        `)
        .eq('stage', 'closed_won');

      if (error) throw error;

      const sourceData = (data || []).reduce((acc, opportunity) => {
        const source = opportunity.lead_source || 'unknown';
        
        if (!acc[source]) {
          acc[source] = { revenue: 0, count: 0 };
        }
        
        acc[source].revenue += opportunity.estimated_value || 0;
        acc[source].count += 1;
        
        return acc;
      }, {} as Record<string, { revenue: number; count: number }>);

      return Object.entries(sourceData).map(([source, data]) => ({
        source,
        revenue: data.revenue,
        count: data.count
      }));
    } catch (error) {
      console.error('Error fetching revenue by source:', error);
      return [];
    }
  }

  static async getPipelineAnalytics() {
    try {
      const { data, error } = await supabase
        .from('crm_opportunities')
        .select('stage, estimated_value, probability, created_at, opportunity_status')
        .eq('opportunity_status', 'open');

      if (error) throw error;

      const stageMetrics = (data || []).reduce((acc, opp) => {
        const stage = opp.stage;
        if (!acc[stage]) {
          acc[stage] = {
            stage_name: stage,
            opportunity_count: 0,
            total_value: 0,
            avg_probability: 0,
            probabilities: []
          };
        }
        
        acc[stage].opportunity_count++;
        acc[stage].total_value += opp.estimated_value || 0;
        acc[stage].probabilities.push(opp.probability || 0);
        
        return acc;
      }, {} as Record<string, any>);

      // Calculate average probabilities
      Object.values(stageMetrics).forEach((stage: any) => {
        if (stage.probabilities.length > 0) {
          stage.avg_probability = stage.probabilities.reduce((a: number, b: number) => a + b, 0) / stage.probabilities.length;
        }
        delete stage.probabilities;
      });

      return Object.values(stageMetrics);
    } catch (error) {
      console.error('Error fetching pipeline analytics:', error);
      return [];
    }
  }

  static async getConversionFunnelData() {
    try {
      const { data: leads, error: leadsError } = await supabase
        .from('crm_leads')
        .select('lead_status, lead_score, created_at');

      const { data: opportunities, error: oppsError } = await supabase
        .from('crm_opportunities')
        .select('stage, lead_id, created_at');

      if (leadsError || oppsError) throw leadsError || oppsError;

      const leadsByStatus = (leads || []).reduce((acc, lead) => {
        acc[lead.lead_status] = (acc[lead.lead_status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const oppsByStage = (opportunities || []).reduce((acc, opp) => {
        acc[opp.stage] = (acc[opp.stage] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        leadsByStatus,
        oppsByStage,
        conversionRate: {
          leadToOpportunity: leads?.length > 0 ? (opportunities?.length || 0) / leads.length * 100 : 0,
          opportunityToWon: opportunities?.length > 0 ? (oppsByStage['closed_won'] || 0) / opportunities.length * 100 : 0
        }
      };
    } catch (error) {
      console.error('Error fetching conversion funnel data:', error);
      return null;
    }
  }

  static async getPipelineMetrics() {
    return this.getPipelineAnalytics();
  }
}
