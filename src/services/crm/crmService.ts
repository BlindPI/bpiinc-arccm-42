
import { supabase } from '@/integrations/supabase/client';
import { Lead, Contact, Account, Opportunity, Activity, AssignmentRule, LeadScoringRule } from '@/types/crm';

export class CRMService {
  // Lead management
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

  static async getLeads(): Promise<Lead[]> {
    try {
      const { data, error } = await supabase
        .from('crm_leads')
        .select('*')
        .order('created_at', { ascending: false });

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

  // Opportunity management
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

  static async getOpportunities(): Promise<Opportunity[]> {
    try {
      const { data, error } = await supabase
        .from('crm_opportunities')
        .select('*')
        .order('created_at', { ascending: false });

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

  // Contact management
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

  static async getContacts(): Promise<Contact[]> {
    try {
      const { data, error } = await supabase
        .from('crm_contacts')
        .select('*')
        .order('created_at', { ascending: false });

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

  // Account management
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

  // Activity management
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

  static async getActivities(): Promise<Activity[]> {
    try {
      const { data, error } = await supabase
        .from('crm_activities')
        .select('*')
        .order('activity_date', { ascending: false });

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

  // Assignment rules
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

  // Lead scoring rules
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
