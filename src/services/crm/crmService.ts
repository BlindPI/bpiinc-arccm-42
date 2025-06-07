
import { supabase } from '@/integrations/supabase/client';
import type { Lead, Opportunity, Contact, Account } from '@/types/crm';

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

  // Contact Management
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

  // Account Management
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
