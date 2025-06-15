
import { supabase } from '@/integrations/supabase/client';
import type { Lead, Contact, Account, Opportunity } from '@/types/crm';

export class CRMService {
  // Lead Management
  static async getLeads(): Promise<Lead[]> {
    const { data, error } = await supabase
      .from('crm_leads')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []) as Lead[];
  }

  static async createLead(lead: Omit<Lead, 'id' | 'created_at' | 'updated_at'>): Promise<Lead> {
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
    return (data || []) as Contact[];
  }

  static async createContact(contact: Omit<Contact, 'id' | 'created_at' | 'updated_at'>): Promise<Contact> {
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
  }

  static async updateContact(id: string, updates: Partial<Contact>): Promise<void> {
    const { error } = await supabase
      .from('crm_contacts')
      .update({ ...updates, updated_at: new Date().toISOString() })
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
    return (data || []) as Account[];
  }

  static async createAccount(account: Omit<Account, 'id' | 'created_at' | 'updated_at'>): Promise<Account> {
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
  }

  // Opportunity Management
  static async getOpportunities(): Promise<Opportunity[]> {
    const { data, error } = await supabase
      .from('crm_opportunities')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []) as Opportunity[];
  }

  static async createOpportunity(opportunity: Omit<Opportunity, 'id' | 'created_at' | 'updated_at'>): Promise<Opportunity> {
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
  }

  // Lead Conversion
  static async convertLead(leadId: string, options: {
    createContact: boolean;
    createAccount: boolean;
    createOpportunity: boolean;
    opportunityData?: Partial<Opportunity>;
  }): Promise<{ contact?: Contact; account?: Account; opportunity?: Opportunity }> {
    // Get the lead first
    const { data: lead, error: leadError } = await supabase
      .from('crm_leads')
      .select('*')
      .eq('id', leadId)
      .single();

    if (leadError) throw leadError;

    const results: { contact?: Contact; account?: Account; opportunity?: Opportunity } = {};

    // Create contact if requested
    if (options.createContact) {
      const contactData = {
        first_name: lead.first_name,
        last_name: lead.last_name,
        email: lead.email || '',
        phone: lead.phone,
        title: lead.job_title,
        contact_status: 'active' as const,
        converted_from_lead_id: leadId,
        lead_source: lead.lead_source
      };

      results.contact = await this.createContact(contactData);
    }

    // Create account if requested and company exists
    if (options.createAccount && lead.company_name) {
      const accountData = {
        account_name: lead.company_name,
        account_type: 'prospect' as const,
        account_status: 'active' as const,
        converted_from_lead_id: leadId
      };

      results.account = await this.createAccount(accountData);
    }

    // Create opportunity if requested
    if (options.createOpportunity) {
      const opportunityData = {
        opportunity_name: `${lead.first_name} ${lead.last_name} - ${lead.company_name || 'Individual'}`,
        account_id: results.account?.id,
        estimated_value: 0,
        stage: 'prospect' as const,
        probability: 25,
        opportunity_status: 'open' as const,
        lead_id: leadId,
        ...options.opportunityData
      };

      results.opportunity = await this.createOpportunity(opportunityData);
    }

    // Update lead status to converted
    await this.updateLead(leadId, { lead_status: 'converted' });

    return results;
  }

  // Search functionality
  static async globalSearch(query: string): Promise<{
    leads: Lead[];
    contacts: Contact[];
    accounts: Account[];
    opportunities: Opportunity[];
  }> {
    const searchTerm = `%${query.toLowerCase()}%`;
    
    const [leadsResult, contactsResult, accountsResult, opportunitiesResult] = await Promise.all([
      supabase
        .from('crm_leads')
        .select('*')
        .or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},email.ilike.${searchTerm},company_name.ilike.${searchTerm}`)
        .limit(5),
      supabase
        .from('crm_contacts')
        .select('*')
        .or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},email.ilike.${searchTerm}`)
        .limit(5),
      supabase
        .from('crm_accounts')
        .select('*')
        .ilike('account_name', searchTerm)
        .limit(5),
      supabase
        .from('crm_opportunities')
        .select('*')
        .ilike('opportunity_name', searchTerm)
        .limit(5)
    ]);

    return {
      leads: (leadsResult.data || []) as Lead[],
      contacts: (contactsResult.data || []) as Contact[],
      accounts: (accountsResult.data || []) as Account[],
      opportunities: (opportunitiesResult.data || []) as Opportunity[]
    };
  }
}
