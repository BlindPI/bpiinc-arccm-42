
import { supabase } from '@/integrations/supabase/client';
import type { Lead, Contact, Account, Opportunity, Activity, CRMStats } from '@/types/crm';

// Simplified type helpers to avoid infinite recursion
const safeCastToLead = (data: any): Lead => ({
  ...data,
  lead_status: data.lead_status as 'new' | 'contacted' | 'qualified' | 'converted' | 'lost',
  lead_source: data.lead_source as 'website' | 'referral' | 'social_media' | 'email' | 'cold_call' | 'trade_show' | 'other',
  lead_type: data.lead_type as 'individual' | 'corporate',
  training_urgency: data.training_urgency as 'immediate' | 'within_month' | 'within_quarter' | 'planning',
  preferred_training_format: data.preferred_training_format as 'in_person' | 'virtual' | 'blended' | 'self_paced'
});

const safeCastToContact = (data: any): Contact => ({
  ...data,
  contact_status: data.contact_status as 'active' | 'inactive' | 'bounced',
  preferred_contact_method: data.preferred_contact_method as 'email' | 'phone' | 'mobile'
});

const safeCastToAccount = (data: any): Account => ({
  ...data,
  account_type: data.account_type as 'prospect' | 'customer' | 'partner' | 'competitor',
  account_status: data.account_status || 'active'
});

const safeCastToOpportunity = (data: any): Opportunity => ({
  ...data,
  stage: data.stage as 'prospect' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost',
  opportunity_status: data.opportunity_status as 'open' | 'closed'
});

const safeCastToActivity = (data: any): Activity => ({
  ...data,
  activity_type: data.activity_type as 'call' | 'email' | 'meeting' | 'task' | 'note'
});

