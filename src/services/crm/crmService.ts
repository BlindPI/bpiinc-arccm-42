
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
  contact_status: 'active' | 'inactive' | 'bounced';
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
  account_type: 'prospect' | 'customer' | 'partner' | 'competitor';
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
  account_status: 'active' | 'inactive' | 'suspended';
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

export interface Opportunity {
  id: string;
  opportunity_name: string;
  account_id?: string;
  contact_id?: string;
  stage: 'prospect' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
  estimated_value: number;
  probability: number;
  expected_close_date?: string;
  close_date?: string;
  opportunity_status: 'open' | 'closed_won' | 'closed_lost';
  opportunity_type?: string;
  lead_id?: string;
  assigned_to?: string;
  next_steps?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: string;
  type: 'call' | 'email' | 'meeting' | 'task' | 'note';
  subject: string;
  description?: string;
  due_date?: string;
  completed: boolean;
  lead_id?: string;
  opportunity_id?: string;
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

  // Opportunity methods
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

  static async createOpportunity(opportunity: Omit<Opportunity, 'id' | 'created_at' | 'updated_at'>): Promise<Opportunity | null> {
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

  // Activity methods
  static async getActivities(filters?: { type?: string; completed?: boolean }): Promise<Activity[]> {
    try {
      let query = supabase
        .from('crm_activities')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.type && filters.type !== 'all') {
        query = query.eq('activity_type', filters.type);
      }
      if (filters?.completed !== undefined) {
        query = query.eq('outcome', filters.completed ? 'completed' : 'pending');
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map(activity => ({
        id: activity.id,
        type: activity.activity_type,
        subject: activity.subject,
        description: activity.description,
        due_date: activity.activity_date,
        completed: activity.outcome === 'completed',
        lead_id: activity.lead_id,
        opportunity_id: activity.opportunity_id,
        created_by: activity.created_by,
        created_at: activity.created_at,
        updated_at: activity.updated_at
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
        .insert({
          activity_type: activity.type,
          subject: activity.subject,
          description: activity.description,
          activity_date: activity.due_date,
          outcome: activity.completed ? 'completed' : 'pending',
          lead_id: activity.lead_id,
          opportunity_id: activity.opportunity_id,
          created_by: activity.created_by
        })
        .select()
        .single();

      if (error) throw error;
      
      return {
        id: data.id,
        type: data.activity_type,
        subject: data.subject,
        description: data.description,
        due_date: data.activity_date,
        completed: data.outcome === 'completed',
        lead_id: data.lead_id,
        opportunity_id: data.opportunity_id,
        created_by: data.created_by,
        created_at: data.created_at,
        updated_at: data.updated_at
      };
    } catch (error) {
      console.error('Error creating activity:', error);
      return null;
    }
  }

  static async updateActivity(id: string, updates: Partial<Activity>): Promise<Activity | null> {
    try {
      const updateData: any = {};
      if (updates.type) updateData.activity_type = updates.type;
      if (updates.subject) updateData.subject = updates.subject;
      if (updates.description) updateData.description = updates.description;
      if (updates.due_date) updateData.activity_date = updates.due_date;
      if (updates.completed !== undefined) updateData.outcome = updates.completed ? 'completed' : 'pending';

      const { data, error } = await supabase
        .from('crm_activities')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      return {
        id: data.id,
        type: data.activity_type,
        subject: data.subject,
        description: data.description,
        due_date: data.activity_date,
        completed: data.outcome === 'completed',
        lead_id: data.lead_id,
        opportunity_id: data.opportunity_id,
        created_by: data.created_by,
        created_at: data.created_at,
        updated_at: data.updated_at
      };
    } catch (error) {
      console.error('Error updating activity:', error);
      return null;
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
  static async getCRMStats(): Promise<any> {
    try {
      // Get lead count
      const { data: leads } = await supabase
        .from('crm_leads')
        .select('id', { count: 'exact' });

      // Get opportunity count and value
      const { data: opportunities } = await supabase
        .from('crm_opportunities')
        .select('estimated_value');

      // Get activity count  
      const { data: activities } = await supabase
        .from('crm_activities')
        .select('id', { count: 'exact' });

      const totalLeads = leads?.length || 0;
      const totalOpportunities = opportunities?.length || 0;
      const pipelineValue = opportunities?.reduce((sum, opp) => sum + (opp.estimated_value || 0), 0) || 0;
      const totalActivities = activities?.length || 0;

      return {
        totalLeads,
        totalOpportunities,
        pipelineValue,
        totalActivities
      };
    } catch (error) {
      console.error('Error getting CRM stats:', error);
      return {
        totalLeads: 0,
        totalOpportunities: 0,
        pipelineValue: 0,
        totalActivities: 0
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
