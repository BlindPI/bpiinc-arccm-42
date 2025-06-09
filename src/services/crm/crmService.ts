
import { supabase } from '@/integrations/supabase/client';
import type { Lead, Contact, Account, Opportunity, Activity } from '@/types/crm';

export class CRMService {
  // Lead Management
  static async getLeads(): Promise<Lead[]> {
    const { data, error } = await supabase
      .from('crm_leads')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  static async createLead(lead: Omit<Lead, 'id' | 'created_at' | 'updated_at'>): Promise<Lead> {
    const { data, error } = await supabase
      .from('crm_leads')
      .insert(lead)
      .select()
      .single();
    
    if (error) throw error;
    return data;
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
    return data || [];
  }

  static async createContact(contact: Omit<Contact, 'id' | 'created_at' | 'updated_at'>): Promise<Contact> {
    const { data, error } = await supabase
      .from('crm_contacts')
      .insert(contact)
      .select()
      .single();
    
    if (error) throw error;
    return data;
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
  static async getAccounts(): Promise<Account[]> {
    const { data, error } = await supabase
      .from('crm_accounts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  static async createAccount(account: Omit<Account, 'id' | 'created_at' | 'updated_at'>): Promise<Account> {
    const { data, error } = await supabase
      .from('crm_accounts')
      .insert(account)
      .select()
      .single();
    
    if (error) throw error;
    return data;
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
    return data || [];
  }

  static async createOpportunity(opportunity: Omit<Opportunity, 'id' | 'created_at' | 'updated_at'>): Promise<Opportunity> {
    const { data, error } = await supabase
      .from('crm_opportunities')
      .insert(opportunity)
      .select()
      .single();
    
    if (error) throw error;
    return data;
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
    return data || [];
  }

  static async createActivity(activity: Omit<Activity, 'id' | 'created_at' | 'updated_at'>): Promise<Activity> {
    const { data, error } = await supabase
      .from('crm_activities')
      .insert(activity)
      .select()
      .single();
    
    if (error) throw error;
    return data;
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
}
