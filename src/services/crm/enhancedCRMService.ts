
import { supabase } from '@/integrations/supabase/client';
import type { RevenueMetrics, PipelineMetrics, DateRange, Lead, Contact, Account, Opportunity, Activity, CRMStats } from '@/types/crm';
import { 
  safeLeadStatus, 
  safeLeadSource, 
  safeLeadType, 
  safeTrainingUrgency, 
  safePreferredTrainingFormat,
  safeContactStatus,
  safePreferredContactMethod,
  safeAccountType,
  safeAccountStatus,
  safeOpportunityStage,
  safeOpportunityStatus,
  safeActivityType
} from '@/types/supabase-schema';

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

  static async getLeads(): Promise<Lead[]> {
    try {
      const { data, error } = await supabase
        .from('crm_leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return (data || []).map(lead => ({
        ...lead,
        lead_status: safeLeadStatus(lead.lead_status),
        lead_source: safeLeadSource(lead.lead_source),
        lead_type: safeLeadType(lead.lead_type || ''),
        training_urgency: safeTrainingUrgency(lead.training_urgency || ''),
        preferred_training_format: safePreferredTrainingFormat(lead.preferred_training_format || '')
      }));
    } catch (error) {
      console.error('Error fetching leads:', error);
      return [];
    }
  }

  static async createLead(lead: Omit<Lead, 'id' | 'created_at' | 'updated_at'>): Promise<Lead | null> {
    try {
      const { data, error } = await supabase
        .from('crm_leads')
        .insert(lead)
        .select()
        .single();

      if (error) throw error;
      
      return data ? {
        ...data,
        lead_status: safeLeadStatus(data.lead_status),
        lead_source: safeLeadSource(data.lead_source),
        lead_type: safeLeadType(data.lead_type || ''),
        training_urgency: safeTrainingUrgency(data.training_urgency || ''),
        preferred_training_format: safePreferredTrainingFormat(data.preferred_training_format || '')
      } : null;
    } catch (error) {
      console.error('Error creating lead:', error);
      return null;
    }
  }

  static async getContacts(filters?: any): Promise<Contact[]> {
    try {
      let query = supabase
        .from('crm_contacts')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.account_id) {
        query = query.eq('account_id', filters.account_id);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      return (data || []).map(contact => ({
        ...contact,
        contact_status: safeContactStatus(contact.contact_status),
        preferred_contact_method: safePreferredContactMethod(contact.preferred_contact_method || 'email')
      }));
    } catch (error) {
      console.error('Error fetching contacts:', error);
      return [];
    }
  }

  static async createContact(contact: Omit<Contact, 'id' | 'created_at' | 'updated_at'>): Promise<Contact | null> {
    try {
      const { data, error } = await supabase
        .from('crm_contacts')
        .insert(contact)
        .select()
        .single();

      if (error) throw error;
      
      return data ? {
        ...data,
        contact_status: safeContactStatus(data.contact_status),
        preferred_contact_method: safePreferredContactMethod(data.preferred_contact_method || 'email')
      } : null;
    } catch (error) {
      console.error('Error creating contact:', error);
      return null;
    }
  }

  static async getOpportunities(filters?: any): Promise<Opportunity[]> {
    try {
      let query = supabase
        .from('crm_opportunities')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.account_id) {
        query = query.eq('account_id', filters.account_id);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      return (data || []).map(opp => ({
        ...opp,
        stage: safeOpportunityStage(opp.stage),
        opportunity_status: safeOpportunityStatus(opp.opportunity_status || 'open')
      }));
    } catch (error) {
      console.error('Error fetching opportunities:', error);
      return [];
    }
  }

  static async createAccount(account: Omit<Account, 'id' | 'created_at' | 'updated_at'>): Promise<Account | null> {
    try {
      const { data, error } = await supabase
        .from('crm_accounts')
        .insert(account)
        .select()
        .single();

      if (error) throw error;
      
      return data ? {
        ...data,
        account_type: safeAccountType(data.account_type),
        account_status: safeAccountStatus(data.account_status)
      } : null;
    } catch (error) {
      console.error('Error creating account:', error);
      return null;
    }
  }

  static async createOpportunity(opportunity: Omit<Opportunity, 'id' | 'created_at' | 'updated_at'>): Promise<Opportunity | null> {
    try {
      const { data, error } = await supabase
        .from('crm_opportunities')
        .insert(opportunity)
        .select()
        .single();

      if (error) throw error;
      
      return data ? {
        ...data,
        stage: safeOpportunityStage(data.stage),
        opportunity_status: safeOpportunityStatus(data.opportunity_status || 'open')
      } : null;
    } catch (error) {
      console.error('Error creating opportunity:', error);
      return null;
    }
  }

  static async getActivities(filters?: any): Promise<Activity[]> {
    try {
      let query = supabase
        .from('crm_activities')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.type && filters.type !== 'all') {
        query = query.eq('activity_type', filters.type);
      }

      if (filters?.completed !== undefined) {
        query = query.eq('completed', filters.completed);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      return (data || []).map(activity => ({
        ...activity,
        activity_type: safeActivityType(activity.activity_type)
      }));
    } catch (error) {
      console.error('Error fetching activities:', error);
      return [];
    }
  }

  static async getCRMStats(): Promise<CRMStats> {
    try {
      const { data: leadsCount } = await supabase
        .from('crm_leads')
        .select('id', { count: 'exact' });

      const { data: opportunitiesCount } = await supabase
        .from('crm_opportunities')
        .select('id', { count: 'exact' });

      const { data: activitiesCount } = await supabase
        .from('crm_activities')
        .select('id', { count: 'exact' });

      const { data: pipelineValue } = await supabase
        .from('crm_opportunities')
        .select('estimated_value')
        .eq('opportunity_status', 'open');

      const totalPipelineValue = pipelineValue?.reduce((sum, opp) => sum + (opp.estimated_value || 0), 0) || 0;

      return {
        total_leads: leadsCount?.length || 0,
        total_opportunities: opportunitiesCount?.length || 0,
        total_pipeline_value: totalPipelineValue,
        total_activities: activitiesCount?.length || 0,
        conversion_rate: 0,
        win_rate: 0,
        average_deal_size: 0
      };
    } catch (error) {
      console.error('Error fetching CRM stats:', error);
      return {
        total_leads: 0,
        total_opportunities: 0,
        total_pipeline_value: 0,
        total_activities: 0,
        conversion_rate: 0,
        win_rate: 0,
        average_deal_size: 0
      };
    }
  }
}

// Export as CRMService for backward compatibility
export const CRMService = EnhancedCRMService;
