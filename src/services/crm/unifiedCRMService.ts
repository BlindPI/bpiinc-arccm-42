import { supabase } from '@/integrations/supabase/client';
import type {
  Lead,
  Opportunity,
  Contact,
  Account,
  Activity,
  CRMStats,
  EmailCampaign,
  CampaignTemplate,
  PipelineMetrics,
  RevenueMetrics,
  DateRange
} from '@/types/crm';

// Define CampaignMetrics interface locally since it's not exported
interface CampaignMetrics {
  campaign_id: string;
  sent_count: number;
  delivered_count: number;
  opened_count: number;
  clicked_count: number;
  bounced_count: number;
  unsubscribed_count: number;
  open_rate: number;
  click_rate: number;
  bounce_rate: number;
  unsubscribe_rate: number;
}

/**
 * Unified CRM Service - Phase 2 Implementation
 * Consolidates all CRM functionality into a single, consistent service
 * Replaces fragmented services: CRMService, EnhancedCRMService, CRMLeadService
 */
export class UnifiedCRMService {
  
  // =====================================================
  // LEAD MANAGEMENT
  // =====================================================
  
  static async getLeads(filters?: {
    status?: string;
    source?: string;
    assigned_to?: string;
    limit?: number;
  }): Promise<Lead[]> {
    try {
      let query = supabase
        .from('crm_leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('lead_status', filters.status);
      }
      if (filters?.source) {
        query = query.eq('lead_source', filters.source);
      }
      if (filters?.assigned_to) {
        query = query.eq('assigned_to', filters.assigned_to);
      }
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      return (data || []) as Lead[];
    } catch (error) {
      console.error('Error fetching leads:', error);
      throw error;
    }
  }

  static async createLead(lead: Omit<Lead, 'id' | 'created_at' | 'updated_at'>): Promise<Lead> {
    try {
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
      return data as Lead;
    } catch (error) {
      console.error('Error creating lead:', error);
      throw error;
    }
  }

  static async updateLead(id: string, updates: Partial<Lead>): Promise<Lead> {
    try {
      const { data, error } = await supabase
        .from('crm_leads')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Lead;
    } catch (error) {
      console.error('Error updating lead:', error);
      throw error;
    }
  }

