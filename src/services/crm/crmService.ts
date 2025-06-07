
import { supabase } from '@/integrations/supabase/client';

export interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  company: string;
  phone?: string;
  title?: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  lead_score: number;
  source: 'website' | 'referral' | 'social_media' | 'email' | 'cold_call' | 'trade_show' | 'other';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  title?: string;
  account_id?: string;
  contact_status?: string;
  converted_from_lead_id?: string;
  lead_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Account {
  id: string;
  account_name: string;
  account_type: string;
  industry?: string;
  website?: string;
  phone?: string;
  billing_address?: string;
  annual_revenue?: number;
  created_at: string;
  updated_at: string;
}

export interface Opportunity {
  id: string;
  name: string;
  account_name?: string;
  account_id?: string;
  value: number;
  stage: 'prospect' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
  probability: number;
  close_date?: string;
  description?: string;
  lead_id?: string;
  opportunity_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: string;
  type: 'call' | 'email' | 'meeting' | 'task' | 'note';
  subject: string;
  description?: string;
  due_date?: string;
  completed: boolean;
  lead_id?: string;
  opportunity_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CRMStats {
  totalLeads: number;
  totalOpportunities: number;
  pipelineValue: number;
  totalActivities: number;
}

export class CRMService {
  static async getCRMStats(): Promise<CRMStats> {
    try {
      const [leadsResult, opportunitiesResult, activitiesResult] = await Promise.all([
        supabase.from('crm_leads').select('id', { count: 'exact' }),
        supabase.from('crm_opportunities').select('id, estimated_value'),
        supabase.from('crm_activities').select('id', { count: 'exact' })
      ]);

      const totalLeads = leadsResult.count || 0;
      const totalOpportunities = opportunitiesResult.data?.length || 0;
      const totalActivities = activitiesResult.count || 0;
      
      const pipelineValue = opportunitiesResult.data?.reduce(
        (sum, opp) => sum + (opp.estimated_value || 0), 
        0
      ) || 0;

      return {
        totalLeads,
        totalOpportunities,
        pipelineValue,
        totalActivities
      };
    } catch (error) {
      console.error('Error fetching CRM stats:', error);
      return {
        totalLeads: 0,
        totalOpportunities: 0,
        pipelineValue: 0,
        totalActivities: 0
      };
    }
  }

