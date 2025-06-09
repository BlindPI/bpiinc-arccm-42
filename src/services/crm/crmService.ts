
import { supabase } from '@/integrations/supabase/client';
import type { Lead, Contact, Account, Opportunity, Activity, AssignmentRule } from '@/types/supabase-schema';

export interface CRMStats {
  totalLeads: number;
  totalOpportunities: number;
  totalRevenue: number;
  conversionRate: number;
  totalCertificates: number;
  pendingRequests: number;
  total_leads: number;
  total_opportunities: number;
  total_pipeline_value: number;
  total_activities: number;
  conversion_rate: number;
  win_rate: number;
  average_deal_size: number;
}

export class CRMService {
  // STATS AND OVERVIEW
  static async getCRMStats(): Promise<CRMStats> {
    const [leads, opportunities, activities] = await Promise.all([
      supabase.from('crm_leads').select('*'),
      supabase.from('crm_opportunities').select('*'),
      supabase.from('crm_activities').select('*')
    ]);

    const totalLeads = leads.data?.length || 0;
    const totalOpportunities = opportunities.data?.length || 0;
    const totalRevenue = opportunities.data?.reduce((sum, opp) => sum + (opp.estimated_value || 0), 0) || 0;
    const conversionRate = totalLeads > 0 ? (totalOpportunities / totalLeads) * 100 : 0;

    return {
      totalLeads,
      totalOpportunities,
      totalRevenue,
      conversionRate,
      totalCertificates: 0,
      pendingRequests: 0,
      total_leads: totalLeads,
      total_opportunities: totalOpportunities,
      total_pipeline_value: totalRevenue,
      total_activities: activities.data?.length || 0,
      conversion_rate: conversionRate,
      win_rate: 25.5,
      average_deal_size: totalOpportunities > 0 ? totalRevenue / totalOpportunities : 0
    };
  }

  // LEAD OPERATIONS
  static async getLeads(): Promise<Lead[]> {
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
  }

  static async createLead(leadData: Omit<Lead, 'id' | 'created_at' | 'updated_at'>): Promise<Lead> {
    const { data, error } = await supabase
      .from('crm_leads')
      .insert(leadData)
      .select()
      .single();
    
    if (error) throw error;
    return data as Lead;
  }

  static async updateLead(id: string, updates: Partial<Lead>): Promise<Lead> {
    const { data, error } = await supabase
      .from('crm_leads')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Lead;
  }

  static async deleteLead(id: string): Promise<void> {
    const { error } = await supabase
      .from('crm_leads')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // CONTACT OPERATIONS
  static async getContacts(): Promise<Contact[]> {
    const { data, error } = await supabase
      .from('crm_contacts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  static async createContact(contactData: Omit<Contact, 'id' | 'created_at' | 'updated_at'>): Promise<Contact> {
    const { data, error } = await supabase
      .from('crm_contacts')
      .insert(contactData)
      .select()
      .single();
    
    if (error) throw error;
    return data as Contact;
  }

  static async updateContact(id: string, updates: Partial<Contact>): Promise<Contact> {
    const { data, error } = await supabase
      .from('crm_contacts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Contact;
  }

  // ACCOUNT OPERATIONS
  static async getAccounts(): Promise<Account[]> {
    const { data, error } = await supabase
      .from('crm_accounts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  static async createAccount(accountData: Omit<Account, 'id' | 'created_at' | 'updated_at'>): Promise<Account> {
    const { data, error } = await supabase
      .from('crm_accounts')
      .insert(accountData)
      .select()
      .single();
    
    if (error) throw error;
    return data as Account;
  }

  static async updateAccount(id: string, updates: Partial<Account>): Promise<Account> {
    const { data, error } = await supabase
      .from('crm_accounts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Account;
  }

  // OPPORTUNITY OPERATIONS
  static async getOpportunities(): Promise<Opportunity[]> {
    const { data, error } = await supabase
      .from('crm_opportunities')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  static async createOpportunity(opportunityData: Omit<Opportunity, 'id' | 'created_at' | 'updated_at'>): Promise<Opportunity> {
    const { data, error } = await supabase
      .from('crm_opportunities')
      .insert(opportunityData)
      .select()
      .single();
    
    if (error) throw error;
    return data as Opportunity;
  }

  static async updateOpportunity(id: string, updates: Partial<Opportunity>): Promise<Opportunity> {
    const { data, error } = await supabase
      .from('crm_opportunities')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Opportunity;
  }

  // ACTIVITY OPERATIONS
  static async getActivities(): Promise<Activity[]> {
    const { data, error } = await supabase
      .from('crm_activities')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  static async createActivity(activityData: Omit<Activity, 'id' | 'created_at' | 'updated_at'>): Promise<Activity> {
    const { data, error } = await supabase
      .from('crm_activities')
      .insert(activityData)
      .select()
      .single();
    
    if (error) throw error;
    return data as Activity;
  }

  static async updateActivity(id: string, updates: Partial<Activity>): Promise<Activity> {
    const { data, error } = await supabase
      .from('crm_activities')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Activity;
  }

  // ASSIGNMENT RULE OPERATIONS
  static async getAssignmentRules(): Promise<AssignmentRule[]> {
    const { data, error } = await supabase
      .from('crm_assignment_rules')
      .select('*')
      .order('priority');
    
    if (error) throw error;
    return data || [];
  }

  static async createAssignmentRule(ruleData: Omit<AssignmentRule, 'id' | 'created_at' | 'updated_at'>): Promise<AssignmentRule> {
    const { data, error } = await supabase
      .from('crm_assignment_rules')
      .insert(ruleData)
      .select()
      .single();
    
    if (error) throw error;
    return data as AssignmentRule;
  }
}
