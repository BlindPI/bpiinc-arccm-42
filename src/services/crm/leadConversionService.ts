
import { supabase } from '@/integrations/supabase/client';
import { Lead, Contact, Account, Opportunity } from './crmService';

export interface ConversionResult {
  success: boolean;
  contactId?: string;
  accountId?: string;
  opportunityId?: string;
  error?: string;
}

export interface ConversionOptions {
  createContact: boolean;
  createAccount: boolean;
  createOpportunity: boolean;
  contactData?: Partial<Contact>;
  accountData?: Partial<Account>;
  opportunityData?: Partial<Opportunity>;
}

export class LeadConversionService {
  static async convertLead(
    lead: Lead,
    options: ConversionOptions
  ): Promise<ConversionResult> {
    try {
      let contactId: string | undefined;
      let accountId: string | undefined;
      let opportunityId: string | undefined;

      // Create contact if requested
      if (options.createContact) {
        const contactData = {
          first_name: lead.first_name,
          last_name: lead.last_name,
          email: lead.email,
          phone: lead.phone,
          title: lead.job_title,
          converted_from_lead_id: lead.id,
          contact_status: 'active' as const,
          ...options.contactData
        };

        const { data: contact, error: contactError } = await supabase
          .from('crm_contacts')
          .insert(contactData)
          .select()
          .single();

        if (contactError) throw contactError;
        contactId = contact.id;
      }

      // Create account if requested
      if (options.createAccount) {
        const accountData = {
          account_name: lead.company_name || 'Unknown Company',
          account_type: 'prospect' as const,
          account_status: 'active' as const,
          converted_from_lead_id: lead.id,
          primary_contact_id: contactId,
          ...options.accountData
        };

        const { data: account, error: accountError } = await supabase
          .from('crm_accounts')
          .insert(accountData)
          .select()
          .single();

        if (accountError) throw accountError;
        accountId = account.id;

        // Update contact with account ID if contact was created
        if (contactId) {
          await supabase
            .from('crm_contacts')
            .update({ account_id: accountId })
            .eq('id', contactId);
        }
      }

      // Create opportunity if requested
      if (options.createOpportunity) {
        const opportunityData = {
          opportunity_name: `${lead.company_name || lead.first_name} - Training Opportunity`,
          stage: 'prospect' as const,
          estimated_value: 5000,
          probability: 25,
          opportunity_status: 'open' as const,
          contact_id: contactId,
          account_id: accountId,
          converted_from_lead_id: lead.id,
          ...options.opportunityData
        };

        const { data: opportunity, error: opportunityError } = await supabase
          .from('crm_opportunities')
          .insert(opportunityData)
          .select()
          .single();

        if (opportunityError) throw opportunityError;
        opportunityId = opportunity.id;
      }

      // Update lead status to converted
      await supabase
        .from('crm_leads')
        .update({
          lead_status: 'converted',
          conversion_date: new Date().toISOString(),
          converted_contact_id: contactId,
          converted_account_id: accountId,
          converted_opportunity_id: opportunityId
        })
        .eq('id', lead.id);

      return {
        success: true,
        contactId,
        accountId,
        opportunityId
      };
    } catch (error) {
      console.error('Error converting lead:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}
