import { supabase } from '@/integrations/supabase/client';

export interface AnalyticsMetrics {
  // Lead Analytics
  total_leads: number;
  new_leads_this_month: number;
  lead_conversion_rate: number;
  average_lead_score: number;
  leads_by_source: Record<string, number>;
  leads_by_status: Record<string, number>;
  leads_by_industry: Record<string, number>;
  
  // Opportunity Analytics
  total_opportunities: number;
  opportunities_won: number;
  opportunities_lost: number;
  win_rate: number;
  average_deal_size: number;
  total_pipeline_value: number;
  opportunities_by_stage: Record<string, number>;
  
  // Revenue Analytics
  total_revenue: number;
  revenue_this_month: number;
  revenue_growth_rate: number;
  revenue_by_month: Array<{ month: string; revenue: number }>;
  revenue_by_source: Record<string, number>;
  
  // Activity Analytics
  total_activities: number;
  activities_this_week: number;
  activities_by_type: Record<string, number>;
  average_activities_per_lead: number;
  
  // Task Analytics
  total_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
  task_completion_rate: number;
  average_task_completion_time: number;
  
  // Campaign Analytics
  total_campaigns: number;
  campaign_open_rate: number;
  campaign_click_rate: number;
  campaign_conversion_rate: number;
  
  // Performance Metrics
  sales_velocity: number;
  customer_acquisition_cost: number;
  lifetime_value: number;
  churn_rate: number;
}

export interface TimeSeriesData {
  date: string;
  leads: number;
  opportunities: number;
  revenue: number;
  activities: number;
  tasks_completed: number;
}

export interface ConversionFunnel {
  stage: string;
  count: number;
  conversion_rate: number;
  drop_off_rate: number;
}

export interface UserPerformance {
  user_id: string;
  user_name: string;
  leads_generated: number;
  opportunities_created: number;
  deals_won: number;
  revenue_generated: number;
  activities_logged: number;
  tasks_completed: number;
  performance_score: number;
}

export interface PredictiveInsights {
  revenue_forecast: Array<{ month: string; predicted_revenue: number; confidence: number }>;
  lead_score_distribution: Record<string, number>;
  churn_risk_leads: Array<{ lead_id: string; risk_score: number; reasons: string[] }>;
  opportunity_win_probability: Array<{ opportunity_id: string; win_probability: number }>;
  recommended_actions: Array<{ type: string; description: string; priority: number }>;
}

