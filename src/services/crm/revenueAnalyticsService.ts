
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
  }>;
  conversionRates: Record<string, number>;
  averageDealSize: number;
  salesVelocity: number;
}

export class RevenueAnalyticsService {
  static async getPipelineAnalytics(): Promise<PipelineAnalytics> {
    try {
      const { data: opportunities, error } = await supabase
        .from('crm_opportunities')
        .select('stage, estimated_value, probability')
        .eq('opportunity_status', 'open');

      if (error) throw error;

      // Group by stage
      const stageGroups = (opportunities || []).reduce((acc, opp) => {
        const stage = opp.stage || 'unknown';
        if (!acc[stage]) {
          acc[stage] = { count: 0, totalValue: 0 };
        }
        acc[stage].count++;
        acc[stage].totalValue += opp.estimated_value || 0;
        return acc;
      }, {} as Record<string, { count: number; totalValue: number }>);

      const stageDistribution = Object.entries(stageGroups).map(([stage, data]) => ({
        stage,
        value: data.totalValue,
        count: data.count,
        stage_name: stage,
        total_value: data.totalValue,
        opportunity_count: data.count
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
}