  static async deleteLead(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('crm_leads')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting lead:', error);
      throw error;
    }
  }

  // =====================================================
  // CONTACT MANAGEMENT
  // =====================================================

  static async getContacts(filters?: {
    account_id?: string;
    status?: string;
    limit?: number;
  }): Promise<Contact[]> {
    try {
      let query = supabase
        .from('crm_contacts')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.account_id) {
        query = query.eq('account_id', filters.account_id);
      }
      if (filters?.status) {
        query = query.eq('contact_status', filters.status);
      }
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      return (data || []) as Contact[];
    } catch (error) {
      console.error('Error fetching contacts:', error);
      throw error;
    }
  }

  static async createContact(contact: Omit<Contact, 'id' | 'created_at' | 'updated_at'>): Promise<Contact> {
    try {
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
      return data as Contact;
    } catch (error) {
      console.error('Error creating contact:', error);
      throw error;
    }
  }

  static async updateContact(id: string, updates: Partial<Contact>): Promise<Contact> {
    try {
      const { data, error } = await supabase
        .from('crm_contacts')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Contact;
    } catch (error) {
      console.error('Error updating contact:', error);
      throw error;
    }
  }

  static async deleteContact(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('crm_contacts')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting contact:', error);
      throw error;
    }
  }

  // =====================================================
  // ACCOUNT MANAGEMENT
  // =====================================================

  static async getAccounts(filters?: {
    account_type?: string;
    status?: string;
    assigned_to?: string;
    limit?: number;
  }): Promise<Account[]> {
    try {
      let query = supabase
        .from('crm_accounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.account_type) {
        query = query.eq('account_type', filters.account_type);
      }
      if (filters?.status) {
        query = query.eq('account_status', filters.status);
      }
      if (filters?.assigned_to) {
        query = query.eq('assigned_to', filters.assigned_to);
      }
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      return (data || []) as Account[];
    } catch (error) {
      console.error('Error fetching accounts:', error);
      throw error;
    }
  }

  static async createAccount(account: Omit<Account, 'id' | 'created_at' | 'updated_at'>): Promise<Account> {
    try {
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
      return data as Account;
    } catch (error) {
      console.error('Error creating account:', error);
      throw error;
    }
  }

  static async updateAccount(id: string, updates: Partial<Account>): Promise<Account> {
    try {
      const { data, error } = await supabase
        .from('crm_accounts')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Account;
    } catch (error) {
      console.error('Error updating account:', error);
      throw error;
    }
  }

  static async deleteAccount(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('crm_accounts')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  }

  // =====================================================
  // OPPORTUNITY MANAGEMENT
  // =====================================================

  static async getOpportunities(filters?: {
    stage?: string;
    assigned_to?: string;
    account_id?: string;
    limit?: number;
  }): Promise<Opportunity[]> {
    try {
      let query = supabase
        .from('crm_opportunities')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.stage) {
        query = query.eq('stage', filters.stage);
      }
      if (filters?.assigned_to) {
        query = query.eq('assigned_to', filters.assigned_to);
      }
      if (filters?.account_id) {
        query = query.eq('account_id', filters.account_id);
      }
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      return (data || []) as Opportunity[];
    } catch (error) {
      console.error('Error fetching opportunities:', error);
      throw error;
    }
  }

  static async createOpportunity(opportunity: Omit<Opportunity, 'id' | 'created_at' | 'updated_at'>): Promise<Opportunity> {
    try {
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
      return data as Opportunity;
    } catch (error) {
      console.error('Error creating opportunity:', error);
      throw error;
    }
  }

  static async updateOpportunity(id: string, updates: Partial<Opportunity>): Promise<Opportunity> {
    try {
      const { data, error } = await supabase
        .from('crm_opportunities')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Opportunity;
    } catch (error) {
      console.error('Error updating opportunity:', error);
      throw error;
    }
  }

  static async deleteOpportunity(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('crm_opportunities')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting opportunity:', error);
      throw error;
    }
  }

  // =====================================================
  // ACTIVITY MANAGEMENT
  // =====================================================

  static async getActivities(filters?: {
    lead_id?: string;
    opportunity_id?: string;
    contact_id?: string;
    account_id?: string;
    activity_type?: string;
    limit?: number;
  }): Promise<Activity[]> {
    try {
      let query = supabase
        .from('crm_activities')
        .select('*')
        .order('activity_date', { ascending: false });

      if (filters?.lead_id) {
        query = query.eq('lead_id', filters.lead_id);
      }
      if (filters?.opportunity_id) {
        query = query.eq('opportunity_id', filters.opportunity_id);
      }
      if (filters?.contact_id) {
        query = query.eq('contact_id', filters.contact_id);
      }
      if (filters?.account_id) {
        query = query.eq('account_id', filters.account_id);
      }
      if (filters?.activity_type) {
        query = query.eq('activity_type', filters.activity_type);
      }
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      return (data || []) as Activity[];
    } catch (error) {
      console.error('Error fetching activities:', error);
      throw error;
    }
  }

  static async createActivity(activity: Omit<Activity, 'id' | 'created_at' | 'updated_at'>): Promise<Activity> {
    try {
      const { data, error } = await supabase
        .from('crm_activities')
        .insert({
          ...activity,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data as Activity;
    } catch (error) {
      console.error('Error creating activity:', error);
      throw error;
    }
  }

  static async updateActivity(id: string, updates: Partial<Activity>): Promise<Activity> {
    try {
      const { data, error } = await supabase
        .from('crm_activities')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Activity;
    } catch (error) {
      console.error('Error updating activity:', error);
      throw error;
    }
  }

  static async deleteActivity(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('crm_activities')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting activity:', error);
      throw error;
    }
  }

  // =====================================================
  // EMAIL CAMPAIGN MANAGEMENT (REAL IMPLEMENTATION)
  // =====================================================

  static async getEmailCampaigns(filters?: {
    status?: string;
    campaign_type?: string;
    limit?: number;
  }): Promise<EmailCampaign[]> {
    try {
      let query = supabase
        .from('email_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.campaign_type) {
        query = query.eq('campaign_type', filters.campaign_type);
      }
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      return (data || []).map(campaign => ({
        ...campaign,
        created_at: new Date(campaign.created_at),
        updated_at: new Date(campaign.updated_at),
        send_date: campaign.send_date ? new Date(campaign.send_date) : undefined
      })) as EmailCampaign[];
    } catch (error) {
      console.error('Error fetching email campaigns:', error);
      throw error;
    }
  }

  static async createEmailCampaign(campaign: Omit<EmailCampaign, 'id' | 'created_at' | 'updated_at'>): Promise<EmailCampaign> {
    try {
      const campaignData = {
        ...campaign,
        send_date: campaign.send_date?.toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('email_campaigns')
        .insert(campaignData)
        .select()
        .single();

      if (error) throw error;
      
      return {
        ...data,
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at),
        send_date: data.send_date ? new Date(data.send_date) : undefined
      } as EmailCampaign;
    } catch (error) {
      console.error('Error creating email campaign:', error);
      throw error;
    }
  }

  static async updateEmailCampaign(id: string, updates: Partial<EmailCampaign>): Promise<EmailCampaign> {
    try {
      const updateData: any = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      // Handle date conversion properly
      if (updates.send_date) {
        updateData.send_date = updates.send_date.toISOString();
      }
      if (updates.created_at) {
        updateData.created_at = updates.created_at instanceof Date ? updates.created_at.toISOString() : updates.created_at;
      }

      const { data, error } = await supabase
        .from('email_campaigns')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      return {
        ...data,
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at),
        send_date: data.send_date ? new Date(data.send_date) : undefined
      } as EmailCampaign;
    } catch (error) {
      console.error('Error updating email campaign:', error);
      throw error;
    }
  }

  static async deleteEmailCampaign(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('email_campaigns')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting email campaign:', error);
      throw error;
    }
  }

  // =====================================================
  // REAL CAMPAIGN PERFORMANCE (NO MORE MOCK DATA)
  // =====================================================

  static async getCampaignPerformanceSummary(): Promise<{
    totalCampaigns: number;
    activeCampaigns: number;
    totalRecipients: number;
    averageOpenRate: number;
    averageClickRate: number;
    totalRevenue: number;
  }> {
    try {
      // Get real campaign data
      const { data: campaigns, error: campaignsError } = await supabase
        .from('email_campaigns')
        .select('*');

      if (campaignsError) throw campaignsError;

      // Get real metrics data
      const { data: metrics, error: metricsError } = await supabase
        .from('campaign_metrics')
        .select('*');

      if (metricsError) throw metricsError;

      const totalCampaigns = campaigns?.length || 0;
      const activeCampaigns = campaigns?.filter(c => c.status === 'sending' || c.status === 'scheduled').length || 0;
      const totalRecipients = campaigns?.reduce((sum, c) => sum + (c.total_recipients || 0), 0) || 0;
      
      // Calculate real averages
      const validMetrics = metrics?.filter(m => m.sent_count > 0) || [];
      const averageOpenRate = validMetrics.length > 0 
        ? validMetrics.reduce((sum, m) => sum + (m.open_rate || 0), 0) / validMetrics.length 
        : 0;
      const averageClickRate = validMetrics.length > 0 
        ? validMetrics.reduce((sum, m) => sum + (m.click_rate || 0), 0) / validMetrics.length 
        : 0;
      
      const totalRevenue = campaigns?.reduce((sum, c) => sum + ((c as any).revenue_attributed || 0), 0) || 0;

      return {
        totalCampaigns,
        activeCampaigns,
        totalRecipients,
        averageOpenRate: Math.round(averageOpenRate * 100) / 100,
        averageClickRate: Math.round(averageClickRate * 100) / 100,
        totalRevenue
      };
    } catch (error) {
      console.error('Error fetching campaign performance summary:', error);
      // Return zeros instead of mock data on error
      return {
        totalCampaigns: 0,
        activeCampaigns: 0,
        totalRecipients: 0,
        averageOpenRate: 0,
        averageClickRate: 0,
        totalRevenue: 0
      };
    }
  }

  // =====================================================
  // CRM STATISTICS (REAL DATA)
  // =====================================================

  static async getCRMStats(): Promise<CRMStats> {
    try {
      const [leadsResult, opportunitiesResult, activitiesResult] = await Promise.all([
        supabase.from('crm_leads').select('*', { count: 'exact' }),
        supabase.from('crm_opportunities').select('*', { count: 'exact' }),
        supabase.from('crm_activities').select('*', { count: 'exact' })
      ]);

      // Calculate pipeline value
      const { data: opportunities } = await supabase
        .from('crm_opportunities')
        .select('estimated_value, stage')
        .neq('stage', 'closed_lost');

      const totalPipelineValue = opportunities?.reduce((sum, opp) => sum + (opp.estimated_value || 0), 0) || 0;

      // Calculate conversion rate
      const { data: convertedLeads } = await supabase
        .from('crm_leads')
        .select('*', { count: 'exact' })
        .eq('lead_status', 'converted');

      const conversionRate = leadsResult.count && leadsResult.count > 0 
        ? Math.round(((convertedLeads?.length || 0) / leadsResult.count) * 100 * 100) / 100
        : 0;

      // Calculate win rate
      const { data: wonOpportunities } = await supabase
        .from('crm_opportunities')
        .select('*', { count: 'exact' })
        .eq('stage', 'closed_won');

      const winRate = opportunitiesResult.count && opportunitiesResult.count > 0
        ? Math.round(((wonOpportunities?.length || 0) / opportunitiesResult.count) * 100 * 100) / 100
        : 0;

      // Calculate average deal size
      const { data: closedWonOpps } = await supabase
        .from('crm_opportunities')
        .select('estimated_value')
        .eq('stage', 'closed_won');

      const averageDealSize = closedWonOpps && closedWonOpps.length > 0
        ? closedWonOpps.reduce((sum, opp) => sum + (opp.estimated_value || 0), 0) / closedWonOpps.length
        : 0;

      return {
        total_leads: leadsResult.count || 0,
        total_opportunities: opportunitiesResult.count || 0,
        total_pipeline_value: totalPipelineValue,
        total_activities: activitiesResult.count || 0,
        conversion_rate: conversionRate,
        win_rate: winRate,
        average_deal_size: Math.round(averageDealSize * 100) / 100
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

  // =====================================================
  // GLOBAL SEARCH
  // =====================================================

  static async globalSearch(searchTerm: string): Promise<{
    leads: Lead[];
    contacts: Contact[];
    accounts: Account[];
    opportunities: Opportunity[];
  }> {
    try {
      const [leadsResult, contactsResult, accountsResult, opportunitiesResult] = await Promise.all([
        supabase
          .from('crm_leads')
          .select('*')
          .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,company_name.ilike.%${searchTerm}%`)
          .limit(10),
        supabase
          .from('crm_contacts')
          .select('*')
          .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
          .limit(10),
        supabase
          .from('crm_accounts')
          .select('*')
          .ilike('account_name', `%${searchTerm}%`)
          .limit(10),
        supabase
          .from('crm_opportunities')
          .select('*')
          .or(`opportunity_name.ilike.%${searchTerm}%,account_name.ilike.%${searchTerm}%`)
          .limit(10)
      ]);

      return {
        leads: (leadsResult.data || []) as Lead[],
        contacts: (contactsResult.data || []) as Contact[],
        accounts: (accountsResult.data || []) as Account[],
        opportunities: (opportunitiesResult.data || []) as Opportunity[]
      };
    } catch (error) {
      console.error('Error performing global search:', error);
      return {
        leads: [],
        contacts: [],
        accounts: [],
        opportunities: []
      };
    }
  }

  // =====================================================
  // UPCOMING TASKS
  // =====================================================

  static async getUpcomingTasks(): Promise<Activity[]> {
    try {
      const { data, error } = await supabase
        .from('crm_activities')
        .select('*')
        .eq('activity_type', 'task')
        .eq('completed', false)
        .not('due_date', 'is', null)
        .gte('due_date', new Date().toISOString())
        .order('due_date', { ascending: true })
        .limit(10);

      if (error) throw error;
      return (data || []) as Activity[];
    } catch (error) {
      console.error('Error fetching upcoming tasks:', error);
      return [];
    }
  }
}

// Export as default and named export for compatibility
export default UnifiedCRMService;
export { UnifiedCRMService as CRMService };