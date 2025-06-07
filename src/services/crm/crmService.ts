
import { supabase } from '@/integrations/supabase/client';
import type { Lead, Opportunity, Contact, Account, Activity } from '@/types/crm';

export class CRMService {
  // Lead Management
  static async getLeads(): Promise<Lead[]> {
    try {
      const { data, error } = await supabase
        .from('crm_leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(lead => ({
        ...lead,
        lead_status: lead.lead_status as Lead['lead_status'],
        lead_source: lead.lead_source as Lead['lead_source']
      }));
    } catch (error) {
      console.error('Error fetching leads:', error);
      return [];
    }
  }

  static async getLeadById(id: string): Promise<Lead | null> {
    try {
      const { data, error } = await supabase
        .from('crm_leads')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data ? {
        ...data,
        lead_status: data.lead_status as Lead['lead_status'],
        lead_source: data.lead_source as Lead['lead_source']
      } : null;
    } catch (error) {
      console.error('Error fetching lead:', error);
      return null;
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
        lead_status: data.lead_status as Lead['lead_status'],
        lead_source: data.lead_source as Lead['lead_source']
      } : null;
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
      return data ? {
        ...data,
        lead_status: data.lead_status as Lead['lead_status'],
        lead_source: data.lead_source as Lead['lead_source']
      } : null;
    } catch (error) {
      console.error('Error updating lead:', error);
      return null;
    }
  }

  // Opportunity Management
  static async getOpportunities(): Promise<Opportunity[]> {
    try {
      const { data, error } = await supabase
        .from('crm_opportunities')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(opp => ({
        ...opp,
        stage: opp.stage as Opportunity['stage']
      }));
    } catch (error) {
      console.error('Error fetching opportunities:', error);
      return [];
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
        stage: data.stage as Opportunity['stage']
      } : null;
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
      return data ? {
        ...data,
        stage: data.stage as Opportunity['stage']
      } : null;
    } catch (error) {
      console.error('Error updating opportunity:', error);
      return null;
    }
  }

  // Contact Management
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

  static async createContact(contact: Omit<Contact, 'id' | 'created_at' | 'updated_at'>): Promise<Contact | null> {
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

  // Account Management
  static async getAccounts(filters?: any): Promise<Account[]> {
    try {
      let query = supabase
        .from('crm_accounts')
        .select('*')
        .order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching accounts:', error);
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

  static async deleteAccount(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('crm_accounts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting account:', error);
      return false;
    }
  }

  // Activity Management
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
        activity_type: activity.activity_type as Activity['activity_type']
      }));
    } catch (error) {
      console.error('Error fetching activities:', error);
      return [];
    }
  }

  static async createActivity(activity: Omit<Activity, 'id' | 'created_at' | 'updated_at'>): Promise<Activity | null> {
    try {
      const { data, error } = await supabase
        .from('crm_activities')
        .insert(activity)
        .select()
        .single();

      if (error) throw error;
      return data ? {
        ...data,
        activity_type: data.activity_type as Activity['activity_type']
      } : null;
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
      return data ? {
        ...data,
        activity_type: data.activity_type as Activity['activity_type']
      } : null;
    } catch (error) {
      console.error('Error updating activity:', error);
      return null;
    }
  }

  // Analytics
  static async getCRMStats() {
    try {
      const { data, error } = await supabase
        .from('crm_analytics_summary')
        .select('*')
        .single();

      if (error) throw error;
      return data || {
        total_leads: 0,
        total_opportunities: 0,
        total_pipeline_value: 0,
        total_activities: 0,
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
