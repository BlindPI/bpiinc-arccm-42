
import { supabase } from '@/integrations/supabase/client';
import type { 
  Lead, 
  Opportunity, 
  Contact, 
  Account, 
  Activity, 
  CRMStats 
} from '@/types/crm';

export class CRMService {
  // Lead operations
  static async getLeads(): Promise<Lead[]> {
    try {
      const { data, error } = await supabase
        .from('crm_leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as Lead[];
    } catch (error) {
      console.error('Error fetching leads:', error);
      return [];
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

  // Opportunity operations
  static async getOpportunities(): Promise<Opportunity[]> {
    try {
      const { data, error } = await supabase
        .from('crm_opportunities')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as Opportunity[];
    } catch (error) {
      console.error('Error fetching opportunities:', error);
      return [];
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

  // Contact operations
  static async getContacts(): Promise<Contact[]> {
    try {
      const { data, error } = await supabase
        .from('crm_contacts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as Contact[];
    } catch (error) {
      console.error('Error fetching contacts:', error);
      return [];
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

  // Account operations
  static async getAccounts(): Promise<Account[]> {
    try {
      const { data, error } = await supabase
        .from('crm_accounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as Account[];
    } catch (error) {
      console.error('Error fetching accounts:', error);
      return [];
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

  // Activity operations
  static async getActivities(): Promise<Activity[]> {
    try {
      const { data, error } = await supabase
        .from('crm_activities')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as Activity[];
    } catch (error) {
      console.error('Error fetching activities:', error);
      return [];
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

  // Statistics
  static async getCRMStats(): Promise<CRMStats> {
    try {
      // Get counts for each entity type
      const [leadsResult, opportunitiesResult, activitiesResult] = await Promise.all([
        supabase.from('crm_leads').select('*', { count: 'exact' }),
        supabase.from('crm_opportunities').select('*', { count: 'exact' }),
        supabase.from('crm_activities').select('*', { count: 'exact' })
      ]);

      // Calculate pipeline value from opportunities
      const { data: opportunities } = await supabase
        .from('crm_opportunities')
        .select('estimated_value, stage')
        .eq('opportunity_status', 'open');

      const totalPipelineValue = opportunities?.reduce((sum, opp) => sum + (opp.estimated_value || 0), 0) || 0;
      const avgDealSize = opportunities?.length ? totalPipelineValue / opportunities.length : 0;

      // Calculate conversion rates
      const { data: convertedLeads } = await supabase
        .from('crm_leads')
        .select('*', { count: 'exact' })
        .eq('lead_status', 'converted');

      const totalLeads = leadsResult.count || 0;
      const conversionRate = totalLeads > 0 ? ((convertedLeads?.length || 0) / totalLeads) * 100 : 0;

      // Calculate win rate
      const { data: wonOpportunities } = await supabase
        .from('crm_opportunities')
        .select('*', { count: 'exact' })
        .eq('stage', 'closed_won');

      const totalOpportunities = opportunitiesResult.count || 0;
      const winRate = totalOpportunities > 0 ? ((wonOpportunities?.length || 0) / totalOpportunities) * 100 : 0;

      return {
        total_leads: totalLeads,
        total_opportunities: totalOpportunities,
        total_pipeline_value: totalPipelineValue,
        total_activities: activitiesResult.count || 0,
        conversion_rate: conversionRate,
        win_rate: winRate,
        average_deal_size: avgDealSize
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

// Export the types for convenience, re-exporting from the main types file
export type { Lead, Opportunity, Contact, Account, Activity, CRMStats } from '@/types/crm';
