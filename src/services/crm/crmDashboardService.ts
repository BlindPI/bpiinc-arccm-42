import { supabase } from '@/integrations/supabase/client';
import { 
  CRMServiceResponse, 
  CRMDashboardMetrics,
  TopPerformingAP,
  SalesPerformanceMetrics,
  LeadSourceMetrics,
  PipelineMetrics,
  RevenueMetrics
} from '@/types/crm';
import { crmLeadService } from './crmLeadService';
import { crmOpportunityService } from './crmOpportunityService';
import { crmRevenueService } from './crmRevenueService';
import { crmEmailCampaignService } from './crmEmailCampaignService';

export class CRMDashboardService {
  /**
   * Get comprehensive dashboard metrics
   */
  async getDashboardMetrics(): Promise<CRMServiceResponse<CRMDashboardMetrics>> {
    try {
      const currentDate = new Date();
      const currentMonth = currentDate.toISOString().substring(0, 7); // YYYY-MM
      const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1).toISOString().substring(0, 7);
      const startOfMonth = `${currentMonth}-01`;
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString().split('T')[0];

      // Get current month revenue
      const currentRevenueResult = await crmRevenueService.getRevenueMetrics(startOfMonth, endOfMonth);
      const currentRevenue = currentRevenueResult.success ? currentRevenueResult.data?.total_revenue || 0 : 0;

      // Get last month revenue for comparison
      const lastMonthStart = `${lastMonth}-01`;
      const lastMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0).toISOString().split('T')[0];
      const lastRevenueResult = await crmRevenueService.getRevenueMetrics(lastMonthStart, lastMonthEnd);
      const lastRevenue = lastRevenueResult.success ? lastRevenueResult.data?.total_revenue || 0 : 0;

      // Calculate revenue change percentage
      const monthly_revenue_change = lastRevenue > 0 ? ((currentRevenue - lastRevenue) / lastRevenue) * 100 : 0;

      // Get active opportunities
      const { data: activeOpps, error: oppError } = await supabase
        .from('crm_opportunities')
        .select('id, estimated_value')
        .eq('status', 'open');

      const active_opportunities = activeOpps?.length || 0;
      const pipeline_value = activeOpps?.reduce((sum, opp) => sum + opp.estimated_value, 0) || 0;

      // Get conversion metrics
      const conversionResult = await crmOpportunityService.getConversionRates();
      const conversionRates = conversionResult.success ? conversionResult.data || [] : [];
      const conversion_rate = conversionRates.length > 0 ? 
        conversionRates.reduce((sum, rate) => sum + rate.conversion_rate, 0) / conversionRates.length : 0;

      // Calculate average deal size
      const avg_deal_size = active_opportunities > 0 ? pipeline_value / active_opportunities : 0;

