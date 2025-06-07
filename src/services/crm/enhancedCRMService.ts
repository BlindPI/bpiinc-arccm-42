
import { supabase } from '@/integrations/supabase/client';
import type { RevenueMetrics, PipelineMetrics, DateRange } from '@/types/crm';

export class EnhancedCRMService {
  static async getRevenueMetrics(dateRange: DateRange): Promise<RevenueMetrics> {
    try {
      // Get current period revenue
      const { data: currentRevenue } = await supabase
        .from('crm_opportunities')
        .select('estimated_value')
        .eq('stage', 'closed_won')
        .gte('close_date', dateRange.start.toISOString())
        .lte('close_date', dateRange.end.toISOString());

      // Get previous period for comparison
      const previousStart = new Date(dateRange.start);
      previousStart.setDate(previousStart.getDate() - (dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
      
      const { data: previousRevenue } = await supabase
        .from('crm_opportunities')
        .select('estimated_value')
        .eq('stage', 'closed_won')
        .gte('close_date', previousStart.toISOString())
        .lt('close_date', dateRange.start.toISOString());

      // Get pipeline value
      const { data: pipelineData } = await supabase
        .from('crm_opportunities')
        .select('estimated_value, probability')
        .eq('opportunity_status', 'open');

      const currentRevenueValue = currentRevenue?.reduce((sum, opp) => sum + (opp.estimated_value || 0), 0) || 0;
      const previousRevenueValue = previousRevenue?.reduce((sum, opp) => sum + (opp.estimated_value || 0), 0) || 0;
      const pipelineValue = pipelineData?.reduce((sum, opp) => sum + (opp.estimated_value || 0), 0) || 0;
      const averageDealSize = currentRevenue?.length ? currentRevenueValue / currentRevenue.length : 0;
      const growthRate = previousRevenueValue ? ((currentRevenueValue - previousRevenueValue) / previousRevenueValue) * 100 : 0;

      return {
        currentRevenue: currentRevenueValue,
        previousRevenue: previousRevenueValue,
        growthRate,
        pipelineValue,
        averageDealSize,
        forecastValue: pipelineData?.reduce((sum, opp) => sum + ((opp.estimated_value || 0) * (opp.probability || 0) / 100), 0) || 0,
        monthly_data: [],
        revenue_by_source: [],
        forecast: {
          current_quarter: currentRevenueValue,
          next_quarter: 0,
          confidence_level: 75
        }
      };
    } catch (error) {
      console.error('Error fetching revenue metrics:', error);
      return {
        currentRevenue: 0,
        previousRevenue: 0,
        growthRate: 0,
        pipelineValue: 0,
        averageDealSize: 0,
        forecastValue: 0,
        monthly_data: [],
        revenue_by_source: [],
        forecast: {
          current_quarter: 0,
          next_quarter: 0,
          confidence_level: 0
        }
      };
    }
  }

  static async getPipelineMetrics(): Promise<PipelineMetrics> {
    try {
      const { data: stageData, error } = await supabase.rpc('get_pipeline_metrics');
      
      if (error) throw error;

      return {
        stage_name: '',
        opportunity_count: 0,
        total_value: 0,
        avg_probability: 0,
        stageDistribution: stageData || [],
        totalPipelineValue: stageData?.reduce((sum: number, stage: any) => sum + stage.total_value, 0) || 0,
        weightedPipelineValue: stageData?.reduce((sum: number, stage: any) => sum + (stage.total_value * stage.avg_probability / 100), 0) || 0,
        averageCloseTime: 30,
        conversionRate: 25
      };
    } catch (error) {
      console.error('Error fetching pipeline metrics:', error);
      return {
        stage_name: '',
        opportunity_count: 0,
        total_value: 0,
        avg_probability: 0,
        stageDistribution: [],
        totalPipelineValue: 0,
        weightedPipelineValue: 0,
        averageCloseTime: 0,
        conversionRate: 0
      };
    }
  }
}
