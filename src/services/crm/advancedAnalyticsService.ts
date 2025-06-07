
import { supabase } from '@/integrations/supabase/client';

export interface ExecutiveKPIs {
  activeAccounts: number;
  accountGrowth: number;
  recentActivities: any[];
}

export interface PipelineHealth {
  totalPipelineValue: number;
  pipelineGrowth: number;
  stageDistribution: Array<{
    name: string;
    value: number;
    count: number;
  }>;
}

export interface ConversionMetrics {
  overallConversionRate: number;
  conversionRateChange: number;
}

export class AdvancedAnalyticsService {
  static async getExecutiveKPIs(timeRange: string): Promise<ExecutiveKPIs> {
    try {
      // Get active accounts count
      const { data: accounts, error: accountsError } = await supabase
        .from('crm_accounts')
        .select('id, created_at')
        .eq('account_status', 'active');

      if (accountsError) throw accountsError;

      // Calculate growth (simplified)
      const currentCount = accounts?.length || 0;
      const growthRate = 12.5; // Mock growth rate for now

      // Get recent activities
      const { data: activities, error: activitiesError } = await supabase
        .from('crm_activities')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (activitiesError) throw activitiesError;

      return {
        activeAccounts: currentCount,
        accountGrowth: growthRate,
        recentActivities: activities?.map(activity => ({
          description: activity.subject,
          timestamp: activity.activity_date,
          type: activity.activity_type
        })) || []
      };
    } catch (error) {
      console.error('Error fetching executive KPIs:', error);
      return {
        activeAccounts: 0,
        accountGrowth: 0,
        recentActivities: []
      };
    }
  }

  static async getPipelineHealth(): Promise<PipelineHealth> {
    try {
      const { data: opportunities, error } = await supabase
        .from('crm_opportunities')
        .select('opportunity_stage, estimated_value')
        .eq('opportunity_status', 'open');

      if (error) throw error;

      const totalValue = opportunities?.reduce((sum, opp) => sum + (opp.estimated_value || 0), 0) || 0;
      
      // Group by stage
      const stageGroups = opportunities?.reduce((acc, opp) => {
        const stage = opp.opportunity_stage || 'Unknown';
        if (!acc[stage]) {
          acc[stage] = { count: 0, value: 0 };
        }
        acc[stage].count += 1;
        acc[stage].value += opp.estimated_value || 0;
        return acc;
      }, {} as Record<string, { count: number; value: number }>) || {};

      const stageDistribution = Object.entries(stageGroups).map(([name, data]) => ({
        name,
        value: data.value,
        count: data.count
      }));

      return {
        totalPipelineValue: totalValue,
        pipelineGrowth: 8.3, // Mock growth rate
        stageDistribution
      };
    } catch (error) {
      console.error('Error fetching pipeline health:', error);
      return {
        totalPipelineValue: 0,
        pipelineGrowth: 0,
        stageDistribution: []
      };
    }
  }

  static async getConversionMetrics(timeRange: string): Promise<ConversionMetrics> {
    try {
      // Get total leads
      const { data: leads, error: leadsError } = await supabase
        .from('crm_leads')
        .select('id, lead_status, created_at');

      if (leadsError) throw leadsError;

      // Get converted leads (those with opportunities)
      const { data: opportunities, error: oppsError } = await supabase
        .from('crm_opportunities')
        .select('lead_id')
        .not('lead_id', 'is', null);

      if (oppsError) throw oppsError;

      const totalLeads = leads?.length || 0;
      const convertedLeads = opportunities?.length || 0;
      const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

      return {
        overallConversionRate: conversionRate,
        conversionRateChange: 2.1 // Mock change rate
      };
    } catch (error) {
      console.error('Error fetching conversion metrics:', error);
      return {
        overallConversionRate: 0,
        conversionRateChange: 0
      };
    }
  }
}
