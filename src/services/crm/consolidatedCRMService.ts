
import { supabase } from '@/integrations/supabase/client';
import type { 
  Lead, 
  Contact, 
  Account, 
  Opportunity, 
  Activity, 
  AssignmentRule, 
  LeadScoringRule,
  RevenueMetrics,
  PipelineMetrics,
  CRMStats,
  DateRange
} from '@/types/crm';

/**
 * Consolidated CRM Service - Phase 4 Implementation
 * Unifies all CRM operations under a single service interface
 */
export class ConsolidatedCRMService {
  
  // ================ LEAD MANAGEMENT ================
  static async createLead(leadData: Omit<Lead, 'id' | 'created_at' | 'updated_at'>): Promise<Lead | null> {
    try {
      const { data, error } = await supabase
        .from('crm_leads')
        .insert(leadData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating lead:', error);
      return null;
    }
  }

  static async getLeads(filters?: any): Promise<Lead[]> {
    try {
      let query = supabase
        .from('crm_leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('lead_status', filters.status);
      }

      if (filters?.assigned_to) {
        query = query.eq('assigned_to', filters.assigned_to);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching leads:', error);
      return [];
    }
  }

  static async updateLead(id: string, updates: Partial<Lead>): Promise<Lead | null> {
    try {
      const { data, error } = await supabase
        .from('crm_leads')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating lead:', error);
      return null;
    }
  }

  static async deleteLead(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('crm_leads')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting lead:', error);
      return false;
    }
  }

  // ================ CONTACT MANAGEMENT ================
  static async createContact(contactData: Omit<Contact, 'id' | 'created_at' | 'updated_at'>): Promise<Contact | null> {
    try {
      const { data, error } = await supabase
        .from('crm_contacts')
        .insert(contactData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating contact:', error);
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
      return data || [];
    } catch (error) {
      console.error('Error fetching contacts:', error);
      return [];
    }
  }

  static async updateContact(id: string, updates: Partial<Contact>): Promise<Contact | null> {
    try {
      const { data, error } = await supabase
        .from('crm_contacts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating contact:', error);
      return null;
    }
  }

  static async deleteContact(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('crm_contacts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting contact:', error);
      return false;
    }
  }

  // ================ ACCOUNT MANAGEMENT ================
  static async createAccount(accountData: Omit<Account, 'id' | 'created_at' | 'updated_at'>): Promise<Account | null> {
    try {
      const { data, error } = await supabase
        .from('crm_accounts')
        .insert(accountData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating account:', error);
      return null;
    }
  }

  static async getAccounts(): Promise<Account[]> {
    try {
      const { data, error } = await supabase
        .from('crm_accounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching accounts:', error);
      return [];
    }
  }

  static async updateAccount(id: string, updates: Partial<Account>): Promise<Account | null> {
    try {
      const { data, error } = await supabase
        .from('crm_accounts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating account:', error);
      return null;
    }
  }

  // ================ OPPORTUNITY MANAGEMENT ================
  static async createOpportunity(opportunityData: Omit<Opportunity, 'id' | 'created_at' | 'updated_at'>): Promise<Opportunity | null> {
    try {
      const { data, error } = await supabase
        .from('crm_opportunities')
        .insert(opportunityData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating opportunity:', error);
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
      return data || [];
    } catch (error) {
      console.error('Error fetching opportunities:', error);
      return [];
    }
  }

  static async updateOpportunity(id: string, updates: Partial<Opportunity>): Promise<Opportunity | null> {
    try {
      const { data, error } = await supabase
        .from('crm_opportunities')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating opportunity:', error);
      return null;
    }
  }

  // ================ ACTIVITY MANAGEMENT ================
  static async createActivity(activityData: Omit<Activity, 'id' | 'created_at' | 'updated_at'>): Promise<Activity | null> {
    try {
      const { data, error } = await supabase
        .from('crm_activities')
        .insert(activityData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating activity:', error);
      return null;
    }
  }

  static async getActivities(filters?: any): Promise<Activity[]> {
    try {
      let query = supabase
        .from('crm_activities')
        .select('*')
        .order('activity_date', { ascending: false });

      if (filters?.type && filters.type !== 'all') {
        query = query.eq('activity_type', filters.type);
      }

      if (filters?.completed !== undefined) {
        query = query.eq('completed', filters.completed);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching activities:', error);
      return [];
    }
  }

  static async updateActivity(id: string, updates: Partial<Activity>): Promise<Activity | null> {
    try {
      const { data, error } = await supabase
        .from('crm_activities')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating activity:', error);
      return null;
    }
  }

  // ================ ANALYTICS & REPORTING ================
  static async getCRMStats(): Promise<CRMStats> {
    try {
      const [leadsCount, opportunitiesCount, activitiesCount, pipelineValue] = await Promise.all([
        supabase.from('crm_leads').select('id', { count: 'exact' }),
        supabase.from('crm_opportunities').select('id', { count: 'exact' }),
        supabase.from('crm_activities').select('id', { count: 'exact' }),
        supabase.from('crm_opportunities').select('estimated_value').eq('opportunity_status', 'open')
      ]);

      const totalPipelineValue = pipelineValue.data?.reduce((sum, opp) => sum + (opp.estimated_value || 0), 0) || 0;

      return {
        total_leads: leadsCount.count || 0,
        total_opportunities: opportunitiesCount.count || 0,
        total_pipeline_value: totalPipelineValue,
        total_activities: activitiesCount.count || 0,
        conversion_rate: 0,
        win_rate: 0,
        average_deal_size: 0,
        totalCertificates: 0,
        pendingRequests: 0
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
        average_deal_size: 0,
        totalCertificates: 0,
        pendingRequests: 0
      };
    }
  }

  static async getRevenueMetrics(dateRange: DateRange): Promise<RevenueMetrics> {
    try {
      const { data: currentRevenue } = await supabase
        .from('crm_opportunities')
        .select('estimated_value')
        .eq('stage', 'closed_won')
        .gte('created_at', dateRange.start.toISOString())
        .lte('created_at', dateRange.end.toISOString());

      const currentRevenueValue = currentRevenue?.reduce((sum, opp) => sum + (opp.estimated_value || 0), 0) || 0;

      return {
        currentRevenue: currentRevenueValue,
        previousRevenue: 0,
        growthRate: 0,
        pipelineValue: 0,
        averageDealSize: 0,
        forecastValue: 0,
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

  // ================ ASSIGNMENT RULES ================
  static async createAssignmentRule(ruleData: Omit<AssignmentRule, 'id' | 'created_at' | 'updated_at'>): Promise<AssignmentRule | null> {
    try {
      const { data, error } = await supabase
        .from('crm_assignment_rules')
        .insert(ruleData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating assignment rule:', error);
      return null;
    }
  }

  static async getAssignmentRules(): Promise<AssignmentRule[]> {
    try {
      const { data, error } = await supabase
        .from('crm_assignment_rules')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching assignment rules:', error);
      return [];
    }
  }

  // ================ LEAD SCORING ================
  static async createLeadScoringRule(ruleData: Omit<LeadScoringRule, 'id' | 'created_at' | 'updated_at'>): Promise<LeadScoringRule | null> {
    try {
      const { data, error } = await supabase
        .from('crm_lead_scoring_rules')
        .insert(ruleData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating lead scoring rule:', error);
      return null;
    }
  }

  static async getLeadScoringRules(): Promise<LeadScoringRule[]> {
    try {
      const { data, error } = await supabase
        .from('crm_lead_scoring_rules')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching lead scoring rules:', error);
      return [];
    }
  }
}

// Export as default for backward compatibility
export default ConsolidatedCRMService;
