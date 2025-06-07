
import { supabase } from '@/integrations/supabase/client';
import type { Lead, Contact, Account } from '@/types/crm';
import type { ContactStatus, AccountType, AccountStatus } from '@/types/supabase-schema';

export interface LeadConversionOptions {
  createContact: boolean;
  createAccount: boolean;
  createOpportunity: boolean;
  contactData?: Partial<Contact>;
  accountData?: Partial<Account>;
}

export class LeadConversionService {
  static async convertLead(
    leadId: string, 
    options: LeadConversionOptions,
    convertedBy: string
  ): Promise<{ success: boolean; contact?: Contact; account?: Account }> {
    try {
      // Get the lead
      const { data: lead, error: leadError } = await supabase
        .from('crm_leads')
        .select('*')
        .eq('id', leadId)
        .single();

      if (leadError) throw leadError;

      let contact: Contact | undefined;
      let account: Account | undefined;

      // Create contact if requested
      if (options.createContact) {
        const contactData = {
          first_name: lead.first_name,
          last_name: lead.last_name,
          email: lead.email || '',
          phone: lead.phone,
          title: lead.job_title,
          converted_from_lead_id: leadId,
          lead_source: lead.lead_source,
          contact_status: 'active' as ContactStatus,
          created_by: convertedBy,
          ...options.contactData
        };

        const { data: newContact, error: contactError } = await supabase
          .from('crm_contacts')
          .insert(contactData)
          .select()
          .single();

        if (contactError) throw contactError;
        contact = newContact as Contact;
      }

      // Create account if requested
      if (options.createAccount && lead.company_name) {
        const accountData = {
          account_name: lead.company_name,
          account_type: 'prospect' as AccountType,
          account_status: 'active' as AccountStatus,
          industry: lead.industry,
          company_size: lead.company_size,
          website: lead.website,
          phone: lead.phone,
          converted_from_lead_id: leadId,
          created_by: convertedBy,
          ...options.accountData
        };

        const { data: newAccount, error: accountError } = await supabase
          .from('crm_accounts')
          .insert(accountData)
          .select()
          .single();

        if (accountError) throw accountError;
        account = newAccount as Account;
      }

      // Update lead status
      await supabase
        .from('crm_leads')
        .update({ 
          lead_status: 'converted',
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId);

      // Log conversion in audit_logs with simplified JSON-safe data
      await supabase
        .from('audit_logs')
        .insert({
          action: 'lead_conversion',
          entity_type: 'lead',
          entity_id: leadId,
          user_id: convertedBy,
          details: {
            conversion_type: 'lead_conversion',
            lead_data: {
              id: lead.id,
              first_name: lead.first_name,
              last_name: lead.last_name,
              email: lead.email,
              company_name: lead.company_name
            },
            created_entities: {
              contact_id: contact?.id,
              account_id: account?.id
            },
            success: true
          }
        });

      return { success: true, contact, account };
    } catch (error) {
      console.error('Error converting lead:', error);
      return { success: false };
    }
  }

  static async getConvertedContacts(leadId?: string): Promise<Contact[]> {
    try {
      let query = supabase
        .from('crm_contacts')
        .select('*')
        .not('converted_from_lead_id', 'is', null);

      if (leadId) {
        query = query.eq('converted_from_lead_id', leadId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []) as Contact[];
    } catch (error) {
      console.error('Error fetching converted contacts:', error);
      return [];
    }
  }

  static async getConvertedAccounts(leadId?: string): Promise<Account[]> {
    try {
      let query = supabase
        .from('crm_accounts')
        .select('*')
        .not('converted_from_lead_id', 'is', null);

      if (leadId) {
        query = query.eq('converted_from_lead_id', leadId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []) as Account[];
    } catch (error) {
      console.error('Error fetching converted accounts:', error);
      return [];
    }
  }
}