export class AdvancedAnalyticsService {
  // Get comprehensive analytics metrics
  static async getAnalyticsMetrics(dateRange?: {
    start_date: string;
    end_date: string;
  }): Promise<AnalyticsMetrics> {
    try {
      const startDate = dateRange?.start_date || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = dateRange?.end_date || new Date().toISOString();

      // Fetch leads data
      const { data: leads } = await supabase
        .from('crm_leads')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      // Fetch opportunities data
      const { data: opportunities } = await supabase
        .from('crm_opportunities')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      // Fetch activities data
      const { data: activities } = await supabase
        .from('crm_activities')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      // Fetch tasks data
      const { data: tasks } = await supabase
        .from('crm_tasks')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      // Fetch campaigns data
      const { data: campaigns } = await supabase
        .from('crm_email_campaigns')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      // Calculate metrics
      const totalLeads = leads?.length || 0;
      const totalOpportunities = opportunities?.length || 0;
      const wonOpportunities = opportunities?.filter(o => o.opportunity_status === 'won').length || 0;
      const lostOpportunities = opportunities?.filter(o => o.opportunity_status === 'lost').length || 0;
      const completedTasks = tasks?.filter(t => t.status === 'completed').length || 0;
      const overdueTasks = tasks?.filter(t => 
        t.status !== 'completed' && 
        t.due_date && 
        new Date(t.due_date) < new Date()
      ).length || 0;

      // Calculate revenue metrics
      const totalRevenue = opportunities
        ?.filter(o => o.opportunity_status === 'won')
        .reduce((sum, o) => sum + (o.opportunity_value || 0), 0) || 0;

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const revenueThisMonth = opportunities
        ?.filter(o => {
          if (o.opportunity_status !== 'won' || !o.close_date) return false;
          const closeDate = new Date(o.close_date);
          return closeDate.getMonth() === currentMonth && closeDate.getFullYear() === currentYear;
        })
        .reduce((sum, o) => sum + (o.opportunity_value || 0), 0) || 0;

      // Group data for analytics
      const leadsBySource = this.groupBy(leads || [], 'lead_source');
      const leadsByStatus = this.groupBy(leads || [], 'lead_status');
      const leadsByIndustry = this.groupBy(leads || [], 'industry');
      const opportunitiesByStage = this.groupBy(opportunities || [], 'pipeline_stage_id');
      const activitiesByType = this.groupBy(activities || [], 'activity_type');
      const revenueBySource = this.calculateRevenueBySource(opportunities || []);

      // Calculate rates and averages
      const winRate = totalOpportunities > 0 ? (wonOpportunities / totalOpportunities) * 100 : 0;
      const averageDealSize = wonOpportunities > 0 ? totalRevenue / wonOpportunities : 0;
      const taskCompletionRate = tasks?.length ? (completedTasks / tasks.length) * 100 : 0;
      const leadConversionRate = totalLeads > 0 ? (totalOpportunities / totalLeads) * 100 : 0;

      // Calculate campaign metrics
      const totalCampaigns = campaigns?.length || 0;
      const avgOpenRate = campaigns?.length 
        ? campaigns.reduce((sum, c) => {
            const rate = c.delivered_count ? ((c.opened_count || 0) / c.delivered_count) * 100 : 0;
            return sum + rate;
          }, 0) / campaigns.length
        : 0;

      const avgClickRate = campaigns?.length
        ? campaigns.reduce((sum, c) => {
            const rate = c.opened_count ? ((c.clicked_count || 0) / c.opened_count) * 100 : 0;
            return sum + rate;
          }, 0) / campaigns.length
        : 0;

      const avgConversionRate = campaigns?.length
        ? campaigns.reduce((sum, c) => {
            const rate = c.total_recipients ? ((c.leads_generated || 0) / c.total_recipients) * 100 : 0;
            return sum + rate;
          }, 0) / campaigns.length
        : 0;

      // Calculate advanced metrics
      const salesVelocity = this.calculateSalesVelocity(opportunities || []);
      const averageLeadScore = leads?.length 
        ? leads.reduce((sum, l) => sum + (l.lead_score || 0), 0) / leads.length 
        : 0;

      return {
        total_leads: totalLeads,
        new_leads_this_month: this.getThisMonthCount(leads || []),
        lead_conversion_rate: leadConversionRate,
        average_lead_score: averageLeadScore,
        leads_by_source: leadsBySource,
        leads_by_status: leadsByStatus,
        leads_by_industry: leadsByIndustry,
        
        total_opportunities: totalOpportunities,
        opportunities_won: wonOpportunities,
        opportunities_lost: lostOpportunities,
        win_rate: winRate,
        average_deal_size: averageDealSize,
        total_pipeline_value: opportunities?.reduce((sum, o) => sum + (o.opportunity_value || 0), 0) || 0,
        opportunities_by_stage: opportunitiesByStage,
        
        total_revenue: totalRevenue,
        revenue_this_month: revenueThisMonth,
        revenue_growth_rate: this.calculateRevenueGrowthRate(opportunities || []),
        revenue_by_month: this.getRevenueByMonth(opportunities || []),
        revenue_by_source: revenueBySource,
        
        total_activities: activities?.length || 0,
        activities_this_week: this.getThisWeekCount(activities || []),
        activities_by_type: activitiesByType,
        average_activities_per_lead: totalLeads > 0 ? (activities?.length || 0) / totalLeads : 0,
        
        total_tasks: tasks?.length || 0,
        completed_tasks: completedTasks,
        overdue_tasks: overdueTasks,
        task_completion_rate: taskCompletionRate,
        average_task_completion_time: this.calculateAverageTaskCompletionTime(tasks || []),
        
        total_campaigns: totalCampaigns,
        campaign_open_rate: avgOpenRate,
        campaign_click_rate: avgClickRate,
        campaign_conversion_rate: avgConversionRate,
        
        sales_velocity: salesVelocity,
        customer_acquisition_cost: this.calculateCAC(campaigns || [], totalLeads),
        lifetime_value: this.calculateLTV(opportunities || []),
        churn_rate: this.calculateChurnRate(opportunities || [])
      };
    } catch (error) {
      console.error('Error fetching analytics metrics:', error);
      return this.getEmptyAnalyticsMetrics();
    }
  }

