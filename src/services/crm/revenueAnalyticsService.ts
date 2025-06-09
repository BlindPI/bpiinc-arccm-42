
import { supabase } from '@/integrations/supabase/client';

export interface PipelineAnalytics {
  totalPipelineValue: number;
  stageDistribution: Array<{
    stage: string;
    value: number;
    count: number;
    stage_name: string;
    total_value: number;
    opportunity_count: number;
    avg_probability?: number;
  }>;
  conversionRates: Record<string, number>;
  averageDealSize: number;
  salesVelocity: number;
}

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

export interface ConversionFunnelData {
  stage: string;
  count: number;
  value: number;
  conversionRate: number;
}

export interface RevenueBySource {
  source: string;
  revenue: number;
  count: number;
  percentage: number;
}

export class RevenueAnalyticsService {
  static async getPipelineAnalytics(): Promise<PipelineAnalytics> {
    try {
      const { data: opportunities, error } = await supabase
        .from('crm_opportunities')
        .select('stage, estimated_value, probability')
        .eq('opportunity_status', 'open');

      if (error) throw error;

      const stageGroups = (opportunities || []).reduce((acc, opp) => {
        const stage = opp.stage || 'unknown';
        if (!acc[stage]) {
          acc[stage] = { count: 0, totalValue: 0, totalProbability: 0 };
        }
        acc[stage].count++;
        acc[stage].totalValue += opp.estimated_value || 0;
        acc[stage].totalProbability += opp.probability || 0;
        return acc;
      }, {} as Record<string, { count: number; totalValue: number; totalProbability: number }>);

      const stageDistribution = Object.entries(stageGroups).map(([stage, data]) => ({
        stage,
        value: data.totalValue,
        count: data.count,
        stage_name: stage,
        total_value: data.totalValue,
        opportunity_count: data.count,
        avg_probability: data.count > 0 ? data.totalProbability / data.count : 0
      }));

      const totalPipelineValue = stageDistribution.reduce((sum, stage) => sum + stage.total_value, 0);
      const averageDealSize = opportunities?.length ? totalPipelineValue / opportunities.length : 0;

      return {
        totalPipelineValue,
        stageDistribution,
        conversionRates: {},
        averageDealSize,
        salesVelocity: 0
      };
    } catch (error) {
      console.error('Error getting pipeline analytics:', error);
      return {
        totalPipelineValue: 0,
        stageDistribution: [],
        conversionRates: {},
        averageDealSize: 0,
        salesVelocity: 0
      };
    }
  }

  static async getMonthlyRevenueComparison(months: number = 12): Promise<MonthlyRevenueData[]> {
    try {
      const { data: opportunities, error } = await supabase
        .from('crm_opportunities')
        .select('estimated_value, created_at, stage')
        .eq('stage', 'closed_won')
        .gte('created_at', new Date(Date.now() - months * 30 * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      const monthlyData = (opportunities || []).reduce((acc, opp) => {
        const month = new Date(opp.created_at).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short' 
        });
        
        if (!acc[month]) {
          acc[month] = { revenue: 0, deals: 0 };
        }
        
        acc[month].revenue += opp.estimated_value || 0;
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
      console.error('Error getting monthly revenue:', error);
      return [];
    }
  }

  static async getRevenueForecast(periods: number = 6): Promise<RevenueForecast[]> {
    try {
      const { data: opportunities, error } = await supabase
        .from('crm_opportunities')
        .select('estimated_value, probability, expected_close_date')
        .eq('opportunity_status', 'open')
        .not('expected_close_date', 'is', null);

      if (error) throw error;

      const forecastData = (opportunities || []).reduce((acc, opp) => {
        const month = new Date(opp.expected_close_date).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short' 
        });
        
        if (!acc[month]) {
          acc[month] = { predicted: 0, confidence: 0, count: 0 };
        }
        
        const weightedValue = (opp.estimated_value || 0) * (opp.probability || 0) / 100;
        acc[month].predicted += weightedValue;
        acc[month].confidence += opp.probability || 0;
        acc[month].count += 1;
        
        return acc;
      }, {} as Record<string, { predicted: number; confidence: number; count: number }>);

      return Object.entries(forecastData).map(([month, data]) => ({
        month,
        predicted: data.predicted,
        confidence: data.count > 0 ? data.confidence / data.count : 0
      }));
    } catch (error) {
      console.error('Error getting revenue forecast:', error);
      return [];
    }
  }

  static async getConversionFunnelData(): Promise<ConversionFunnelData[]> {
    try {
      const { data: opportunities, error } = await supabase
        .from('crm_opportunities')
        .select('stage, estimated_value');

      if (error) throw error;

      const stages = ['prospect', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];
      const funnelData = stages.map(stage => {
        const stageOpps = (opportunities || []).filter(opp => opp.stage === stage);
        const totalValue = stageOpps.reduce((sum, opp) => sum + (opp.estimated_value || 0), 0);
        
        return {
          stage,
          count: stageOpps.length,
          value: totalValue,
          conversionRate: 0 // Would need historical data to calculate
        };
      });

      return funnelData;
    } catch (error) {
      console.error('Error getting conversion funnel data:', error);
      return [];
    }
  }

  static async getRevenueBySource(): Promise<RevenueBySource[]> {
    try {
      const { data: leads, error } = await supabase
        .from('crm_leads')
        .select('lead_source, lead_status')
        .eq('lead_status', 'converted');

      if (error) throw error;

      const sourceData = (leads || []).reduce((acc, lead) => {
        const source = lead.lead_source || 'unknown';
        if (!acc[source]) {
          acc[source] = { count: 0, revenue: 50000 }; // Placeholder revenue
        }
        acc[source].count += 1;
        return acc;
      }, {} as Record<string, { count: number; revenue: number }>);

      const totalRevenue = Object.values(sourceData).reduce((sum, data) => sum + data.revenue, 0);

      return Object.entries(sourceData).map(([source, data]) => ({
        source,
        revenue: data.revenue,
        count: data.count,
        percentage: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0
      }));
    } catch (error) {
      console.error('Error getting revenue by source:', error);
      return [];
    }
  }

  static async getPipelineMetrics() {
    return this.getPipelineAnalytics();
  }
}