      // Get leads this month
      const { data: monthlyLeads, error: leadsError } = await supabase
        .from('crm_leads')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startOfMonth);

      const leads_this_month = monthlyLeads || 0;

      // Get tasks due today
      const today = new Date().toISOString().split('T')[0];
      const { data: todayTasks, error: tasksError } = await supabase
        .from('crm_tasks')
        .select('id', { count: 'exact', head: true })
        .eq('due_date', today)
        .eq('status', 'pending');

      const tasks_due_today = todayTasks || 0;

      // Get overdue follow-ups
      const { data: overdueFollowUps, error: followUpError } = await supabase
        .from('crm_leads')
        .select('id', { count: 'exact', head: true })
        .lt('next_follow_up_date', today)
        .not('next_follow_up_date', 'is', null);

      const follow_ups_overdue = overdueFollowUps || 0;

      const dashboardMetrics: CRMDashboardMetrics = {
        monthly_revenue: currentRevenue,
        monthly_revenue_change,
        active_opportunities,
        active_opportunities_change: 0, // Would need historical data to calculate
        conversion_rate,
        conversion_rate_change: 0, // Would need historical data to calculate
        avg_deal_size,
        avg_deal_size_change: 0, // Would need historical data to calculate
        pipeline_value,
        leads_this_month,
        tasks_due_today,
        follow_ups_overdue
      };

      return { success: true, data: dashboardMetrics };
    } catch (error) {
      console.error('Error in getDashboardMetrics:', error);
      return { success: false, error: 'Failed to get dashboard metrics' };
    }
  }

  /**
   * Get sales performance metrics for all sales reps
   */
  async getSalesPerformanceMetrics(
    startDate: string,
    endDate: string
  ): Promise<CRMServiceResponse<SalesPerformanceMetrics[]>> {
    try {
      // Get all sales reps (users with AD or SA roles)
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('role', ['AD', 'SA']);

      if (usersError) {
        console.error('Error fetching users:', usersError);
        return { success: false, error: usersError.message };
      }

      const salesReps = users || [];
      const performanceMetrics: SalesPerformanceMetrics[] = [];

      for (const rep of salesReps) {
        // Get leads assigned
        const { data: leads, error: leadsError } = await supabase
          .from('crm_leads')
          .select('id', { count: 'exact', head: true })
          .eq('assigned_to', rep.id)
          .gte('created_at', startDate)
          .lte('created_at', endDate);

        // Get opportunities created
        const { data: opportunities, error: oppsError } = await supabase
          .from('crm_opportunities')
          .select('id, estimated_value, status')
          .eq('assigned_to', rep.id)
          .gte('created_at', startDate)
          .lte('created_at', endDate);

        const opportunitiesData = opportunities || [];
        const opportunities_created = opportunitiesData.length;
        const opportunities_won = opportunitiesData.filter(opp => opp.status === 'closed_won').length;

        // Get revenue
        const revenueResult = await crmRevenueService.getRevenueMetrics(startDate, endDate, rep.id);
        const total_revenue = revenueResult.success ? revenueResult.data?.total_revenue || 0 : 0;

        const avg_deal_size = opportunities_won > 0 ? total_revenue / opportunities_won : 0;
        const conversion_rate = opportunities_created > 0 ? (opportunities_won / opportunities_created) * 100 : 0;

        performanceMetrics.push({
          sales_rep_id: rep.id,
          sales_rep_name: `${rep.first_name} ${rep.last_name}`,
          leads_assigned: leads || 0,
          opportunities_created,
          opportunities_won,
          total_revenue,
          avg_deal_size,
          conversion_rate
        });
      }

      return { success: true, data: performanceMetrics };
    } catch (error) {
      console.error('Error in getSalesPerformanceMetrics:', error);
      return { success: false, error: 'Failed to get sales performance metrics' };
    }
  }

  /**
   * Get lead source performance metrics
   */
  async getLeadSourceMetrics(
    startDate: string,
    endDate: string
  ): Promise<CRMServiceResponse<LeadSourceMetrics[]>> {
    try {
      const { data: leads, error } = await supabase
        .from('crm_leads')
        .select('lead_source, lead_score, converted_to_opportunity_id')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (error) {
        console.error('Error fetching lead source data:', error);
        return { success: false, error: error.message };
      }

      const leadsData = leads || [];
      
      // Group by lead source
      const sourceGroups = leadsData.reduce((acc, lead) => {
        if (!acc[lead.lead_source]) {
          acc[lead.lead_source] = {
            leads: [],
            conversions: 0
          };
        }
        acc[lead.lead_source].leads.push(lead);
        if (lead.converted_to_opportunity_id) {
          acc[lead.lead_source].conversions++;
        }
        return acc;
      }, {} as Record<string, { leads: any[]; conversions: number }>);

      // Calculate metrics for each source
      const sourceMetrics: LeadSourceMetrics[] = [];
      
      for (const [source, data] of Object.entries(sourceGroups) as [string, { leads: any[]; conversions: number }][]) {
        const lead_count = data.leads.length;
        const conversion_rate = lead_count > 0 ? (data.conversions / lead_count) * 100 : 0;
        const avg_lead_score = lead_count > 0 ? 
          data.leads.reduce((sum, lead) => sum + lead.lead_score, 0) / lead_count : 0;

        // Get revenue attributed to this source
        const convertedOpportunityIds = data.leads
          .filter(lead => lead.converted_to_opportunity_id)
          .map(lead => lead.converted_to_opportunity_id);

        let total_revenue_attributed = 0;
        if (convertedOpportunityIds.length > 0) {
          const { data: revenueData } = await supabase
            .from('crm_revenue_records')
            .select('amount')
            .in('opportunity_id', convertedOpportunityIds);

          total_revenue_attributed = (revenueData || []).reduce((sum, record) => sum + record.amount, 0);
        }

        sourceMetrics.push({
          source,
          lead_count,
          conversion_rate,
          avg_lead_score,
          total_revenue_attributed
        });
      }

      // Sort by revenue attributed
      sourceMetrics.sort((a, b) => b.total_revenue_attributed - a.total_revenue_attributed);

      return { success: true, data: sourceMetrics };
    } catch (error) {
      console.error('Error in getLeadSourceMetrics:', error);
      return { success: false, error: 'Failed to get lead source metrics' };
    }
  }

  /**
   * Get top performing AP locations
   */
  async getTopPerformingAPs(
    startDate: string,
    endDate: string,
    limit: number = 10
  ): Promise<CRMServiceResponse<TopPerformingAP[]>> {
    try {
      // Get AP performance data from revenue records
      const apRevenueResult = await crmRevenueService.getRevenueByAP(startDate, endDate);
      
      if (!apRevenueResult.success || !apRevenueResult.data) {
        return { success: false, error: 'Failed to get AP revenue data' };
      }

      const apRevenueData = apRevenueResult.data;

      // Get referral data (opportunities with preferred_ap_id)
      const { data: referrals, error: referralsError } = await supabase
        .from('crm_opportunities')
        .select('preferred_ap_id')
        .not('preferred_ap_id', 'is', null)
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      const referralCounts = (referrals || []).reduce((acc, opp) => {
        const apId = opp.preferred_ap_id!;
        acc[apId] = (acc[apId] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);

      // Combine data and create performance metrics
      const topPerformingAPs: TopPerformingAP[] = apRevenueData.map(apData => {
        const referrals_received = referralCounts[apData.ap_location_id] || 0;
        const conversion_rate = referrals_received > 0 ? 
          (apData.transaction_count / referrals_received) * 100 : 0;

        return {
          ap_id: apData.ap_location_id,
          ap_name: `AP Location ${apData.ap_location_id}`, // Would need to join with AP table for real name
          location: 'Location TBD', // Would need to join with AP table for location
          referrals_received,
          certificates_issued: apData.certificate_count,
          revenue_generated: apData.total_revenue,
          conversion_rate
        };
      }).slice(0, limit);

      return { success: true, data: topPerformingAPs };
    } catch (error) {
      console.error('Error in getTopPerformingAPs:', error);
      return { success: false, error: 'Failed to get top performing APs' };
    }
  }

  /**
   * Get pipeline health metrics
   */
  async getPipelineHealth(): Promise<CRMServiceResponse<{
    total_pipeline_value: number;
    weighted_pipeline_value: number;
    opportunities_by_stage: PipelineMetrics[];
    stalled_opportunities: number;
    closing_this_month: number;
    average_deal_age: number;
  }>> {
    try {
      // Get pipeline value
      const pipelineResult = await crmOpportunityService.calculatePipelineValue();
      const pipelineValue = pipelineResult.success ? pipelineResult.data : {
        total_pipeline_value: 0,
        weighted_pipeline_value: 0,
        opportunities_count: 0,
        avg_deal_size: 0
      };

      // Get pipeline metrics by stage
      const stageMetricsResult = await crmOpportunityService.getPipelineMetrics();
      const opportunities_by_stage = stageMetricsResult.success ? stageMetricsResult.data || [] : [];

      // Get stalled opportunities (no activity in 14+ days)
      const stalledDate = new Date();
      stalledDate.setDate(stalledDate.getDate() - 14);

      const { data: stalledOpps, error: stalledError } = await supabase
        .from('crm_opportunities')
        .select('id')
        .eq('status', 'open')
        .lt('updated_at', stalledDate.toISOString());

      const stalled_opportunities = stalledOpps?.length || 0;

      // Get opportunities closing this month
      const currentMonth = new Date().toISOString().substring(0, 7);
      const { data: closingOpps, error: closingError } = await supabase
        .from('crm_opportunities')
        .select('id')
        .eq('status', 'open')
        .gte('expected_close_date', `${currentMonth}-01`)
        .lt('expected_close_date', `${currentMonth}-32`);

      const closing_this_month = closingOpps?.length || 0;

      // Calculate average deal age
      const { data: allOpps, error: ageError } = await supabase
        .from('crm_opportunities')
        .select('created_at')
        .eq('status', 'open');

      let average_deal_age = 0;
      if (allOpps && allOpps.length > 0) {
        const currentTime = new Date().getTime();
        const totalAge = allOpps.reduce((sum, opp) => {
          const createdTime = new Date(opp.created_at).getTime();
          return sum + (currentTime - createdTime);
        }, 0);
        average_deal_age = Math.floor(totalAge / (allOpps.length * 24 * 60 * 60 * 1000)); // Convert to days
      }

      return {
        success: true,
        data: {
          total_pipeline_value: pipelineValue.total_pipeline_value,
          weighted_pipeline_value: pipelineValue.weighted_pipeline_value,
          opportunities_by_stage,
          stalled_opportunities,
          closing_this_month,
          average_deal_age
        }
      };
    } catch (error) {
      console.error('Error in getPipelineHealth:', error);
      return { success: false, error: 'Failed to get pipeline health metrics' };
    }
  }

  /**
   * Get activity summary for dashboard
   */
  async getActivitySummary(days: number = 30): Promise<CRMServiceResponse<{
    total_activities: number;
    calls_made: number;
    emails_sent: number;
    meetings_held: number;
    follow_ups_completed: number;
    avg_activities_per_day: number;
  }>> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data: activities, error } = await supabase
        .from('crm_activities')
        .select('activity_type')
        .gte('activity_date', startDate.toISOString());

      if (error) {
        console.error('Error fetching activity summary:', error);
        return { success: false, error: error.message };
      }

      const activitiesData = activities || [];
      const total_activities = activitiesData.length;
      const calls_made = activitiesData.filter(a => a.activity_type === 'call').length;
      const emails_sent = activitiesData.filter(a => a.activity_type === 'email').length;
      const meetings_held = activitiesData.filter(a => a.activity_type === 'meeting').length;
      const follow_ups_completed = activitiesData.filter(a => a.activity_type === 'follow_up').length;
      const avg_activities_per_day = total_activities / days;

      return {
        success: true,
        data: {
          total_activities,
          calls_made,
          emails_sent,
          meetings_held,
          follow_ups_completed,
          avg_activities_per_day
        }
      };
    } catch (error) {
      console.error('Error in getActivitySummary:', error);
      return { success: false, error: 'Failed to get activity summary' };
    }
  }

  /**
   * Get comprehensive dashboard data in one call
   */
  async getCompleteDashboardData(): Promise<CRMServiceResponse<{
    metrics: CRMDashboardMetrics;
    pipeline_health: any;
    activity_summary: any;
    recent_leads: any[];
    upcoming_tasks: any[];
    revenue_trend: any[];
  }>> {
    try {
      const [
        metricsResult,
        pipelineResult,
        activityResult,
        recentLeadsResult,
        upcomingTasksResult,
        revenueTrendResult
      ] = await Promise.all([
        this.getDashboardMetrics(),
        this.getPipelineHealth(),
        this.getActivitySummary(),
        this.getRecentLeads(),
        this.getUpcomingTasks(),
        this.getRevenueTrend()
      ]);

      return {
        success: true,
        data: {
          metrics: metricsResult.success ? metricsResult.data! : {} as CRMDashboardMetrics,
          pipeline_health: pipelineResult.success ? pipelineResult.data : {},
          activity_summary: activityResult.success ? activityResult.data : {},
          recent_leads: recentLeadsResult.success ? recentLeadsResult.data || [] : [],
          upcoming_tasks: upcomingTasksResult.success ? upcomingTasksResult.data || [] : [],
          revenue_trend: revenueTrendResult.success ? revenueTrendResult.data || [] : []
        }
      };
    } catch (error) {
      console.error('Error in getCompleteDashboardData:', error);
      return { success: false, error: 'Failed to get complete dashboard data' };
    }
  }

  // Private helper methods

  private async getRecentLeads(limit: number = 10): Promise<CRMServiceResponse<any[]>> {
    try {
      const { data, error } = await supabase
        .from('crm_leads')
        .select('id, first_name, last_name, company_name, email, lead_score, created_at')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      return { success: false, error: 'Failed to get recent leads' };
    }
  }

  private async getUpcomingTasks(limit: number = 10): Promise<CRMServiceResponse<any[]>> {
    try {
      const { data, error } = await supabase
        .from('crm_tasks')
        .select('id, task_title, due_date, priority, assigned_to')
        .eq('status', 'pending')
        .gte('due_date', new Date().toISOString().split('T')[0])
        .order('due_date', { ascending: true })
        .limit(limit);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      return { success: false, error: 'Failed to get upcoming tasks' };
    }
  }

  private async getRevenueTrend(months: number = 6): Promise<CRMServiceResponse<any[]>> {
    try {
      const trendResult = await crmRevenueService.getMonthlyRevenueTrend(months);
      return trendResult;
    } catch (error) {
      return { success: false, error: 'Failed to get revenue trend' };
    }
  }
}

export const crmDashboardService = new CRMDashboardService();