// Core CRM Service
export class CRMService {
  // Leads
  static async getLeads(): Promise<Lead[]> {
    try {
      const { data, error } = await supabase
        .from('crm_leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(safeCastToLead);
    } catch (error) {
      console.error('Error fetching leads:', error);
      return [];
    }
  }

  static async createLead(leadData: Omit<Lead, 'id' | 'created_at' | 'updated_at'>): Promise<Lead> {
    try {
      const { data, error } = await supabase
        .from('crm_leads')
        .insert(leadData)
        .select()
        .single();

      if (error) throw error;
      return safeCastToLead(data);
    } catch (error) {
      console.error('Error creating lead:', error);
      throw error;
    }
  }

  static async updateLead(id: string, leadData: Partial<Lead>): Promise<Lead> {
    try {
      const { data, error } = await supabase
        .from('crm_leads')
        .update(leadData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return safeCastToLead(data);
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

  // Contacts
  static async getContacts(filters?: { account_id?: string; contact_status?: string }): Promise<Contact[]> {
    try {
      let query = supabase
        .from('crm_contacts')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.contact_status) {
        query = query.eq('contact_status', filters.contact_status);
      }
      if (filters?.account_id) {
        query = query.eq('account_id', filters.account_id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(safeCastToContact);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      return [];
    }
  }

  static async createContact(contactData: Omit<Contact, 'id' | 'created_at' | 'updated_at'>): Promise<Contact> {
    try {
      const { data, error } = await supabase
        .from('crm_contacts')
        .insert(contactData)
        .select()
        .single();

      if (error) throw error;
      return safeCastToContact(data);
    } catch (error) {
      console.error('Error creating contact:', error);
      throw error;
    }
  }

  static async updateContact(id: string, contactData: Partial<Contact>): Promise<Contact> {
    try {
      const { data, error } = await supabase
        .from('crm_contacts')
        .update(contactData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return safeCastToContact(data);
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

  // Accounts
  static async getAccounts(filters?: { account_type?: string; industry?: string; assigned_to?: string }): Promise<Account[]> {
    try {
      let query = supabase
        .from('crm_accounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.account_type) {
        query = query.eq('account_type', filters.account_type);
      }
      if (filters?.industry) {
        query = query.eq('industry', filters.industry);
      }
      if (filters?.assigned_to) {
        query = query.eq('assigned_to', filters.assigned_to);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(safeCastToAccount);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      return [];
    }
  }

  static async createAccount(accountData: Omit<Account, 'id' | 'created_at' | 'updated_at'>): Promise<Account> {
    try {
      const { data, error } = await supabase
        .from('crm_accounts')
        .insert(accountData)
        .select()
        .single();

      if (error) throw error;
      return safeCastToAccount(data);
    } catch (error) {
      console.error('Error creating account:', error);
      throw error;
    }
  }

  static async updateAccount(id: string, accountData: Partial<Account>): Promise<Account> {
    try {
      const { data, error } = await supabase
        .from('crm_accounts')
        .update(accountData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return safeCastToAccount(data);
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

  // Opportunities
  static async getOpportunities(filters?: { stage?: string; opportunity_status?: string; account_id?: string }): Promise<Opportunity[]> {
    try {
      let query = supabase
        .from('crm_opportunities')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.stage) {
        query = query.eq('stage', filters.stage);
      }
      if (filters?.opportunity_status) {
        query = query.eq('opportunity_status', filters.opportunity_status);
      }
      if (filters?.account_id) {
        query = query.eq('account_id', filters.account_id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(safeCastToOpportunity);
    } catch (error) {
      console.error('Error fetching opportunities:', error);
      return [];
    }
  }

  static async createOpportunity(oppData: Omit<Opportunity, 'id' | 'created_at' | 'updated_at'>): Promise<Opportunity> {
    try {
      const { data, error } = await supabase
        .from('crm_opportunities')
        .insert(oppData)
        .select()
        .single();

      if (error) throw error;
      return safeCastToOpportunity(data);
    } catch (error) {
      console.error('Error creating opportunity:', error);
      throw error;
    }
  }

  static async updateOpportunity(id: string, oppData: Partial<Opportunity>): Promise<Opportunity> {
    try {
      const { data, error } = await supabase
        .from('crm_opportunities')
        .update(oppData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return safeCastToOpportunity(data);
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

  // Activities
  static async getActivities(filters?: { type?: string; completed?: boolean; lead_id?: string; opportunity_id?: string }): Promise<Activity[]> {
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
      if (filters?.lead_id) {
        query = query.eq('lead_id', filters.lead_id);
      }
      if (filters?.opportunity_id) {
        query = query.eq('opportunity_id', filters.opportunity_id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(safeCastToActivity);
    } catch (error) {
      console.error('Error fetching activities:', error);
      return [];
    }
  }

  static async createActivity(activityData: Omit<Activity, 'id' | 'created_at' | 'updated_at'>): Promise<Activity> {
    try {
      const { data, error } = await supabase
        .from('crm_activities')
        .insert(activityData)
        .select()
        .single();

      if (error) throw error;
      return safeCastToActivity(data);
    } catch (error) {
      console.error('Error creating activity:', error);
      throw error;
    }
  }

  static async updateActivity(id: string, activityData: Partial<Activity>): Promise<Activity> {
    try {
      const { data, error } = await supabase
        .from('crm_activities')
        .update(activityData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return safeCastToActivity(data);
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

  // CRM Stats
  static async getCRMStats(): Promise<CRMStats> {
    try {
      const { data, error } = await supabase
        .from('crm_analytics_summary')
        .select('*')
        .single();

      if (error) throw error;

      return {
        totalLeads: Number(data.total_leads) || 0,
        totalOpportunities: Number(data.total_opportunities) || 0,
        pipelineValue: Number(data.total_pipeline_value) || 0,
        totalActivities: Number(data.total_activities) || 0,
        conversionRate: Number(data.conversion_rate) || 0,
        winRate: Number(data.win_rate) || 0,
        averageDealSize: Number(data.average_deal_size) || 0
      };
    } catch (error) {
      console.error('Error fetching CRM stats:', error);
      return {
        totalLeads: 0,
        totalOpportunities: 0,
        pipelineValue: 0,
        totalActivities: 0,
        conversionRate: 0,
        winRate: 0,
        averageDealSize: 0
      };
    }
  }
}
