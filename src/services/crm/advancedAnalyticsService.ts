
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

export interface AnalyticsMetrics {
  totalLeads: number;
  totalOpportunities: number;
  conversionRate: number;
  averageDealSize: number;
}

export interface TimeSeriesData {
  date: string;
  leads: number;
  opportunities: number;
  revenue: number;
}

export interface ConversionFunnel {
  stage: string;
  count: number;
  conversionRate: number;
}

export interface UserPerformance {
  userId: string;
  userName: string;
  leadsGenerated: number;
  dealsWon: number;
  revenue: number;
}

export interface PredictiveInsights {
  revenue_forecast: number;
  recommended_actions: string[];
  churn_risk_leads: string[];
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

  static async getAnalyticsMetrics(timeRange: string): Promise<AnalyticsMetrics> {
    try {
      const [leads, opportunities] = await Promise.all([
        supabase.from('crm_leads').select('id', { count: 'exact' }),
        supabase.from('crm_opportunities').select('id, estimated_value', { count: 'exact' })
      ]);

      const totalLeads = leads.count || 0;
      const totalOpportunities = opportunities.count || 0;
      const conversionRate = totalLeads > 0 ? (totalOpportunities / totalLeads) * 100 : 0;
      
      const totalRevenue = opportunities.data?.reduce((sum, opp) => sum + (opp.estimated_value || 0), 0) || 0;
      const averageDealSize = totalOpportunities > 0 ? totalRevenue / totalOpportunities : 0;

      return {
        totalLeads,
        totalOpportunities,
        conversionRate,
        averageDealSize
      };
    } catch (error) {
      console.error('Error fetching analytics metrics:', error);
      return {
        totalLeads: 0,
        totalOpportunities: 0,
        conversionRate: 0,
        averageDealSize: 0
      };
    }
  }

  static async getTimeSeriesData(days: number = 30): Promise<TimeSeriesData[]> {
    try {
      // Mock time series data for now
      const data: TimeSeriesData[] = [];
      const now = new Date();
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        data.push({
          date: date.toISOString().split('T')[0],
          leads: Math.floor(Math.random() * 10) + 5,
          opportunities: Math.floor(Math.random() * 5) + 2,
          revenue: Math.floor(Math.random() * 5000) + 1000
        });
      }

      return data;
    } catch (error) {
      console.error('Error fetching time series data:', error);
      return [];
    }
  }

  static async getConversionFunnel(): Promise<ConversionFunnel[]> {
    try {
      // Mock conversion funnel data
      return [
        { stage: 'Leads', count: 100, conversionRate: 100 },
        { stage: 'Qualified', count: 75, conversionRate: 75 },
        { stage: 'Proposal', count: 45, conversionRate: 45 },
        { stage: 'Negotiation', count: 25, conversionRate: 25 },
        { stage: 'Closed Won', count: 15, conversionRate: 15 }
      ];
    } catch (error) {
      console.error('Error fetching conversion funnel:', error);
      return [];
    }
  }

  static async getUserPerformance(): Promise<UserPerformance[]> {
    try {
      // Mock user performance data
      return [
        { userId: '1', userName: 'John Doe', leadsGenerated: 25, dealsWon: 8, revenue: 45000 },
        { userId: '2', userName: 'Jane Smith', leadsGenerated: 30, dealsWon: 12, revenue: 65000 },
        { userId: '3', userName: 'Bob Johnson', leadsGenerated: 18, dealsWon: 6, revenue: 35000 }
      ];
    } catch (error) {
      console.error('Error fetching user performance:', error);
      return [];
    }
  }

  static async getPredictiveInsights(): Promise<PredictiveInsights> {
    try {
      // Mock predictive insights
      return {
        revenue_forecast: 125000,
        recommended_actions: [
          'Focus on high-value prospects',
          'Improve follow-up cadence',
          'Optimize proposal process'
        ],
        churn_risk_leads: [
          'Lead 1 - No recent activity',
          'Lead 2 - Low engagement score',
          'Lead 3 - Delayed responses'
        ]
      };
    } catch (error) {
      console.error('Error fetching predictive insights:', error);
      return {
        revenue_forecast: 0,
        recommended_actions: [],
        churn_risk_leads: []
      };
    }
  }
}
