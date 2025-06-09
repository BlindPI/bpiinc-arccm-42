
import { supabase } from '@/integrations/supabase/client';
import type { Lead, Opportunity, Contact, Account, Activity } from '@/types/crm';

export class RealCRMService {
  // Lead Management with Real Backend Functions
  static async getLeads(): Promise<Lead[]> {
    const { data, error } = await supabase
      .from('crm_leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async createLead(leadData: Partial<Lead>): Promise<Lead> {
    const { data, error } = await supabase
      .from('crm_leads')
      .insert([leadData])
      .select()
      .single();

    if (error) throw error;

    // Automatically calculate lead score using backend function
    await this.calculateLeadScore(data.id);
    
    // Attempt intelligent assignment
    await this.assignLeadIntelligently(data.id);

    return data;
  }

  static async updateLead(leadId: string, leadData: Partial<Lead>): Promise<Lead> {
    const { data, error } = await supabase
      .from('crm_leads')
      .update(leadData)
      .eq('id', leadId)
      .select()
      .single();

    if (error) throw error;

    // Recalculate score after update
    await this.calculateLeadScore(leadId);

    return data;
  }

  static async calculateLeadScore(leadId: string): Promise<number> {
    const { data, error } = await supabase.rpc('calculate_enhanced_lead_score', {
      p_lead_id: leadId
    });

    if (error) {
      console.error('Error calculating lead score:', error);
      return 0;
    }

    return data || 0;
  }

  static async assignLeadIntelligently(leadId: string): Promise<string | null> {
    const { data, error } = await supabase.rpc('assign_lead_intelligent', {
      p_lead_id: leadId
    });

    if (error) {
      console.error('Error assigning lead:', error);
      return null;
    }

    return data;
  }

  static async qualifyLeadAutomatically(leadId: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('qualify_lead_automatically', {
      p_lead_id: leadId
    });

    if (error) {
      console.error('Error auto-qualifying lead:', error);
      return false;
    }

    return data || false;
  }

  // Lead Scoring Rules Management
  static async getLeadScoringRules() {
    const { data, error } = await supabase
      .from('crm_lead_scoring_rules')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async createScoringRule(rule: {
    rule_name: string;
    field_name: string;
    operator: string;
    field_value: string;
    score_points: number;
    priority: number;
  }) {
    const { data, error } = await supabase
      .from('crm_lead_scoring_rules')
      .insert([rule])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Assignment Rules Management
  static async getAssignmentRules() {
    const { data, error } = await supabase
      .from('crm_assignment_rules')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getAssignmentPerformance() {
    const { data, error } = await supabase
      .from('crm_assignment_performance')
      .select(`
        *,
        profiles:user_id (
          display_name,
          email,
          role
        )
      `)
      .eq('assignment_date', new Date().toISOString().split('T')[0]);

    if (error) throw error;
    return data || [];
  }

  // Lead Activities and Tracking
  static async getLeadActivities(leadId: string) {
    const { data, error } = await supabase
      .from('crm_lead_activity_tracking')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async createLeadActivity(activity: {
    lead_id: string;
    activity_type: string;
    activity_details: any;
    engagement_score?: number;
  }) {
    const { data, error } = await supabase
      .from('crm_lead_activity_tracking')
      .insert([activity])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Workflow Management
  static async executeLeadWorkflow(workflowId: string, leadId: string) {
    const { data, error } = await supabase.rpc('execute_lead_workflow', {
      p_workflow_id: workflowId,
      p_lead_id: leadId
    });

    if (error) throw error;
    return data;
  }

  static async getLeadWorkflows() {
    const { data, error } = await supabase
      .from('crm_lead_workflows')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getWorkflowExecutions(leadId?: string) {
    let query = supabase
      .from('crm_workflow_executions')
      .select(`
        *,
        crm_lead_workflows (
          workflow_name,
          workflow_description
        )
      `)
      .order('started_at', { ascending: false });

    if (leadId) {
      query = query.eq('lead_id', leadId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  // Real-time Metrics
  static async updateRealtimeMetrics() {
    const { error } = await supabase.rpc('update_realtime_metrics');
    if (error) throw error;
  }

  static async getRealtimeMetrics() {
    const { data, error } = await supabase
      .from('crm_realtime_metrics')
      .select('*')
      .gte('expires_at', new Date().toISOString());

    if (error) throw error;
    return data || [];
  }

  // Campaign Management
  static async getEmailCampaigns() {
    const { data, error } = await supabase
      .from('crm_email_campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async calculateCampaignROI(campaignId: string) {
    const { data, error } = await supabase.rpc('calculate_campaign_roi', {
      p_campaign_id: campaignId
    });

    if (error) throw error;
    return data || 0;
  }

  static async getCampaignPerformance() {
    const { data, error } = await supabase
      .from('crm_campaign_performance')
      .select('*')
      .order('campaign_id');

    if (error) throw error;
    return data || [];
  }

  // Revenue Analytics
  static async getRevenueForecasts() {
    const { data, error } = await supabase
      .from('crm_revenue_forecasts')
      .select('*')
      .order('forecast_period', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getRevenueRecords() {
    const { data, error } = await supabase
      .from('crm_revenue_records')
      .select('*')
      .order('record_date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Analytics Warehouse
  static async getAnalyticsData(metricName?: string) {
    let query = supabase
      .from('crm_analytics_warehouse')
      .select('*')
      .order('metric_date', { ascending: false });

    if (metricName) {
      query = query.eq('metric_name', metricName);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  // Lead Conversion Analytics
  static async getConversionAnalytics() {
    const { data, error } = await supabase
      .from('crm_conversion_analytics')
      .select('*');

    if (error) throw error;
    return data || [];
  }

  // Pipeline Analytics
  static async getPipelineMetrics() {
    const { data, error } = await supabase
      .from('crm_opportunities')
      .select(`
        stage,
        estimated_value,
        probability,
        created_at,
        opportunity_status
      `)
      .eq('opportunity_status', 'open');

    if (error) throw error;

    // Group by stage and calculate metrics
    const stageMetrics = (data || []).reduce((acc, opp) => {
      const stage = opp.stage;
      if (!acc[stage]) {
        acc[stage] = {
          stage_name: stage,
          opportunity_count: 0,
          total_value: 0,
          avg_probability: 0,
          probabilities: []
        };
      }
      
      acc[stage].opportunity_count++;
      acc[stage].total_value += opp.estimated_value || 0;
      acc[stage].probabilities.push(opp.probability || 0);
      
      return acc;
    }, {} as Record<string, any>);

    // Calculate average probabilities
    Object.values(stageMetrics).forEach((stage: any) => {
      if (stage.probabilities.length > 0) {
        stage.avg_probability = stage.probabilities.reduce((a: number, b: number) => a + b, 0) / stage.probabilities.length;
      }
      delete stage.probabilities;
    });

    return Object.values(stageMetrics);
  }
}