  // Get time series data for charts
  static async getTimeSeriesData(days: number = 30): Promise<TimeSeriesData[]> {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

      const timeSeriesData: TimeSeriesData[] = [];

      for (let i = 0; i < days; i++) {
        const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        const nextDateStr = new Date(date.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        // Fetch data for this specific day
        const [leadsResult, opportunitiesResult, activitiesResult, tasksResult] = await Promise.all([
          supabase.from('crm_leads').select('id').gte('created_at', dateStr).lt('created_at', nextDateStr),
          supabase.from('crm_opportunities').select('id, opportunity_value, opportunity_status').gte('created_at', dateStr).lt('created_at', nextDateStr),
          supabase.from('crm_activities').select('id').gte('created_at', dateStr).lt('created_at', nextDateStr),
          supabase.from('crm_tasks').select('id').eq('status', 'completed').gte('completed_date', dateStr).lt('completed_date', nextDateStr)
        ]);

        const revenue = opportunitiesResult.data
          ?.filter(o => o.opportunity_status === 'won')
          .reduce((sum, o) => sum + (o.opportunity_value || 0), 0) || 0;

        timeSeriesData.push({
          date: dateStr,
          leads: leadsResult.data?.length || 0,
          opportunities: opportunitiesResult.data?.length || 0,
          revenue: revenue,
          activities: activitiesResult.data?.length || 0,
          tasks_completed: tasksResult.data?.length || 0
        });
      }

      return timeSeriesData;
    } catch (error) {
      console.error('Error fetching time series data:', error);
      return [];
    }
  }

  // Get conversion funnel data
  static async getConversionFunnel(): Promise<ConversionFunnel[]> {
    try {
      // Get pipeline stages
      const { data: stages } = await supabase
        .from('crm_pipeline_stages')
        .select('*')
        .eq('is_active', true)
        .order('stage_order');

      if (!stages) return [];

      // Get opportunities by stage
      const { data: opportunities } = await supabase
        .from('crm_opportunities')
        .select('pipeline_stage_id');

      const opportunitiesByStage = this.groupBy(opportunities || [], 'pipeline_stage_id');
      
      let previousCount = 0;
      const funnelData: ConversionFunnel[] = stages.map((stage, index) => {
        const count = opportunitiesByStage[stage.id] || 0;
        const conversionRate = index === 0 ? 100 : previousCount > 0 ? (count / previousCount) * 100 : 0;
        const dropOffRate = index === 0 ? 0 : 100 - conversionRate;
        
        if (index === 0) previousCount = count;
        else previousCount = count;

        return {
          stage: stage.stage_name,
          count: count,
          conversion_rate: conversionRate,
          drop_off_rate: dropOffRate
        };
      });

      return funnelData;
    } catch (error) {
      console.error('Error fetching conversion funnel:', error);
      return [];
    }
  }

