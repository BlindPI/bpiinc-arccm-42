
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
    try {
      const { data, error } = await supabase
        .from('crm_opportunities')
        .select('estimated_value, close_date, stage, created_at')
        .eq('stage', 'closed_won')
        .gte('close_date', new Date(Date.now() - months * 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('close_date', { ascending: true });

      if (error) throw error;

      // Group by month
      const monthlyData: { [key: string]: { revenue: number; deals: number } } = {};
      
      data?.forEach(opportunity => {
        if (opportunity.close_date) {
          const month = new Date(opportunity.close_date).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short' 
          });
          
          if (!monthlyData[month]) {
            monthlyData[month] = { revenue: 0, deals: 0 };
          }
          
          monthlyData[month].revenue += opportunity.estimated_value || 0;
          monthlyData[month].deals += 1;
        }
      });

      // Convert to array format
      const result = Object.entries(monthlyData).map(([month, data]) => ({
        month,
        revenue: data.revenue,
        totalRevenue: data.revenue,
        target: 75000, // This could be configured
        growth: 0, // Calculate growth rate
        deals: data.deals
      }));

      // Calculate growth rates
      for (let i = 1; i < result.length; i++) {
        const current = result[i].revenue;
        const previous = result[i - 1].revenue;
        result[i].growth = previous > 0 ? ((current - previous) / previous) * 100 : 0;
      }

      return result;
    } catch (error) {
      console.error('Error fetching monthly revenue data:', error);
      return [];
    }
  }

  static async getRevenueForecast(periods: number = 4): Promise<RevenueForecast[]> {
    try {
      const { data, error } = await supabase
        .from('crm_opportunities')
        .select('estimated_value, probability, close_date, stage')
        .eq('opportunity_status', 'open')
        .not('close_date', 'is', null)
        .gte('close_date', new Date().toISOString());

      if (error) throw error;

      // Group by quarter/period
      const forecastData: { [key: string]: { predicted: number; opportunities: number; totalProbability: number } } = {};
      
      data?.forEach(opportunity => {
        if (opportunity.close_date) {
          const closeDate = new Date(opportunity.close_date);
          const quarter = `Q${Math.ceil((closeDate.getMonth() + 1) / 3)} ${closeDate.getFullYear()}`;
          
          if (!forecastData[quarter]) {
            forecastData[quarter] = { predicted: 0, opportunities: 0, totalProbability: 0 };
          }
          
          const weightedValue = (opportunity.estimated_value || 0) * (opportunity.probability || 0) / 100;
          forecastData[quarter].predicted += weightedValue;
          forecastData[quarter].opportunities += 1;
          forecastData[quarter].totalProbability += opportunity.probability || 0;
        }
      });

      return Object.entries(forecastData)
        .slice(0, periods)
        .map(([period, data]) => ({
          period,
          month: period,
          predicted: data.predicted,
          confidence: data.opportunities > 0 ? data.totalProbability / data.opportunities : 0
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
          lead_source
        `)
        .eq('stage', 'closed_won');

      if (error) throw error;

      const sourceData: { [key: string]: { revenue: number; count: number } } = {};
      let totalRevenue = 0;

      data?.forEach(opportunity => {
        const source = opportunity.lead_source || 'unknown';
        const revenue = opportunity.estimated_value || 0;
        
        if (!sourceData[source]) {
          sourceData[source] = { revenue: 0, count: 0 };
        }
        
        sourceData[source].revenue += revenue;
        sourceData[source].count += 1;
        totalRevenue += revenue;
      });

      return Object.entries(sourceData).map(([source, data]) => ({
        source,
        revenue: data.revenue,
        count: data.count,
        percentage: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0
      }));
    } catch (error) {
      console.error('Error fetching revenue by source:', error);
      return [];
    }
  }

  static async getRevenueMetrics(dateRange: DateRange): Promise<RevenueMetrics> {
    try {
      const { data: currentData, error: currentError } = await supabase
        .from('crm_opportunities')
        .select('estimated_value')
        .eq('stage', 'closed_won')
        .gte('close_date', dateRange.from.toISOString())
        .lte('close_date', dateRange.to.toISOString());

      if (currentError) throw currentError;

      const currentRevenue = currentData?.reduce((sum, opp) => sum + (opp.estimated_value || 0), 0) || 0;

      // Get previous period data
      const periodDiff = dateRange.to.getTime() - dateRange.from.getTime();
      const previousFrom = new Date(dateRange.from.getTime() - periodDiff);
      const previousTo = new Date(dateRange.to.getTime() - periodDiff);

      const { data: previousData } = await supabase
        .from('crm_opportunities')
        .select('estimated_value')
        .eq('stage', 'closed_won')
        .gte('close_date', previousFrom.toISOString())
        .lte('close_date', previousTo.toISOString());

      const previousRevenue = previousData?.reduce((sum, opp) => sum + (opp.estimated_value || 0), 0) || 0;

      // Get pipeline value
      const { data: pipelineData } = await supabase
        .from('crm_opportunities')
        .select('estimated_value, probability')
        .eq('opportunity_status', 'open');

      const pipelineValue = pipelineData?.reduce((sum, opp) => sum + (opp.estimated_value || 0), 0) || 0;
      const forecastValue = pipelineData?.reduce((sum, opp) => sum + ((opp.estimated_value || 0) * (opp.probability || 0) / 100), 0) || 0;

      const averageDealSize = currentData?.length ? currentRevenue / currentData.length : 0;
      const growthRate = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;

      return {
        currentRevenue,
        previousRevenue,
        growthRate,
        pipelineValue,
        averageDealSize,
        forecastValue
      };
    } catch (error) {
      console.error('Error fetching revenue metrics:', error);
      return {
        currentRevenue: 0,
        previousRevenue: 0,
        growthRate: 0,
        pipelineValue: 0,
        averageDealSize: 0,
        forecastValue: 0
      };
    }
  }

  static async refreshAnalyticsCache(): Promise<void> {
    try {
      await supabase.rpc('refresh_crm_analytics');
    } catch (error) {
      console.error('Error refreshing analytics cache:', error);
    }
  }

  static async exportRevenueData(dateRange: DateRange): Promise<string> {
    try {
      const metrics = await this.getRevenueMetrics(dateRange);
      const monthlyData = await this.getMonthlyRevenueComparison(12);
      const sourceData = await this.getRevenueBySource();

      const csvContent = [
        // Headers
        ['Metric', 'Value'].join(','),
        ['Current Revenue', metrics.currentRevenue].join(','),
        ['Previous Revenue', metrics.previousRevenue].join(','),
        ['Growth Rate (%)', metrics.growthRate].join(','),
        ['Pipeline Value', metrics.pipelineValue].join(','),
        ['Average Deal Size', metrics.averageDealSize].join(','),
        ['Forecast Value', metrics.forecastValue].join(','),
        '',
        ['Month', 'Revenue', 'Deals', 'Growth (%)'].join(','),
        ...monthlyData.map(item => [item.month, item.revenue, item.deals, item.growth].join(',')),
        '',
        ['Source', 'Revenue', 'Count', 'Percentage'].join(','),
        ...sourceData.map(item => [item.source, item.revenue, item.count, item.percentage.toFixed(2)].join(','))
      ].join('\n');

      return csvContent;
    } catch (error) {
      console.error('Error exporting revenue data:', error);
      throw error;
    }
  }
}
