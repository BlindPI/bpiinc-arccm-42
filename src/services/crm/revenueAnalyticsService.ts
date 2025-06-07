
import { supabase } from '@/integrations/supabase/client';

export interface RevenueAnalytics {
  totalRevenue: number;
  revenueGrowth: number;
}

export interface RevenueMetrics {
  currentRevenue: number;
  previousRevenue: number;
  growthRate: number;
  averageDealSize: number;
}

export interface PipelineMetrics {
  totalPipelineValue: number;
  weightedPipelineValue: number;
  averageCloseTime: number;
  conversionRate: number;
}

export interface MonthlyRevenueData {
  month: string;
  revenue: number;
  deals: number;
}

export interface RevenueBySource {
  source: string;
  revenue: number;
  percentage: number;
}

export interface RevenueForecast {
  month: string;
  predicted: number;
  confidence: number;
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

  static async getRevenueMetrics(dateRange: { from: Date; to: Date }): Promise<RevenueMetrics> {
    try {
      const { data: opportunities, error } = await supabase
        .from('crm_opportunities')
        .select('estimated_value, close_date')
        .eq('opportunity_status', 'closed_won')
        .gte('close_date', dateRange.from.toISOString())
        .lte('close_date', dateRange.to.toISOString());

      if (error) throw error;

      const currentRevenue = opportunities?.reduce((sum, opp) => sum + (opp.estimated_value || 0), 0) || 0;
      const dealCount = opportunities?.length || 0;
      const averageDealSize = dealCount > 0 ? currentRevenue / dealCount : 0;

      return {
        currentRevenue,
        previousRevenue: currentRevenue * 0.9, // Mock previous period
        growthRate: 10.5,
        averageDealSize
      };
    } catch (error) {
      console.error('Error fetching revenue metrics:', error);
      return {
        currentRevenue: 0,
        previousRevenue: 0,
        growthRate: 0,
        averageDealSize: 0
      };
    }
  }

  static async getPipelineMetrics(): Promise<PipelineMetrics> {
    try {
      const { data: opportunities, error } = await supabase
        .from('crm_opportunities')
        .select('estimated_value, probability, opportunity_stage');

      if (error) throw error;

      const totalPipelineValue = opportunities?.reduce((sum, opp) => sum + (opp.estimated_value || 0), 0) || 0;
      const weightedPipelineValue = opportunities?.reduce((sum, opp) => 
        sum + ((opp.estimated_value || 0) * (opp.probability || 0) / 100), 0) || 0;

      return {
        totalPipelineValue,
        weightedPipelineValue,
        averageCloseTime: 45, // Mock data
        conversionRate: 25.5 // Mock data
      };
    } catch (error) {
      console.error('Error fetching pipeline metrics:', error);
      return {
        totalPipelineValue: 0,
        weightedPipelineValue: 0,
        averageCloseTime: 0,
        conversionRate: 0
      };
    }
  }

  static async getMonthlyRevenueComparison(months: number = 12): Promise<MonthlyRevenueData[]> {
    try {
      // Mock data for now - replace with actual query
      const data: MonthlyRevenueData[] = [];
      const now = new Date();
      
      for (let i = months - 1; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        data.push({
          month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          revenue: Math.floor(Math.random() * 50000) + 20000,
          deals: Math.floor(Math.random() * 20) + 5
        });
      }

      return data;
    } catch (error) {
      console.error('Error fetching monthly revenue comparison:', error);
      return [];
    }
  }

  static async getRevenueBySource(): Promise<RevenueBySource[]> {
    try {
      // Mock data for now
      return [
        { source: 'Website', revenue: 45000, percentage: 35 },
        { source: 'Referral', revenue: 38000, percentage: 30 },
        { source: 'Social Media', revenue: 25000, percentage: 20 },
        { source: 'Cold Outreach', revenue: 19000, percentage: 15 }
      ];
    } catch (error) {
      console.error('Error fetching revenue by source:', error);
      return [];
    }
  }

  static async getRevenueForecast(months: number = 6): Promise<RevenueForecast[]> {
    try {
      // Mock forecast data
      const data: RevenueForecast[] = [];
      const now = new Date();
      
      for (let i = 1; i <= months; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
        data.push({
          month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          predicted: Math.floor(Math.random() * 60000) + 40000,
          confidence: Math.floor(Math.random() * 30) + 70
        });
      }

      return data;
    } catch (error) {
      console.error('Error fetching revenue forecast:', error);
      return [];
    }
  }
}
