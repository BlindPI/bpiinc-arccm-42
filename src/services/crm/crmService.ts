
import { supabase } from '@/integrations/supabase/client';
import type { Lead, Contact, Account, Opportunity, Activity, CRMStats } from '@/types/crm';

interface AccountFilters {
  account_type?: string;
}

// Type guards for safe casting
const isValidLeadStatus = (status: string): status is 'new' | 'contacted' | 'qualified' | 'converted' | 'lost' => {
  return ['new', 'contacted', 'qualified', 'converted', 'lost'].includes(status);
};

const isValidContactStatus = (status: string): status is 'active' | 'inactive' => {
  return ['active', 'inactive'].includes(status);
};

const isValidAccountType = (type: string): type is 'prospect' | 'customer' | 'partner' | 'competitor' => {
  return ['prospect', 'customer', 'partner', 'competitor'].includes(type);
};

const isValidOpportunityStage = (stage: string): stage is 'prospect' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost' => {
  return ['prospect', 'proposal', 'negotiation', 'closed_won', 'closed_lost'].includes(stage);
};

export class CRMService {
  // Lead Management
  static async getLeads(): Promise<Lead[]> {
    const { data, error } = await supabase
      .from('crm_leads')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return (data || []).map(lead => ({
      ...lead,
      lead_status: isValidLeadStatus(lead.lead_status) ? lead.lead_status : 'new',
      lead_source: lead.lead_source || 'other'
    })) as Lead[];
  }

  static async createLead(lead: Omit<Lead, 'id' | 'created_at' | 'updated_at'>): Promise<Lead> {
    const { data, error } = await supabase
      .from('crm_leads')
      .insert(lead)
      .select()
      .single();
    
    if (error) throw error;
    return {
      ...data,
      lead_status: isValidLeadStatus(data.lead_status) ? data.lead_status : 'new'
    } as Lead;
  }

  static async updateLead(id: string, updates: Partial<Lead>): Promise<void> {
    const { error } = await supabase
      .from('crm_leads')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);
    
    if (error) throw error;
  }

  static async deleteLead(id: string): Promise<void> {
    const { error } = await supabase
      .from('crm_leads')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Contact Management
  static async getContacts(): Promise<Contact[]> {
    const { data, error } = await supabase
      .from('crm_contacts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return (data || []).map(contact => ({
      ...contact,
      contact_status: isValidContactStatus(contact.contact_status) ? contact.contact_status : 'active'
    })) as Contact[];
  }

  static async createContact(contact: Omit<Contact, 'id' | 'created_at' | 'updated_at'>): Promise<Contact> {
    const { data, error } = await supabase
      .from('crm_contacts')
      .insert(contact)
      .select()
      .single();
    
    if (error) throw error;
    return {
      ...data,
      contact_status: isValidContactStatus(data.contact_status) ? data.contact_status : 'active'
    } as Contact;
  }

  static async updateContact(id: string, updates: Partial<Contact>): Promise<void> {
    const { error } = await supabase
      .from('crm_contacts')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);
    
    if (error) throw error;
  }

  static async deleteContact(id: string): Promise<void> {
    const { error } = await supabase
      .from('crm_contacts')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Account Management
  static async getAccounts(filters?: AccountFilters): Promise<Account[]> {
    let query = supabase
      .from('crm_accounts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (filters?.account_type) {
      query = query.eq('account_type', filters.account_type);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return (data || []).map(account => ({
      ...account,
      account_type: isValidAccountType(account.account_type) ? account.account_type : 'prospect',
      account_status: account.account_status || 'active'
    })) as Account[];
  }

  static async createAccount(account: Omit<Account, 'id' | 'created_at' | 'updated_at'>): Promise<Account> {
    const { data, error } = await supabase
      .from('crm_accounts')
      .insert(account)
      .select()
      .single();
    
    if (error) throw error;
    return {
      ...data,
      account_type: isValidAccountType(data.account_type) ? data.account_type : 'prospect'
    } as Account;
  }

  static async updateAccount(id: string, updates: Partial<Account>): Promise<void> {
    const { error } = await supabase
      .from('crm_accounts')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  }

  static async deleteAccount(id: string): Promise<void> {
    const { error } = await supabase
      .from('crm_accounts')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Opportunity Management
  static async getOpportunities(): Promise<Opportunity[]> {
    const { data, error } = await supabase
      .from('crm_opportunities')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return (data || []).map(opportunity => ({
      ...opportunity,
      stage: isValidOpportunityStage(opportunity.stage) ? opportunity.stage : 'prospect',
      opportunity_status: opportunity.opportunity_status || 'open'
    })) as Opportunity[];
  }

  static async createOpportunity(opportunity: Omit<Opportunity, 'id' | 'created_at' | 'updated_at'>): Promise<Opportunity> {
    const { data, error } = await supabase
      .from('crm_opportunities')
      .insert(opportunity)
      .select()
      .single();
    
    if (error) throw error;
    return {
      ...data,
      stage: isValidOpportunityStage(data.stage) ? data.stage : 'prospect'
    } as Opportunity;
  }

  static async updateOpportunity(id: string, updates: Partial<Opportunity>): Promise<void> {
    const { error } = await supabase
      .from('crm_opportunities')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  }

  static async deleteOpportunity(id: string): Promise<void> {
    const { error } = await supabase
      .from('crm_opportunities')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Activity Management
  static async getActivities(): Promise<Activity[]> {
    const { data, error } = await supabase
      .from('crm_activities')
      .select('*')
      .order('activity_date', { ascending: false });
    
    if (error) throw error;
    return (data || []) as Activity[];
  }

  static async createActivity(activity: Omit<Activity, 'id' | 'created_at' | 'updated_at'>): Promise<Activity> {
    const { data, error } = await supabase
      .from('crm_activities')
      .insert(activity)
      .select()
      .single();
    
    if (error) throw error;
    return data as Activity;
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

  // CRM Statistics
  static async getCRMStats(): Promise<CRMStats> {
    // For now, return mock data until we have proper aggregation functions
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