  // Get user performance data
  static async getUserPerformance(): Promise<UserPerformance[]> {
    try {
      // Fetch real user performance data from CRM tables
      const { data: leads } = await supabase.from('crm_leads').select('assigned_to');
      const { data: opportunities } = await supabase.from('crm_opportunities').select('assigned_to, opportunity_status, opportunity_value');
      const { data: activities } = await supabase.from('crm_activities').select('created_by');
      const { data: tasks } = await supabase.from('crm_tasks').select('assigned_to, status');

      // Group by user and calculate metrics
      const userMetrics: Record<string, UserPerformance> = {};

      // Process leads
      leads?.forEach(lead => {
        if (lead.assigned_to) {
          if (!userMetrics[lead.assigned_to]) {
            userMetrics[lead.assigned_to] = {
              user_id: lead.assigned_to,
              user_name: lead.assigned_to,
              leads_generated: 0,
              opportunities_created: 0,
              deals_won: 0,
              revenue_generated: 0,
              activities_logged: 0,
              tasks_completed: 0,
              performance_score: 0
            };
          }
          userMetrics[lead.assigned_to].leads_generated++;
        }
      });

      // Process opportunities
      opportunities?.forEach(opp => {
        if (opp.assigned_to && userMetrics[opp.assigned_to]) {
          userMetrics[opp.assigned_to].opportunities_created++;
          if (opp.opportunity_status === 'won') {
            userMetrics[opp.assigned_to].deals_won++;
            userMetrics[opp.assigned_to].revenue_generated += opp.opportunity_value || 0;
          }
        }
      });

      // Process activities
      activities?.forEach(activity => {
        if (activity.created_by && userMetrics[activity.created_by]) {
          userMetrics[activity.created_by].activities_logged++;
        }
      });

      // Process tasks
      tasks?.forEach(task => {
        if (task.assigned_to && userMetrics[task.assigned_to]) {
          if (task.status === 'completed') {
            userMetrics[task.assigned_to].tasks_completed++;
          }
        }
      });

      // Calculate performance scores
      Object.values(userMetrics).forEach(user => {
        const leadScore = user.leads_generated * 2;
        const oppScore = user.opportunities_created * 5;
        const dealScore = user.deals_won * 10;
        const revenueScore = user.revenue_generated / 1000;
        const activityScore = user.activities_logged * 1;
        const taskScore = user.tasks_completed * 3;

        user.performance_score = leadScore + oppScore + dealScore + revenueScore + activityScore + taskScore;
      });

      return Object.values(userMetrics);
    } catch (error) {
      console.error('Error fetching user performance:', error);
      return [];
    }
  }

  // Get predictive insights
  static async getPredictiveInsights(): Promise<PredictiveInsights> {
    try {
      // This would typically use ML models for predictions
      // For now, return calculated insights based on historical data
      
      const { data: opportunities } = await supabase
        .from('crm_opportunities')
        .select('*');

      const { data: leads } = await supabase
        .from('crm_leads')
        .select('*');

      // Generate revenue forecast (simple trend-based)
      const revenueForecast = this.generateRevenueForecast(opportunities || []);
      
      // Calculate lead score distribution
      const leadScoreDistribution = this.calculateLeadScoreDistribution(leads || []);
      
      // Identify churn risk leads
      const churnRiskLeads = this.identifyChurnRiskLeads(leads || []);
      
      // Calculate opportunity win probabilities
      const opportunityWinProbability = this.calculateWinProbabilities(opportunities || []);
      
      // Generate recommended actions
      const recommendedActions = this.generateRecommendedActions(leads || [], opportunities || []);

      return {
        revenue_forecast: revenueForecast,
        lead_score_distribution: leadScoreDistribution,
        churn_risk_leads: churnRiskLeads,
        opportunity_win_probability: opportunityWinProbability,
        recommended_actions: recommendedActions
      };
    } catch (error) {
      console.error('Error fetching predictive insights:', error);
      return {
        revenue_forecast: [],
        lead_score_distribution: {},
        churn_risk_leads: [],
        opportunity_win_probability: [],
        recommended_actions: []
      };
    }
  }

