import { supabase } from '@/integrations/supabase/client';
import type { Activity } from '@/types/crm';

// Type guard for valid activity priority
function isValidActivityPriority(priority: string): priority is 'low' | 'medium' | 'high' {
  return ['low', 'medium', 'high'].includes(priority);
}

// Revenue metrics interface
export interface RevenueMetrics {
  currentRevenue: number;
  previousRevenue: number;
  growthRate: number;
  pipelineValue: number;
  averageDealSize: number;
  forecastValue: number;
}

// Pipeline metrics interface
export interface PipelineMetrics {
  totalPipelineValue: number;
  weightedPipelineValue: number;
  averageCloseTime: number;
  conversionRate: number;
  stageDistribution: Array<{
    stage_name: string;
    opportunity_count: number;
    total_value: number;
    avg_probability: number;
  }>;
}

// CRM Entity interfaces
export interface CRMAccount {
  id: string;
  account_name: string;
  account_type: string;
  industry?: string;
  company_size?: string;
  website?: string;
  phone?: string;
  account_status: string;
  annual_revenue?: number;
  created_at: string;
  updated_at: string;
}

export interface CRMContact {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  mobile_phone?: string;
  title?: string;
  department?: string;
  account_id?: string;
  contact_status: string;
  lead_source?: string;
  preferred_contact_method?: string;
  do_not_call: boolean;
  do_not_email: boolean;
  created_at: string;
  updated_at: string;
}

export interface CRMOpportunity {
  id: string;
  opportunity_name: string;
  account_id?: string;
  estimated_value: number;
  stage: string;
  probability: number;
  expected_close_date?: string;
  description?: string;
  opportunity_status: string;
  created_at: string;
  updated_at: string;
}

export interface CRMLead {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  company_name?: string;
  job_title?: string;
  lead_status: string;
  lead_source: string;
  lead_score: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export class EnhancedCRMService {
  static async getActivities(): Promise<Activity[]> {
    const { data, error } = await supabase
      .from('crm_activities')
      .select('*')
      .order('activity_date', { ascending: false });
    
    if (error) throw error;
    
    // Type-safe conversion with proper validation
    return (data || []).map(activity => ({
      ...activity,
      priority: isValidActivityPriority(activity.priority) ? activity.priority : 'medium'
    })) as Activity[];
  }

  static async createActivity(activity: Omit<Activity, 'id' | 'created_at' | 'updated_at'>): Promise<Activity> {
    const { data, error } = await supabase
      .from('crm_activities')
      .insert(activity)
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      ...data,
      priority: isValidActivityPriority(data.priority) ? data.priority : 'medium'
    } as Activity;
  }

  static async updateActivity(id: string, updates: Partial<Activity>): Promise<void> {
    const { error } = await supabase
      .from('crm_activities')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);
    
