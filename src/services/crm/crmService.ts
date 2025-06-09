
import { supabase } from '@/integrations/supabase/client';
import { Activity, Account, Lead, Opportunity, Contact } from '@/types/crm';

export class CRMService {
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
}
