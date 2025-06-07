
import { supabase } from '@/integrations/supabase/client';

export interface DateRange {
  from: Date;
  to: Date;
}

export interface MonthlyRevenueData {
  month: string;
  revenue: number;
  totalRevenue: number;
  target: number;
  growth: number;
  deals: number;
}

export interface RevenueBySource {
  source: string;
  revenue: number;
  count: number;
  percentage: number;
}

export interface RevenueForecast {
  period: string;
  month: string;
  predicted: number;
  confidence: number;
}

export interface RevenueMetrics {
  currentRevenue: number;
  previousRevenue: number;
  growthRate: number;
  pipelineValue: number;
  averageDealSize: number;
  forecastValue: number;
}

export class RevenueAnalyticsService {
  static async getPipelineMetrics() {
    try {
      const { data, error } = await supabase.rpc('get_pipeline_metrics');
      
      if (error) throw error;

      return {
        stageDistribution: data || [],
        totalPipelineValue: data?.reduce((sum: number, stage: any) => sum + stage.total_value, 0) || 0,
        weightedPipelineValue: data?.reduce((sum: number, stage: any) => sum + (stage.total_value * stage.avg_probability / 100), 0) || 0,
        averageCloseTime: 30,
        conversionRate: 25
      };
    } catch (error) {
      console.error('Error fetching pipeline metrics:', error);
      return {
        stageDistribution: [],
        totalPipelineValue: 0,
        weightedPipelineValue: 0,
        averageCloseTime: 0,
        conversionRate: 0
      };
    }
  }

  static async getMonthlyRevenueComparison(months: number = 12): Promise<MonthlyRevenueData[]> {
    // Mock implementation - replace with actual data fetching
    return Array.from({ length: months }, (_, i) => ({
      month: new Date(2024, i).toLocaleString('default', { month: 'short' }),
      revenue: Math.floor(Math.random() * 100000),
      totalRevenue: Math.floor(Math.random() * 100000),
      target: 75000,
      growth: Math.floor(Math.random() * 20) - 10,
      deals: Math.floor(Math.random() * 20) + 5
    }));
  }

  static async getRevenueForecast(periods: number = 4): Promise<RevenueForecast[]> {
    // Mock implementation - replace with actual forecasting logic
    return Array.from({ length: periods }, (_, i) => ({
      period: `Q${i + 1} 2024`,
      month: `Q${i + 1} 2024`,
      predicted: Math.floor(Math.random() * 250000),
      confidence: Math.floor(Math.random() * 40) + 60
    }));
  }

  static async getRevenueBySource(): Promise<RevenueBySource[]> {
    // Mock implementation - replace with actual data fetching
    const sources = ['website', 'referral', 'cold_call', 'email', 'social_media'];
    return sources.map(source => ({
      source,
      revenue: Math.floor(Math.random() * 50000),
      count: Math.floor(Math.random() * 100) + 10,
      percentage: Math.floor(Math.random() * 30) + 10
    }));
  }

  static async getRevenueMetrics(dateRange: DateRange): Promise<RevenueMetrics> {
    // Mock implementation - replace with actual data fetching
    return {
      currentRevenue: Math.floor(Math.random() * 500000),
      previousRevenue: Math.floor(Math.random() * 400000),
      growthRate: Math.floor(Math.random() * 20) - 5,
      pipelineValue: Math.floor(Math.random() * 1000000),
      averageDealSize: Math.floor(Math.random() * 50000),
      forecastValue: Math.floor(Math.random() * 750000)
    };
  }
}
