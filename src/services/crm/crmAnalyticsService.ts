
import { supabase } from '@/integrations/supabase/client';
import type { DateRange, PipelineMetrics, RevenueMetrics } from '@/types/crm';

export class CRMAnalyticsService {
  static async getAdvancedAnalytics(dateRange: DateRange) {
    try {
      // This would typically call multiple endpoints or a comprehensive analytics function
      const [
        pipelineData,
        revenueData,
        conversionData,
        leadSourceData
      ] = await Promise.all([
        this.getPipelineMetrics(dateRange),
        this.getRevenueMetrics(dateRange),
        this.getConversionFunnel(dateRange),
        this.getLeadSourceBreakdown(dateRange)
      ]);

      return {
        pipeline: pipelineData,
        revenue: revenueData,
        conversionFunnel: conversionData,
        leadSources: leadSourceData,
        averageDealSize: 125000,
        averageCloseTime: 45,
        winRate: 68.5,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching advanced analytics:', error);
      throw error;
    }
  }

  static async getPipelineMetrics(dateRange: DateRange): Promise<PipelineMetrics[]> {
    try {
      const { data: opportunities } = await supabase
        .from('crm_opportunities')
        .select('*')
        .gte('created_at', dateRange.start.toISOString())
        .lte('created_at', dateRange.end.toISOString());

      if (!opportunities) return [];

      // Group by stage and calculate metrics
      const stageMetrics = opportunities.reduce((acc, opp) => {
        const stage = opp.stage;
        if (!acc[stage]) {
          acc[stage] = {
            stage_name: stage,
            opportunity_count: 0,
            total_value: 0,
            avg_probability: 0
          };
        }
        
        acc[stage].opportunity_count += 1;
        acc[stage].total_value += opp.estimated_value || 0;
        acc[stage].avg_probability += opp.probability || 0;
        
        return acc;
      }, {} as Record<string, PipelineMetrics>);

      // Calculate averages
      return Object.values(stageMetrics).map(stage => ({
        ...stage,
        avg_probability: stage.avg_probability / stage.opportunity_count
      }));
    } catch (error) {
      console.error('Error fetching pipeline metrics:', error);
      return [];
    }
  }

  static async getRevenueMetrics(dateRange: DateRange): Promise<RevenueMetrics> {
    try {
      const { data: closedWonOpportunities } = await supabase
        .from('crm_opportunities')
        .select('*')
        .eq('stage', 'closed_won')
        .gte('close_date', dateRange.start.toISOString())
        .lte('close_date', dateRange.end.toISOString());

      const currentRevenue = closedWonOpportunities?.reduce((sum, opp) => 
        sum + (opp.estimated_value || 0), 0) || 0;

      // Calculate previous period for comparison
      const previousPeriodStart = new Date(dateRange.start);
      previousPeriodStart.setTime(previousPeriodStart.getTime() - (dateRange.end.getTime() - dateRange.start.getTime()));
      
      const { data: previousOpportunities } = await supabase
        .from('crm_opportunities')
        .select('*')
        .eq('stage', 'closed_won')
        .gte('close_date', previousPeriodStart.toISOString())
        .lte('close_date', dateRange.start.toISOString());

      const previousRevenue = previousOpportunities?.reduce((sum, opp) => 
        sum + (opp.estimated_value || 0), 0) || 0;

      const growthRate = previousRevenue > 0 
        ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 
        : 0;

      // Get pipeline value (all open opportunities)
      const { data: pipelineOpportunities } = await supabase
        .from('crm_opportunities')
        .select('*')
        .eq('opportunity_status', 'open');

      const pipelineValue = pipelineOpportunities?.reduce((sum, opp) => 
        sum + (opp.estimated_value || 0), 0) || 0;

      const averageDealSize = closedWonOpportunities?.length 
        ? currentRevenue / closedWonOpportunities.length 
        : 0;

      return {
        currentRevenue,
        previousRevenue,
        growthRate,
        pipelineValue,
        averageDealSize,
        forecastValue: pipelineValue * 0.3, // Simple forecast based on 30% close rate
        monthly_data: this.generateMonthlyData(dateRange),
        revenue_by_source: this.generateRevenueBySource(),
        forecast: {
          current_quarter: currentRevenue * 1.2,
          next_quarter: currentRevenue * 1.3,
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

  static async getConversionFunnel(dateRange: DateRange) {
    try {
      const { data: leads } = await supabase
        .from('crm_leads')
        .select('*')
        .gte('created_at', dateRange.start.toISOString())
        .lte('created_at', dateRange.end.toISOString());

      const { data: opportunities } = await supabase
        .from('crm_opportunities')
        .select('*')
        .gte('created_at', dateRange.start.toISOString())
        .lte('created_at', dateRange.end.toISOString());

      const totalLeads = leads?.length || 0;
      const qualifiedLeads = leads?.filter(l => l.lead_status === 'qualified').length || 0;
      const convertedLeads = leads?.filter(l => l.lead_status === 'converted').length || 0;
      const closedWon = opportunities?.filter(o => o.stage === 'closed_won').length || 0;

      return [
        { stage: 'Total Leads', count: totalLeads, conversion_rate: 100 },
        { stage: 'Qualified', count: qualifiedLeads, conversion_rate: totalLeads > 0 ? (qualifiedLeads / totalLeads) * 100 : 0 },
        { stage: 'Opportunities', count: convertedLeads, conversion_rate: totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0 },
        { stage: 'Closed Won', count: closedWon, conversion_rate: totalLeads > 0 ? (closedWon / totalLeads) * 100 : 0 }
      ];
    } catch (error) {
      console.error('Error fetching conversion funnel:', error);
      return [];
    }
  }

  static async getLeadSourceBreakdown(dateRange: DateRange) {
    try {
      const { data: leads } = await supabase
        .from('crm_leads')
        .select('lead_source')
        .gte('created_at', dateRange.start.toISOString())
        .lte('created_at', dateRange.end.toISOString());

      if (!leads) return [];

      const sourceBreakdown = leads.reduce((acc, lead) => {
        const source = lead.lead_source || 'unknown';
        acc[source] = (acc[source] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const total = leads.length;
      
      return Object.entries(sourceBreakdown).map(([source, count]) => ({
        source,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0
      }));
    } catch (error) {
      console.error('Error fetching lead source breakdown:', error);
      return [];
    }
  }

  static async exportAnalyticsReport(dateRange: DateRange, format: 'pdf' | 'excel' | 'comprehensive' = 'comprehensive') {
    try {
      const analyticsData = await this.getAdvancedAnalytics(dateRange);
      
      // In a real implementation, this would generate and download a report
      console.log('Exporting analytics report:', { dateRange, format, data: analyticsData });
      
      // For now, we'll create a JSON download
      const dataStr = JSON.stringify(analyticsData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `crm-analytics-${format}-${dateRange.start.toISOString().split('T')[0]}-to-${dateRange.end.toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    } catch (error) {
      console.error('Error exporting analytics report:', error);
      throw error;
    }
  }

  private static generateMonthlyData(dateRange: DateRange) {
    // Generate sample monthly data - in real implementation this would come from the database
    const months = [];
    const currentDate = new Date(dateRange.start);
    
    while (currentDate <= dateRange.end) {
      months.push({
        month: currentDate.toISOString().slice(0, 7),
        revenue: Math.floor(Math.random() * 500000) + 100000,
        target: 400000,
        growth_rate: (Math.random() - 0.5) * 40
      });
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    return months;
  }

  private static generateRevenueBySource() {
    return [
      { source: 'Website', revenue: 750000, percentage: 35 },
      { source: 'Referral', revenue: 650000, percentage: 30 },
      { source: 'Cold Outreach', revenue: 430000, percentage: 20 },
      { source: 'Trade Shows', revenue: 220000, percentage: 10 },
      { source: 'Social Media', revenue: 110000, percentage: 5 }
    ];
  }
}