  // Leads methods
  static async getLeads(): Promise<Lead[]> {
    try {
      const { data, error } = await supabase
        .from('crm_leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data?.map(lead => ({
        id: lead.id,
        first_name: lead.first_name || '',
        last_name: lead.last_name || '',
        email: lead.email || '',
        company: lead.company_name || '',
        phone: lead.phone || '',
        title: lead.job_title || '',
        status: lead.lead_status || 'new',
        lead_score: lead.lead_score || 0,
        source: lead.lead_source || 'unknown',
        notes: lead.notes || '',
        created_at: lead.created_at || '',
        updated_at: lead.updated_at || ''
      })) || [];
    } catch (error) {
      console.error('Error fetching leads:', error);
      return [];
    }
  }

  static async createLead(leadData: Omit<Lead, 'id' | 'created_at' | 'updated_at'>): Promise<Lead> {
    try {
      const { data, error } = await supabase
        .from('crm_leads')
        .insert({
          first_name: leadData.first_name,
          last_name: leadData.last_name,
          email: leadData.email,
          company_name: leadData.company,
          phone: leadData.phone,
          job_title: leadData.title,
          lead_status: leadData.status,
          lead_score: leadData.lead_score,
          lead_source: leadData.source,
          notes: leadData.notes
        })
        .select()
        .single();

      if (error) throw error;
      return this.mapLeadFromDB(data);
    } catch (error) {
      console.error('Error creating lead:', error);
      throw error;
    }
  }

  static async updateLead(id: string, leadData: Partial<Lead>): Promise<Lead> {
    try {
      const { data, error } = await supabase
        .from('crm_leads')
        .update({
          first_name: leadData.first_name,
          last_name: leadData.last_name,
          email: leadData.email,
          company_name: leadData.company,
          phone: leadData.phone,
          job_title: leadData.title,
          lead_status: leadData.status,
          lead_score: leadData.lead_score,
          lead_source: leadData.source,
          notes: leadData.notes
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return this.mapLeadFromDB(data);
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

  // Opportunities methods
  static async getOpportunities(): Promise<Opportunity[]> {
    try {
      const { data, error } = await supabase
        .from('crm_opportunities')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data?.map(opp => ({
        id: opp.id,
        name: opp.opportunity_name || '',
        account_name: opp.account_name || '',
        account_id: opp.account_id || '',
        value: opp.estimated_value || 0,
        stage: opp.opportunity_stage || 'prospect',
        probability: opp.probability || 0,
        close_date: opp.expected_close_date || '',
        description: opp.description || '',
        lead_id: opp.lead_id || '',
        opportunity_id: opp.id,
        created_at: opp.created_at || '',
        updated_at: opp.updated_at || ''
      })) || [];
    } catch (error) {
      console.error('Error fetching opportunities:', error);
      return [];
    }
  }

  static async createOpportunity(oppData: Omit<Opportunity, 'id' | 'created_at' | 'updated_at'>): Promise<Opportunity> {
    try {
      const { data, error } = await supabase
        .from('crm_opportunities')
        .insert({
          opportunity_name: oppData.name,
          account_name: oppData.account_name,
          account_id: oppData.account_id,
          estimated_value: oppData.value,
          opportunity_stage: oppData.stage,
          probability: oppData.probability,
          expected_close_date: oppData.close_date,
          description: oppData.description,
          lead_id: oppData.lead_id
        })
        .select()
        .single();

      if (error) throw error;
      return this.mapOpportunityFromDB(data);
    } catch (error) {
      console.error('Error creating opportunity:', error);
      throw error;
    }
  }

  static async updateOpportunity(id: string, oppData: Partial<Opportunity>): Promise<Opportunity> {
    try {
      const { data, error } = await supabase
        .from('crm_opportunities')
        .update({
          opportunity_name: oppData.name,
          account_name: oppData.account_name,
          account_id: oppData.account_id,
          estimated_value: oppData.value,
          opportunity_stage: oppData.stage,
          probability: oppData.probability,
          expected_close_date: oppData.close_date,
          description: oppData.description
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return this.mapOpportunityFromDB(data);
    } catch (error) {
      console.error('Error updating opportunity:', error);
      throw error;
    }
  }

  // Activities methods
  static async getActivities(filters?: { completed?: boolean; type?: string }): Promise<Activity[]> {
    try {
      let query = supabase
        .from('crm_activities')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.completed !== undefined) {
        query = query.eq('completed', filters.completed);
      }

      if (filters?.type && filters.type !== 'all') {
        query = query.eq('activity_type', filters.type);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data?.map(activity => ({
        id: activity.id,
        type: activity.activity_type || 'task',
        subject: activity.subject || '',
        description: activity.description || '',
        due_date: activity.due_date || '',
        completed: activity.completed || false,
        lead_id: activity.lead_id || '',
        opportunity_id: activity.opportunity_id || '',
        created_at: activity.created_at || '',
        updated_at: activity.updated_at || ''
      })) || [];
    } catch (error) {
      console.error('Error fetching activities:', error);
      return [];
    }
  }

  static async createActivity(activityData: Omit<Activity, 'id' | 'created_at' | 'updated_at'>): Promise<Activity> {
    try {
      const { data, error } = await supabase
        .from('crm_activities')
        .insert({
          activity_type: activityData.type,
          subject: activityData.subject,
          description: activityData.description,
          due_date: activityData.due_date,
          completed: activityData.completed,
          lead_id: activityData.lead_id,
          opportunity_id: activityData.opportunity_id
        })
        .select()
        .single();

      if (error) throw error;
      return this.mapActivityFromDB(data);
    } catch (error) {
      console.error('Error creating activity:', error);
      throw error;
    }
  }

  static async updateActivity(id: string, activityData: Partial<Activity>): Promise<Activity> {
    try {
      const { data, error } = await supabase
        .from('crm_activities')
        .update({
          activity_type: activityData.type,
          subject: activityData.subject,
          description: activityData.description,
          due_date: activityData.due_date,
          completed: activityData.completed
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return this.mapActivityFromDB(data);
    } catch (error) {
      console.error('Error updating activity:', error);
      throw error;
    }
  }

  // Contacts methods
  static async getContacts(): Promise<Contact[]> {
    try {
      const { data, error } = await supabase
        .from('crm_contacts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data?.map(contact => ({
        id: contact.id,
        first_name: contact.first_name || '',
        last_name: contact.last_name || '',
        email: contact.email || '',
        phone: contact.phone || '',
        title: contact.title || '',
        account_id: contact.account_id || '',
        contact_status: contact.contact_status || '',
        converted_from_lead_id: contact.converted_from_lead_id || '',
        lead_id: contact.converted_from_lead_id || '',
        created_at: contact.created_at || '',
        updated_at: contact.updated_at || ''
      })) || [];
    } catch (error) {
      console.error('Error fetching contacts:', error);
      return [];
    }
  }

  // Accounts methods
  static async getAccounts(): Promise<Account[]> {
    try {
      const { data, error } = await supabase
        .from('crm_accounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data?.map(account => ({
        id: account.id,
        account_name: account.account_name || '',
        account_type: account.account_type || '',
        industry: account.industry || '',
        website: account.website || '',
        phone: account.phone || '',
        billing_address: account.billing_address || '',
        annual_revenue: account.annual_revenue || 0,
        created_at: account.created_at || '',
        updated_at: account.updated_at || ''
      })) || [];
    } catch (error) {
      console.error('Error fetching accounts:', error);
      return [];
    }
  }

  static async createAccount(accountData: Omit<Account, 'id' | 'created_at' | 'updated_at'>): Promise<Account> {
    try {
      const { data, error } = await supabase
        .from('crm_accounts')
        .insert({
          account_name: accountData.account_name,
          account_type: accountData.account_type,
          industry: accountData.industry,
          website: accountData.website,
          phone: accountData.phone,
          billing_address: accountData.billing_address,
          annual_revenue: accountData.annual_revenue
        })
        .select()
        .single();

      if (error) throw error;
      return this.mapAccountFromDB(data);
    } catch (error) {
      console.error('Error creating account:', error);
      throw error;
    }
  }

  static async updateAccount(id: string, accountData: Partial<Account>): Promise<Account> {
    try {
      const { data, error } = await supabase
        .from('crm_accounts')
        .update({
          account_name: accountData.account_name,
          account_type: accountData.account_type,
          industry: accountData.industry,
          website: accountData.website,
          phone: accountData.phone,
          billing_address: accountData.billing_address,
          annual_revenue: accountData.annual_revenue
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return this.mapAccountFromDB(data);
    } catch (error) {
      console.error('Error updating account:', error);
      throw error;
    }
  }

  // Helper mapping methods
  private static mapLeadFromDB(data: any): Lead {
    return {
      id: data.id,
      first_name: data.first_name || '',
      last_name: data.last_name || '',
      email: data.email || '',
      company: data.company_name || '',
      phone: data.phone || '',
      title: data.job_title || '',
      status: data.lead_status || 'new',
      lead_score: data.lead_score || 0,
      source: data.lead_source || 'unknown',
      notes: data.notes || '',
      created_at: data.created_at || '',
      updated_at: data.updated_at || ''
    };
  }

  private static mapOpportunityFromDB(data: any): Opportunity {
    return {
      id: data.id,
      name: data.opportunity_name || '',
      account_name: data.account_name || '',
      account_id: data.account_id || '',
      value: data.estimated_value || 0,
      stage: data.opportunity_stage || 'prospect',
      probability: data.probability || 0,
      close_date: data.expected_close_date || '',
      description: data.description || '',
      lead_id: data.lead_id || '',
      opportunity_id: data.id,
      created_at: data.created_at || '',
      updated_at: data.updated_at || ''
    };
  }

  private static mapActivityFromDB(data: any): Activity {
    return {
      id: data.id,
      type: data.activity_type || 'task',
      subject: data.subject || '',
      description: data.description || '',
      due_date: data.due_date || '',
      completed: data.completed || false,
      lead_id: data.lead_id || '',
      opportunity_id: data.opportunity_id || '',
      created_at: data.created_at || '',
      updated_at: data.updated_at || ''
    };
  }

  private static mapAccountFromDB(data: any): Account {
    return {
      id: data.id,
      account_name: data.account_name || '',
      account_type: data.account_type || '',
      industry: data.industry || '',
      website: data.website || '',
      phone: data.phone || '',
      billing_address: data.billing_address || '',
      annual_revenue: data.annual_revenue || 0,
      created_at: data.created_at || '',
      updated_at: data.updated_at || ''
    };
  }
}
