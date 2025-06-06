import { supabase } from '@/integrations/supabase/client';

export interface Lead {
  id: string;
  first_name?: string;
  last_name?: string;
  email: string;
  phone?: string;
  company_name?: string;
  job_title?: string;
  lead_source: string;
  lead_type: string;
  lead_status: string;
  lead_score?: number;
  assigned_to?: string;
  created_by?: string;
  last_contact_date?: string;
  conversion_date?: string;
  converted_contact_id?: string;
  converted_account_id?: string;
  converted_opportunity_id?: string;
  converted_by?: string;
  qualification_notes?: string;
  conversion_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  first_name?: string;
  last_name?: string;
  email: string;
  phone?: string;
  mobile_phone?: string;
  title?: string;
  department?: string;
  account_id?: string;
  contact_status: string;
  lead_source?: string;
  converted_from_lead_id?: string;
  preferred_contact_method?: string;
  do_not_call?: boolean;
  do_not_email?: boolean;
  notes?: string;
  last_activity_date?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Account {
  id: string;
  account_name: string;
  account_type: string;
  industry?: string;
  company_size?: string;
  annual_revenue?: number;
  website?: string;
  phone?: string;
  fax?: string;
  billing_address?: string;
  billing_city?: string;
  billing_state?: string;
  billing_postal_code?: string;
  billing_country?: string;
  shipping_address?: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_postal_code?: string;
  shipping_country?: string;
  account_status: string;
  primary_contact_id?: string;
  parent_account_id?: string;
  converted_from_lead_id?: string;
  assigned_to?: string;
  notes?: string;
  last_activity_date?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface LeadWithConversion extends Lead {
  status: string;
  source: string;
}

export class CRMService {
  // Get all leads
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

  // Create a new lead
  static async createLead(lead: Omit<Lead, 'id' | 'created_at' | 'updated_at'>): Promise<Lead | null> {
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

  // Update a lead
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

  // Delete a lead
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

  // Get all contacts
  static async getContacts(): Promise<Contact[]> {
    try {
      const { data, error } = await supabase
        .from('crm_contacts')
        .select(`
          *,
          converted_from_lead:crm_leads(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(contact => ({
        ...contact,
        contact_status: contact.contact_status || 'active'
      })) as Contact[];
    } catch (error) {
      console.error('Error fetching contacts:', error);
      return [];
    }
  }

  // Create a new contact
  static async createContact(contact: Omit<Contact, 'id' | 'created_at' | 'updated_at'>): Promise<Contact | null> {
    try {
      const { data, error } = await supabase
        .from('crm_contacts')
        .insert({
          ...contact,
          contact_status: contact.contact_status || 'active'
        })
        .select()
        .single();

      if (error) throw error;
      return {
        ...data,
        contact_status: data.contact_status || 'active'
      } as Contact;
    } catch (error) {
      console.error('Error creating contact:', error);
      return null;
    }
  }

  // Update a contact
  static async updateContact(id: string, updates: Partial<Contact>): Promise<Contact | null> {
    try {
      const { data, error } = await supabase
        .from('crm_contacts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return {
        ...data,
        contact_status: data.contact_status || 'active'
      } as Contact;
    } catch (error) {
      console.error('Error updating contact:', error);
      return null;
    }
  }

  // Delete a contact
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

  // Account methods with proper type handling
  static async getAccounts(): Promise<Account[]> {
    try {
      const { data, error } = await supabase
        .from('crm_accounts')
        .select(`
          *,
          opportunities:crm_opportunities(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(account => ({
        ...account,
        account_type: account.account_type || 'prospect',
        account_status: account.account_status || 'active'
      })) as Account[];
    } catch (error) {
      console.error('Error fetching accounts:', error);
      return [];
    }
  }

  // Create a new account
  static async createAccount(account: Omit<Account, 'id' | 'created_at' | 'updated_at'>): Promise<Account | null> {
    try {
      const { data, error } = await supabase
        .from('crm_accounts')
        .insert({
          ...account,
          account_type: account.account_type || 'prospect',
          account_status: account.account_status || 'active'
        })
        .select()
        .single();

      if (error) throw error;
      return {
        ...data,
        account_type: data.account_type || 'prospect',
        account_status: data.account_status || 'active'
      } as Account;
    } catch (error) {
      console.error('Error creating account:', error);
      return null;
    }
  }

  // Update an account
  static async updateAccount(id: string, updates: Partial<Account>): Promise<Account | null> {
    try {
      const { data, error } = await supabase
        .from('crm_accounts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return {
        ...data,
        account_type: data.account_type || 'prospect',
        account_status: data.account_status || 'active'
      } as Account;
    } catch (error) {
      console.error('Error updating account:', error);
      return null;
    }
  }

  // Delete an account
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

  // Lead conversion with proper status mapping
  static async getLeadConversions(): Promise<LeadWithConversion[]> {
    try {
      const { data, error } = await supabase
        .from('crm_leads')
        .select(`
          *,
          conversion_audit:crm_conversion_audit(*)
        `)
        .eq('lead_status', 'converted')
        .order('conversion_date', { ascending: false });

      if (error) throw error;

      return (data || []).map(lead => ({
        ...lead,
        status: lead.lead_status,
        source: lead.lead_source
      })) as LeadWithConversion[];
    } catch (error) {
      console.error('Error fetching lead conversions:', error);
      return [];
    }
  }

  // Convert a lead to contact/account/opportunity
  static async convertLead(
    leadId: string,
    contactData: Partial<Contact>,
    accountData: Partial<Account>,
    createOpportunity: boolean,
    opportunityData?: any
  ): Promise<{
    success: boolean;
    contactId?: string;
    accountId?: string;
    opportunityId?: string;
  }> {
    try {
      // First create the contact
      const { data: contact, error: contactError } = await supabase
        .from('crm_contacts')
        .insert({
          ...contactData,
          converted_from_lead_id: leadId,
          contact_status: 'active'
        })
        .select()
        .single();

      if (contactError) throw contactError;

      // Then create or update the account
      let accountId = accountData.id;
      if (!accountId) {
        const { data: account, error: accountError } = await supabase
          .from('crm_accounts')
          .insert({
            ...accountData,
            converted_from_lead_id: leadId,
            primary_contact_id: contact.id,
            account_status: 'active'
          })
          .select()
          .single();

        if (accountError) throw accountError;
        accountId = account.id;
      }

      // Update the contact with the account ID
      await supabase
        .from('crm_contacts')
        .update({ account_id: accountId })
        .eq('id', contact.id);

      // Create opportunity if requested
      let opportunityId;
      if (createOpportunity && opportunityData) {
        const { data: opportunity, error: opportunityError } = await supabase
          .from('crm_opportunities')
          .insert({
            ...opportunityData,
            contact_id: contact.id,
            account_id: accountId,
            converted_from_lead_id: leadId
          })
          .select()
          .single();

        if (opportunityError) throw opportunityError;
        opportunityId = opportunity.id;
      }

      // Update the lead status
      await supabase
        .from('crm_leads')
        .update({
          lead_status: 'converted',
          conversion_date: new Date().toISOString(),
          converted_contact_id: contact.id,
          converted_account_id: accountId,
          converted_opportunity_id: opportunityId
        })
        .eq('id', leadId);

      // Log the conversion
      await supabase
        .from('crm_conversion_audit')
        .insert({
          lead_id: leadId,
          contact_id: contact.id,
          account_id: accountId,
          opportunity_id: opportunityId,
          conversion_date: new Date().toISOString(),
          converted_by: contactData.created_by
        });

      return {
        success: true,
        contactId: contact.id,
        accountId,
        opportunityId
      };
    } catch (error) {
      console.error('Error converting lead:', error);
      return { success: false };
    }
  }

  // Get CRM dashboard metrics
  static async getDashboardMetrics(): Promise<any> {
    try {
      // Get lead metrics
      const { data: leadMetrics, error: leadError } = await supabase
        .from('crm_leads')
        .select('lead_status, count')
        .order('lead_status')
        .group('lead_status');

      if (leadError) throw leadError;

      // Get opportunity metrics
      const { data: opportunityMetrics, error: oppError } = await supabase
        .from('crm_opportunities')
        .select('opportunity_status, count, sum(estimated_value)')
        .order('opportunity_status')
        .group('opportunity_status');

      if (oppError) throw oppError;

      // Get recent activities
      const { data: recentActivities, error: activityError } = await supabase
        .from('crm_activities')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (activityError) throw activityError;

      // Get upcoming activities
      const today = new Date().toISOString().split('T')[0];
      const { data: upcomingActivities, error: upcomingError } = await supabase
        .from('crm_activities')
        .select('*')
        .gte('due_date', today)
        .order('due_date')
        .limit(10);

      if (upcomingError) throw upcomingError;

      return {
        leadMetrics,
        opportunityMetrics,
        recentActivities,
        upcomingActivities,
        totalLeads: leadMetrics.reduce((sum: number, item: any) => sum + item.count, 0),
        totalOpportunities: opportunityMetrics.reduce((sum: number, item: any) => sum + item.count, 0),
        totalPipelineValue: opportunityMetrics.reduce((sum: number, item: any) => sum + (item.sum || 0), 0)
      };
    } catch (error) {
      console.error('Error getting dashboard metrics:', error);
      return {
        leadMetrics: [],
        opportunityMetrics: [],
        recentActivities: [],
        upcomingActivities: [],
        totalLeads: 0,
        totalOpportunities: 0,
        totalPipelineValue: 0
      };
    }
  }

  // Get CRM activity feed
  static async getActivityFeed(limit = 20): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('crm_activities')
        .select(`
          *,
          related_lead:crm_leads(*),
          related_contact:crm_contacts(*),
          related_account:crm_accounts(*),
          related_opportunity:crm_opportunities(*),
          assigned_user:profiles(*)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting activity feed:', error);
      return [];
    }
  }

  // Create a CRM activity
  static async createActivity(activity: any): Promise<any> {
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

  // Update a CRM activity
  static async updateActivity(id: string, updates: any): Promise<any> {
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

  // Get CRM user assignments
  static async getUserAssignments(userId: string): Promise<any> {
    try {
      // Get assigned leads
      const { data: leads, error: leadError } = await supabase
        .from('crm_leads')
        .select('*')
        .eq('assigned_to', userId)
        .order('created_at', { ascending: false });

      if (leadError) throw leadError;

      // Get assigned opportunities
      const { data: opportunities, error: oppError } = await supabase
        .from('crm_opportunities')
        .select('*')
        .eq('assigned_to', userId)
        .order('created_at', { ascending: false });

      if (oppError) throw oppError;

      // Get assigned activities
      const { data: activities, error: activityError } = await supabase
        .from('crm_activities')
        .select('*')
        .eq('assigned_to', userId)
        .order('due_date', { ascending: true });

      if (activityError) throw activityError;

      return {
        leads: leads || [],
        opportunities: opportunities || [],
        activities: activities || []
      };
    } catch (error) {
      console.error('Error getting user assignments:', error);
      return {
        leads: [],
        opportunities: [],
        activities: []
      };
    }
  }
}
