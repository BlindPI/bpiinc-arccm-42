
import { supabase } from '@/integrations/supabase/client';
import { Activity, Account, Lead, Opportunity, Contact } from '@/types/crm';

export class CRMService {
  // Activities
  static async getActivities(filters?: {
    type?: string;
    completed?: boolean;
    lead_id?: string;
    contact_id?: string;
  }): Promise<Activity[]> {
    try {
      let query = supabase.from('crm_activities').select('*');
      
      if (filters?.type) query = query.eq('activity_type', filters.type);
      if (filters?.completed !== undefined) query = query.eq('completed', filters.completed);
      if (filters?.lead_id) query = query.eq('lead_id', filters.lead_id);
      if (filters?.contact_id) query = query.eq('contact_id', filters.contact_id);
      
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching activities:', error);
      return [];
    }
  }

  static async createActivity(activity: Partial<Activity>): Promise<Activity | null> {
    try {
      const { data, error } = await supabase
        .from('crm_activities')
        .insert(activity)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating activity:', error);
      return null;
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

  // Accounts
  static async getAccounts(filters?: {
    account_type?: string;
    status?: string;
  }): Promise<Account[]> {
    try {
      let query = supabase.from('crm_accounts').select('*');
      
      if (filters?.account_type) query = query.eq('account_type', filters.account_type);
      if (filters?.status) query = query.eq('account_status', filters.status);
      
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching accounts:', error);
      return [];
    }
  }

  static async createAccount(account: Partial<Account>): Promise<Account | null> {
    try {
      const { data, error } = await supabase
        .from('crm_accounts')
        .insert(account)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating account:', error);
      return null;
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

  // Leads
  static async getLeads(filters?: {
    status?: string;
    source?: string;
    assigned_to?: string;
  }): Promise<Lead[]> {
    try {
      let query = supabase.from('crm_leads').select('*');
      
      if (filters?.status) query = query.eq('lead_status', filters.status);
      if (filters?.source) query = query.eq('lead_source', filters.source);
      if (filters?.assigned_to) query = query.eq('assigned_to', filters.assigned_to);
      
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching leads:', error);
      return [];
    }
  }

  static async createLead(lead: Partial<Lead>): Promise<Lead | null> {
    try {
      const { data, error } = await supabase
        .from('crm_leads')
        .insert(lead)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating lead:', error);
      return null;
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

  // Opportunities
  static async getOpportunities(filters?: {
    stage?: string;
    status?: string;
  }): Promise<Opportunity[]> {
    try {
      let query = supabase.from('crm_opportunities').select('*');
      
      if (filters?.stage) query = query.eq('stage', filters.stage);
      if (filters?.status) query = query.eq('opportunity_status', filters.status);
      
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching opportunities:', error);
      return [];
    }
  }

  static async createOpportunity(opportunity: Partial<Opportunity>): Promise<Opportunity | null> {
    try {
      const { data, error } = await supabase
        .from('crm_opportunities')
        .insert(opportunity)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating opportunity:', error);
      return null;
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

  // Contacts
  static async getContacts(filters?: {
    status?: string;
    account_id?: string;
  }): Promise<Contact[]> {
    try {
      let query = supabase.from('crm_contacts').select('*');
      
      if (filters?.status) query = query.eq('contact_status', filters.status);
      if (filters?.account_id) query = query.eq('account_id', filters.account_id);
      
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching contacts:', error);
      return [];
    }
  }

  static async createContact(contact: Partial<Contact>): Promise<Contact | null> {
    try {
      const { data, error } = await supabase
        .from('crm_contacts')
        .insert(contact)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating contact:', error);
      return null;
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
}