    if (error) throw error;
  }

  static async deleteActivity(id: string): Promise<void> {
    const { error } = await supabase
      .from('crm_activities')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Revenue Analytics Methods
  static async getRevenueMetrics(dateRange: { start: Date; end: Date }): Promise<RevenueMetrics> {
    // Mock implementation - replace with actual database queries
    return {
      currentRevenue: 2450000,
      previousRevenue: 2100000,
      growthRate: 16.7,
      pipelineValue: 4800000,
      averageDealSize: 125000,
      forecastValue: 3200000
    };
  }

  static async getPipelineMetrics(): Promise<PipelineMetrics> {
    // Mock implementation - replace with actual database queries
    return {
      totalPipelineValue: 4800000,
      weightedPipelineValue: 3200000,
      averageCloseTime: 45,
      conversionRate: 15.8,
      stageDistribution: [
        {
          stage_name: 'Prospect',
          opportunity_count: 15,
          total_value: 1200000,
          avg_probability: 20
        },
        {
          stage_name: 'Qualified',
          opportunity_count: 12,
          total_value: 1800000,
          avg_probability: 50
        },
        {
          stage_name: 'Proposal',
          opportunity_count: 8,
          total_value: 1400000,
          avg_probability: 75
        },
        {
          stage_name: 'Negotiation',
          opportunity_count: 4,
          total_value: 400000,
          avg_probability: 90
        }
      ]
    };
  }

  // CRM Entity Management Methods
  static async createLead(lead: Omit<CRMLead, 'id' | 'created_at' | 'updated_at'>): Promise<CRMLead> {
    const { data, error } = await supabase
      .from('crm_leads')
      .insert({
        ...lead,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data as CRMLead;
  }

  static async createAccount(account: Omit<CRMAccount, 'id' | 'created_at' | 'updated_at'>): Promise<CRMAccount> {
    const { data, error } = await supabase
      .from('crm_accounts')
      .insert({
        ...account,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data as CRMAccount;
  }

  static async createContact(contact: Omit<CRMContact, 'id' | 'created_at' | 'updated_at'>): Promise<CRMContact> {
    const { data, error } = await supabase
      .from('crm_contacts')
      .insert({
        ...contact,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data as CRMContact;
  }

  static async createOpportunity(opportunity: Omit<CRMOpportunity, 'id' | 'created_at' | 'updated_at'>): Promise<CRMOpportunity> {
    const { data, error } = await supabase
      .from('crm_opportunities')
      .insert({
        ...opportunity,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data as CRMOpportunity;
  }

  // Missing methods that components are trying to use
  static async getContacts(): Promise<CRMContact[]> {
    const { data, error } = await supabase
      .from('crm_contacts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as CRMContact[];
  }

  static async getOpportunities(): Promise<CRMOpportunity[]> {
    const { data, error } = await supabase
      .from('crm_opportunities')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as CRMOpportunity[];
  }

  static async getCRMStats(): Promise<CRMStats> {
    try {
      // Get actual counts from database
      const [contactsResult, opportunitiesResult, leadsResult] = await Promise.all([
        supabase.from('crm_contacts').select('id', { count: 'exact' }),
        supabase.from('crm_opportunities').select('id', { count: 'exact' }),
        supabase.from('crm_leads').select('id', { count: 'exact' })
      ]);

      const totalContacts = contactsResult.count || 0;
      const totalOpportunities = opportunitiesResult.count || 0;
      const totalLeads = leadsResult.count || 0;

      // Calculate conversion rate
      const conversionRate = totalLeads > 0 ? (totalOpportunities / totalLeads) * 100 : 0;

      return {
        totalContacts,
        totalOpportunities,
        totalRevenue: 2450000, // This would come from actual revenue calculations
        conversionRate: Math.round(conversionRate * 100) / 100
      };
    } catch (error) {
      console.error('Error fetching CRM stats:', error);
      // Return fallback data
      return {
        totalContacts: 0,
        totalOpportunities: 0,
        totalRevenue: 0,
        conversionRate: 0
      };
    }
  }

  // Enhanced methods for comprehensive CRM functionality
  static async getLeadWithActivities(leadId: string): Promise<any> {
    const { data, error } = await supabase
      .from('crm_leads')
      .select(`
        *,
        activities:crm_activities!lead_id(*)
      `)
      .eq('id', leadId)
      .single();

    if (error) throw error;
    return data;
  }

  static async getContactWithAccount(contactId: string): Promise<any> {
    const { data, error } = await supabase
      .from('crm_contacts')
      .select(`
        *,
        account:crm_accounts!account_id(*)
      `)
      .eq('id', contactId)
      .single();

    if (error) throw error;
    return data;
  }

  static async getAccountWithContacts(accountId: string): Promise<any> {
    const { data, error } = await supabase
      .from('crm_accounts')
      .select(`
        *,
        contacts:crm_contacts!account_id(*),
        opportunities:crm_opportunities!account_id(*)
      `)
      .eq('id', accountId)
      .single();

    if (error) throw error;
    return data;
  }
}

// Export alias for backward compatibility
export const CRMService = EnhancedCRMService;