  // Helper methods
  private static groupBy(array: any[], key: string): Record<string, number> {
    return array.reduce((result, item) => {
      const group = item[key] || 'Unknown';
      result[group] = (result[group] || 0) + 1;
      return result;
    }, {});
  }

  private static getThisMonthCount(array: any[]): number {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    return array.filter(item => {
      const date = new Date(item.created_at);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    }).length;
  }

  private static getThisWeekCount(array: any[]): number {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return array.filter(item => new Date(item.created_at) >= oneWeekAgo).length;
  }

  private static calculateRevenueBySource(opportunities: any[]): Record<string, number> {
    return opportunities
      .filter(o => o.opportunity_status === 'won')
      .reduce((result, opp) => {
        const source = opp.lead_source || 'Unknown';
        result[source] = (result[source] || 0) + (opp.opportunity_value || 0);
        return result;
      }, {});
  }

  private static getRevenueByMonth(opportunities: any[]): Array<{ month: string; revenue: number }> {
    const monthlyRevenue: Record<string, number> = {};
    
    opportunities
      .filter(o => o.opportunity_status === 'won' && o.close_date)
      .forEach(opp => {
        const date = new Date(opp.close_date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + (opp.opportunity_value || 0);
      });

    return Object.entries(monthlyRevenue)
      .map(([month, revenue]) => ({ month, revenue }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  private static calculateRevenueGrowthRate(opportunities: any[]): number {
    const monthlyRevenue = this.getRevenueByMonth(opportunities);
    if (monthlyRevenue.length < 2) return 0;

    const lastMonth = monthlyRevenue[monthlyRevenue.length - 1];
    const previousMonth = monthlyRevenue[monthlyRevenue.length - 2];
    
    if (previousMonth.revenue === 0) return 0;
    return ((lastMonth.revenue - previousMonth.revenue) / previousMonth.revenue) * 100;
  }

  private static calculateSalesVelocity(opportunities: any[]): number {
    const wonOpportunities = opportunities.filter(o => 
      o.opportunity_status === 'won' && o.created_at && o.close_date
    );

    if (wonOpportunities.length === 0) return 0;

    const totalValue = wonOpportunities.reduce((sum, o) => sum + (o.opportunity_value || 0), 0);
    const totalDays = wonOpportunities.reduce((sum, o) => {
      const created = new Date(o.created_at);
      const closed = new Date(o.close_date);
      return sum + Math.max(1, (closed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    }, 0);

    return totalValue / (totalDays / wonOpportunities.length);
  }

  private static calculateAverageTaskCompletionTime(tasks: any[]): number {
    const completedTasks = tasks.filter(t => 
      t.status === 'completed' && t.created_at && t.completed_date
    );

    if (completedTasks.length === 0) return 0;

    const totalHours = completedTasks.reduce((sum, task) => {
      const created = new Date(task.created_at);
      const completed = new Date(task.completed_date);
      return sum + (completed.getTime() - created.getTime()) / (1000 * 60 * 60);
    }, 0);

    return totalHours / completedTasks.length;
  }

  private static calculateCAC(campaigns: any[], totalLeads: number): number {
    const totalCampaignCost = campaigns.reduce((sum, c) => sum + (c.campaign_cost || 0), 0);
    return totalLeads > 0 ? totalCampaignCost / totalLeads : 0;
  }

  private static calculateLTV(opportunities: any[]): number {
    const wonOpportunities = opportunities.filter(o => o.opportunity_status === 'won');
    if (wonOpportunities.length === 0) return 0;
    
    const averageValue = wonOpportunities.reduce((sum, o) => sum + (o.opportunity_value || 0), 0) / wonOpportunities.length;
    return averageValue * 1.5; // Simple LTV calculation
  }

  private static calculateChurnRate(opportunities: any[]): number {
    const totalOpportunities = opportunities.length;
    const lostOpportunities = opportunities.filter(o => o.opportunity_status === 'lost').length;
    return totalOpportunities > 0 ? (lostOpportunities / totalOpportunities) * 100 : 0;
  }

  private static generateRevenueForecast(opportunities: any[]): Array<{ month: string; predicted_revenue: number; confidence: number }> {
    const monthlyRevenue = this.getRevenueByMonth(opportunities);
    if (monthlyRevenue.length < 3) return [];

    // Simple trend-based forecast for next 6 months
    const forecast = [];
    const recentMonths = monthlyRevenue.slice(-3);
    const avgGrowth = recentMonths.length > 1 
      ? recentMonths.reduce((sum, month, index) => {
          if (index === 0) return 0;
          const prevRevenue = recentMonths[index - 1].revenue;
          return sum + (prevRevenue > 0 ? (month.revenue - prevRevenue) / prevRevenue : 0);
        }, 0) / (recentMonths.length - 1)
      : 0;

    let lastRevenue = monthlyRevenue[monthlyRevenue.length - 1].revenue;
    const currentDate = new Date();

    for (let i = 1; i <= 6; i++) {
      const forecastDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
      const monthKey = `${forecastDate.getFullYear()}-${String(forecastDate.getMonth() + 1).padStart(2, '0')}`;
      
      lastRevenue = lastRevenue * (1 + avgGrowth);
      const confidence = Math.max(50, 90 - (i * 5)); // Decreasing confidence over time

      forecast.push({
        month: monthKey,
        predicted_revenue: Math.max(0, lastRevenue),
        confidence: confidence
      });
    }

    return forecast;
  }

  private static calculateLeadScoreDistribution(leads: any[]): Record<string, number> {
    const distribution = {
      'Low (0-25)': 0,
      'Medium (26-50)': 0,
      'High (51-75)': 0,
      'Very High (76-100)': 0
    };

    leads.forEach(lead => {
      const score = lead.lead_score || 0;
      if (score <= 25) distribution['Low (0-25)']++;
      else if (score <= 50) distribution['Medium (26-50)']++;
      else if (score <= 75) distribution['High (51-75)']++;
      else distribution['Very High (76-100)']++;
    });

    return distribution;
  }

  private static identifyChurnRiskLeads(leads: any[]): Array<{ lead_id: string; risk_score: number; reasons: string[] }> {
    return leads
      .filter(lead => {
        const daysSinceLastContact = lead.last_contact_date 
          ? (Date.now() - new Date(lead.last_contact_date).getTime()) / (1000 * 60 * 60 * 24)
          : 999;
        return daysSinceLastContact > 30 || lead.lead_score < 30;
      })
      .map(lead => {
        const reasons = [];
        const daysSinceLastContact = lead.last_contact_date 
          ? (Date.now() - new Date(lead.last_contact_date).getTime()) / (1000 * 60 * 60 * 24)
          : 999;

        if (daysSinceLastContact > 30) reasons.push('No recent contact');
        if (lead.lead_score < 30) reasons.push('Low engagement score');
        if (lead.lead_status === 'cold') reasons.push('Cold lead status');

        const riskScore = Math.min(100, 
          (daysSinceLastContact > 30 ? 40 : 0) +
          (lead.lead_score < 30 ? 30 : 0) +
          (lead.lead_status === 'cold' ? 30 : 0)
        );

        return {
          lead_id: lead.id,
          risk_score: riskScore,
          reasons: reasons
        };
      })
      .sort((a, b) => b.risk_score - a.risk_score)
      .slice(0, 10);
  }

  private static calculateWinProbabilities(opportunities: any[]): Array<{ opportunity_id: string; win_probability: number }> {
    return opportunities
      .filter(o => o.opportunity_status === 'open')
      .map(opp => {
        let probability = 50; // Base probability

        // Adjust based on stage probability
        if (opp.stage_probability) {
          probability = opp.stage_probability;
        }

        // Adjust based on opportunity age
        const daysSinceCreated = opp.created_at 
          ? (Date.now() - new Date(opp.created_at).getTime()) / (1000 * 60 * 60 * 24)
          : 0;

        if (daysSinceCreated > 90) probability *= 0.8;
        else if (daysSinceCreated > 60) probability *= 0.9;

        // Adjust based on value
        if (opp.opportunity_value > 100000) probability *= 0.9; // Large deals are harder
        else if (opp.opportunity_value < 10000) probability *= 1.1; // Small deals are easier

        return {
          opportunity_id: opp.id,
          win_probability: Math.min(95, Math.max(5, probability))
        };
      })
      .sort((a, b) => b.win_probability - a.win_probability);
  }

  private static generateRecommendedActions(leads: any[], opportunities: any[]): Array<{ type: string; description: string; priority: number }> {
    const actions = [];

    // Check for overdue follow-ups
    const overdueLeads = leads.filter(lead => {
      const daysSinceLastContact = lead.last_contact_date
        ? (Date.now() - new Date(lead.last_contact_date).getTime()) / (1000 * 60 * 60 * 24)
        : 999;
      return daysSinceLastContact > 14;
    });

    if (overdueLeads.length > 0) {
      actions.push({
        type: 'follow_up',
        description: `Follow up with ${overdueLeads.length} leads that haven't been contacted in over 2 weeks`,
        priority: 1
      });
    }

    // Check for high-value opportunities
    const highValueOpps = opportunities.filter(opp =>
      opp.opportunity_status === 'open' && (opp.opportunity_value || 0) > 50000
    );

    if (highValueOpps.length > 0) {
      actions.push({
        type: 'opportunity_focus',
        description: `Focus on ${highValueOpps.length} high-value opportunities worth over $50K`,
        priority: 1
      });
    }

    // Check for low-scoring leads
    const lowScoreLeads = leads.filter(lead => (lead.lead_score || 0) < 30);
    if (lowScoreLeads.length > 10) {
      actions.push({
        type: 'lead_nurturing',
        description: `Implement nurturing campaigns for ${lowScoreLeads.length} low-scoring leads`,
        priority: 2
      });
    }

    // Check for stale opportunities
    const staleOpps = opportunities.filter(opp => {
      if (opp.opportunity_status !== 'open') return false;
      const daysSinceCreated = opp.created_at
        ? (Date.now() - new Date(opp.created_at).getTime()) / (1000 * 60 * 60 * 24)
        : 0;
      return daysSinceCreated > 60;
    });

    if (staleOpps.length > 0) {
      actions.push({
        type: 'opportunity_review',
        description: `Review ${staleOpps.length} opportunities that have been open for over 60 days`,
        priority: 2
      });
    }

    return actions.sort((a, b) => a.priority - b.priority);
  }

  private static getEmptyAnalyticsMetrics(): AnalyticsMetrics {
    return {
      total_leads: 0,
      new_leads_this_month: 0,
      lead_conversion_rate: 0,
      average_lead_score: 0,
      leads_by_source: {},
      leads_by_status: {},
      leads_by_industry: {},
      
      total_opportunities: 0,
      opportunities_won: 0,
      opportunities_lost: 0,
      win_rate: 0,
      average_deal_size: 0,
      total_pipeline_value: 0,
      opportunities_by_stage: {},
      
      total_revenue: 0,
      revenue_this_month: 0,
      revenue_growth_rate: 0,
      revenue_by_month: [],
      revenue_by_source: {},
      
      total_activities: 0,
      activities_this_week: 0,
      activities_by_type: {},
      average_activities_per_lead: 0,
      
      total_tasks: 0,
      completed_tasks: 0,
      overdue_tasks: 0,
      task_completion_rate: 0,
      average_task_completion_time: 0,
      
      total_campaigns: 0,
      campaign_open_rate: 0,
      campaign_click_rate: 0,
      campaign_conversion_rate: 0,
      
      sales_velocity: 0,
      customer_acquisition_cost: 0,
      lifetime_value: 0,
      churn_rate: 0
    };
  }
}