import { supabase } from '@/integrations/supabase/client';

// Types and Interfaces
export interface LeadConversionOptions {
  createContact: boolean;
  createAccount: boolean;
  createOpportunity: boolean;
  opportunityName?: string;
  opportunityValue?: number;
  opportunityStage?: string;
  opportunityCloseDate?: string;
  preserveLeadData: boolean;
  conversionNotes?: string;
  contactTitle?: string;
  accountType?: string;
  accountIndustry?: string;
}

export interface ConversionResult {
  success: boolean;
  leadId: string;
  contactId?: string;
  accountId?: string;
  opportunityId?: string;
  errors?: string[];
  warnings?: string[];
  auditId?: string;
}

export interface ConversionValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  canProceed: boolean;
}

export interface ConversionPreview {
  lead: any;
  proposedContact?: any;
  proposedAccount?: any;
  proposedOpportunity?: any;
  dataMapping: DataMappingPreview[];
}

export interface DataMappingPreview {
  sourceField: string;
  sourceValue: any;
  targetEntity: 'contact' | 'account' | 'opportunity';
  targetField: string;
  targetValue: any;
  transformation?: string;
}

export interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  mobile_phone?: string;
  title?: string;
  department?: string;
  account_id?: string;
  lead_source: string;
  converted_from_lead_id?: string;
  contact_status: 'active' | 'inactive' | 'bounced';
  preferred_contact_method: 'email' | 'phone' | 'mobile';
  do_not_call: boolean;
  do_not_email: boolean;
  last_activity_date?: string;
  notes?: string;
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
  billing_address?: string;
  shipping_address?: string;
  primary_contact_id?: string;
  converted_from_lead_id?: string;
  account_status: 'active' | 'inactive' | 'suspended';
  assigned_to?: string;
  last_activity_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Default conversion options
export const DEFAULT_CONVERSION_OPTIONS: LeadConversionOptions = {
  createContact: true,
  createAccount: true,
  createOpportunity: true,
  preserveLeadData: true,
  opportunityStage: 'prospect',
  accountType: 'prospect'
};

// Data mapping rules
export const DATA_MAPPING_RULES = [
  // Contact mappings
  { sourceField: 'first_name', targetEntity: 'contact', targetField: 'first_name', required: true },
  { sourceField: 'last_name', targetEntity: 'contact', targetField: 'last_name', required: true },
  { sourceField: 'email', targetEntity: 'contact', targetField: 'email', required: true },
  { sourceField: 'phone', targetEntity: 'contact', targetField: 'phone', required: false },
  { sourceField: 'job_title', targetEntity: 'contact', targetField: 'title', required: false },
  { sourceField: 'lead_source', targetEntity: 'contact', targetField: 'lead_source', required: false },
  
  // Account mappings
  { sourceField: 'company_name', targetEntity: 'account', targetField: 'account_name', required: true },
  { sourceField: 'lead_source', targetEntity: 'account', targetField: 'lead_source', required: false },
  
  // Opportunity mappings
  { sourceField: 'company_name', targetEntity: 'opportunity', targetField: 'opportunity_name', 
    transformation: (value: string) => `${value} - Training Opportunity`, required: false },
  { sourceField: 'lead_source', targetEntity: 'opportunity', targetField: 'lead_source', required: false }
];

export class LeadConversionService {
  /**
   * Validate if a lead can be converted
   */
  static async validateConversion(leadId: string): Promise<ConversionValidation> {
    try {
      const { data: lead, error } = await supabase
        .from('crm_leads')
        .select('*')
        .eq('id', leadId)
        .single();

      if (error) {
        return {
          isValid: false,
          errors: ['Lead not found'],
          warnings: [],
          canProceed: false
        };
      }

      const errors: string[] = [];
      const warnings: string[] = [];

      // Check if lead is already converted
      if (lead.lead_status === 'converted') {
        errors.push('Lead is already converted');
      }

      // Check if lead is lost
      if (lead.lead_status === 'lost') {
        errors.push('Cannot convert a lost lead');
      }

      // Check required fields
      if (!lead.email) {
        errors.push('Lead must have an email address');
      }

      if (!lead.first_name && !lead.last_name) {
        errors.push('Lead must have at least first name or last name');
      }

      // Check for existing contact with same email
      if (lead.email) {
        const { data: existingContact } = await supabase
          .from('crm_contacts')
          .select('id, first_name, last_name')
          .eq('email', lead.email)
          .single();

        if (existingContact) {
          warnings.push(`Contact with email ${lead.email} already exists: ${existingContact.first_name} ${existingContact.last_name}`);
        }
      }

      // Check for existing account with same name
      if (lead.company_name) {
        const { data: existingAccount } = await supabase
          .from('crm_accounts')
          .select('id, account_name')
          .eq('account_name', lead.company_name)
          .single();

        if (existingAccount) {
          warnings.push(`Account with name "${lead.company_name}" already exists`);
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        canProceed: errors.length === 0
      };

    } catch (error) {
      console.error('Error validating conversion:', error);
      return {
        isValid: false,
        errors: ['Validation failed due to system error'],
        warnings: [],
        canProceed: false
      };
    }
  }

  /**
   * Get conversion preview showing what will be created
   */
  static async getConversionPreview(
    leadId: string, 
    options: LeadConversionOptions
  ): Promise<ConversionPreview> {
    const { data: lead } = await supabase
      .from('crm_leads')
      .select('*')
      .eq('id', leadId)
      .single();

    if (!lead) {
      throw new Error('Lead not found');
    }

    const preview: ConversionPreview = {
      lead,
      dataMapping: []
    };

    // Generate proposed contact
    if (options.createContact) {
      preview.proposedContact = {
        first_name: lead.first_name,
        last_name: lead.last_name,
        email: lead.email,
        phone: lead.phone,
        title: options.contactTitle || lead.job_title,
        lead_source: lead.lead_source,
        converted_from_lead_id: leadId
      };
    }

    // Generate proposed account
    if (options.createAccount && lead.company_name) {
      preview.proposedAccount = {
        account_name: lead.company_name,
        account_type: options.accountType || 'prospect',
        industry: options.accountIndustry,
        converted_from_lead_id: leadId
      };
    }

    // Generate proposed opportunity
    if (options.createOpportunity) {
      const opportunityName = options.opportunityName || 
        `${lead.company_name || lead.first_name + ' ' + lead.last_name} - Training Opportunity`;
      
      preview.proposedOpportunity = {
        opportunity_name: opportunityName,
        estimated_value: options.opportunityValue || 5000,
        stage: options.opportunityStage || 'prospect',
        expected_close_date: options.opportunityCloseDate,
        lead_id: leadId,
        converted_from_lead_id: leadId
      };
    }

    // Generate data mapping preview
    preview.dataMapping = this.generateDataMappingPreview(lead, options);

    return preview;
  }

  /**
   * Convert a lead to contact, account, and/or opportunity
   */
  static async convertLead(
    leadId: string, 
    options: LeadConversionOptions
  ): Promise<ConversionResult> {
    // Validate conversion first
    const validation = await this.validateConversion(leadId);
    if (!validation.canProceed) {
      return {
        success: false,
        leadId,
        errors: validation.errors,
        warnings: validation.warnings
      };
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        success: false,
        leadId,
        errors: ['User not authenticated']
      };
    }

    // Start transaction by getting lead data
    const { data: lead, error: leadError } = await supabase
      .from('crm_leads')
      .select('*')
      .eq('id', leadId)
      .single();

    if (leadError || !lead) {
      return {
        success: false,
        leadId,
        errors: ['Lead not found']
      };
    }

    const result: ConversionResult = {
      success: false,
      leadId,
      errors: [],
      warnings: validation.warnings
    };

    try {
      let contactId: string | undefined;
      let accountId: string | undefined;
      let opportunityId: string | undefined;

      // Create contact if requested
      if (options.createContact) {
        const contactResult = await this.createContactFromLead(lead, options);
        if (contactResult.success) {
          contactId = contactResult.contactId;
        } else {
          result.errors?.push(...(contactResult.errors || []));
        }
      }

      // Create account if requested
      if (options.createAccount && lead.company_name) {
        const accountResult = await this.createAccountFromLead(lead, options, contactId);
        if (accountResult.success) {
          accountId = accountResult.accountId;
        } else {
          result.errors?.push(...(accountResult.errors || []));
        }
      }

      // Create opportunity if requested
      if (options.createOpportunity) {
        const opportunityResult = await this.createOpportunityFromLead(
          lead, 
          options, 
          contactId, 
          accountId
        );
        if (opportunityResult.success) {
          opportunityId = opportunityResult.opportunityId;
        } else {
          result.errors?.push(...(opportunityResult.errors || []));
        }
      }

      // Update lead status and relationships
      if (result.errors?.length === 0) {
        const updateResult = await this.updateLeadAfterConversion(
          leadId, 
          contactId, 
          accountId, 
          opportunityId, 
          options, 
          user.id
        );

        if (!updateResult.success) {
          result.errors?.push(...(updateResult.errors || []));
        }
      }

      // Create audit record
      if (result.errors?.length === 0) {
        const auditResult = await this.createConversionAudit(
          lead,
          { contactId, accountId, opportunityId },
          options,
          user.id
        );
        result.auditId = auditResult.auditId;
      }

      // Set final result
      result.success = (result.errors?.length || 0) === 0;
      result.contactId = contactId;
      result.accountId = accountId;
      result.opportunityId = opportunityId;

      return result;

    } catch (error) {
      console.error('Error during lead conversion:', error);
      return {
        success: false,
        leadId,
        errors: ['Conversion failed due to system error'],
        warnings: validation.warnings
      };
    }
  }

  /**
   * Create contact from lead data
   */
  private static async createContactFromLead(
    lead: any, 
    options: LeadConversionOptions
  ): Promise<{ success: boolean; contactId?: string; errors?: string[] }> {
    try {
      const { data, error } = await supabase
        .from('crm_contacts')
        .insert({
          first_name: lead.first_name,
          last_name: lead.last_name,
          email: lead.email,
          phone: lead.phone,
          title: options.contactTitle || lead.job_title,
          lead_source: lead.lead_source,
          converted_from_lead_id: lead.id,
          notes: `Converted from lead on ${new Date().toISOString()}`
        })
        .select()
        .single();

      if (error) {
        return { success: false, errors: [`Failed to create contact: ${error.message}`] };
      }

      return { success: true, contactId: data.id };
    } catch (error) {
      return { success: false, errors: ['Failed to create contact due to system error'] };
    }
  }

  /**
   * Create account from lead data
   */
  private static async createAccountFromLead(
    lead: any, 
    options: LeadConversionOptions,
    primaryContactId?: string
  ): Promise<{ success: boolean; accountId?: string; errors?: string[] }> {
    try {
      const { data, error } = await supabase
        .from('crm_accounts')
        .insert({
          account_name: lead.company_name,
          account_type: options.accountType || 'prospect',
          industry: options.accountIndustry,
          phone: lead.phone,
          primary_contact_id: primaryContactId,
          converted_from_lead_id: lead.id,
          assigned_to: lead.assigned_to,
          notes: `Converted from lead on ${new Date().toISOString()}`
        })
        .select()
        .single();

      if (error) {
        return { success: false, errors: [`Failed to create account: ${error.message}`] };
      }

      // Update contact with account_id if contact was created
      if (primaryContactId) {
        await supabase
          .from('crm_contacts')
          .update({ account_id: data.id })
          .eq('id', primaryContactId);
      }

      return { success: true, accountId: data.id };
    } catch (error) {
      return { success: false, errors: ['Failed to create account due to system error'] };
    }
  }

  /**
   * Create opportunity from lead data
   */
  private static async createOpportunityFromLead(
    lead: any, 
    options: LeadConversionOptions,
    contactId?: string,
    accountId?: string
  ): Promise<{ success: boolean; opportunityId?: string; errors?: string[] }> {
    try {
      const opportunityName = options.opportunityName || 
        `${lead.company_name || lead.first_name + ' ' + lead.last_name} - Training Opportunity`;

      const { data, error } = await supabase
        .from('crm_opportunities')
        .insert({
          opportunity_name: opportunityName,
          estimated_value: options.opportunityValue || 5000,
          stage: options.opportunityStage || 'prospect',
          probability: 25, // Default probability for new opportunities
          expected_close_date: options.opportunityCloseDate,
          lead_id: lead.id,
          contact_id: contactId,
          account_id: accountId,
          converted_from_lead_id: lead.id,
          assigned_to: lead.assigned_to,
          next_steps: 'Follow up on training requirements and schedule initial consultation',
          opportunity_type: 'training_contract'
        })
        .select()
        .single();

      if (error) {
        return { success: false, errors: [`Failed to create opportunity: ${error.message}`] };
      }

      return { success: true, opportunityId: data.id };
    } catch (error) {
      return { success: false, errors: ['Failed to create opportunity due to system error'] };
    }
  }

  /**
   * Update lead after successful conversion
   */
  private static async updateLeadAfterConversion(
    leadId: string,
    contactId?: string,
    accountId?: string,
    opportunityId?: string,
    options?: LeadConversionOptions,
    userId?: string
  ): Promise<{ success: boolean; errors?: string[] }> {
    try {
      const { error } = await supabase
        .from('crm_leads')
        .update({
          lead_status: 'converted',
          converted_contact_id: contactId,
          converted_account_id: accountId,
          converted_opportunity_id: opportunityId,
          conversion_date: new Date().toISOString(),
          conversion_notes: options?.conversionNotes,
          converted_by: userId
        })
        .eq('id', leadId);

      if (error) {
        return { success: false, errors: [`Failed to update lead: ${error.message}`] };
      }

      return { success: true };
    } catch (error) {
      return { success: false, errors: ['Failed to update lead due to system error'] };
    }
  }

  /**
   * Create conversion audit record
   */
  private static async createConversionAudit(
    originalLead: any,
    createdEntities: { contactId?: string; accountId?: string; opportunityId?: string },
    options: LeadConversionOptions,
    userId: string
  ): Promise<{ success: boolean; auditId?: string; errors?: string[] }> {
    try {
      const { data, error } = await supabase
        .from('crm_conversion_audit')
        .insert({
          lead_id: originalLead.id,
          conversion_type: this.getConversionType(options),
          before_data: originalLead,
          after_data: {
            lead_status: 'converted',
            conversion_date: new Date().toISOString()
          },
          created_entities: createdEntities,
          conversion_options: options,
          converted_by: userId,
          notes: options.conversionNotes,
          success: true
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to create audit record:', error);
        return { success: false, errors: [`Failed to create audit record: ${error.message}`] };
      }

      return { success: true, auditId: data.id };
    } catch (error) {
      console.error('Error creating audit record:', error);
      return { success: false, errors: ['Failed to create audit record due to system error'] };
    }
  }

  /**
   * Generate data mapping preview
   */
  private static generateDataMappingPreview(
    lead: any, 
    options: LeadConversionOptions
  ): DataMappingPreview[] {
    const mappings: DataMappingPreview[] = [];

    DATA_MAPPING_RULES.forEach(rule => {
      const sourceValue = lead[rule.sourceField];
      if (sourceValue !== null && sourceValue !== undefined) {
        let targetValue = sourceValue;
        
        // Apply transformation if specified
        if (rule.transformation) {
          targetValue = rule.transformation(sourceValue);
        }

        // Check if this mapping should be included based on options
        const shouldInclude = 
          (rule.targetEntity === 'contact' && options.createContact) ||
          (rule.targetEntity === 'account' && options.createAccount) ||
          (rule.targetEntity === 'opportunity' && options.createOpportunity);

        if (shouldInclude) {
          mappings.push({
            sourceField: rule.sourceField,
            sourceValue,
            targetEntity: rule.targetEntity as 'contact' | 'account' | 'opportunity',
            targetField: rule.targetField,
            targetValue,
            transformation: rule.transformation ? 'Applied' : undefined
          });
        }
      }
    });

    return mappings;
  }

  /**
   * Determine conversion type based on options
   */
  private static getConversionType(options: LeadConversionOptions): string {
    const types = [];
    if (options.createContact) types.push('contact');
    if (options.createAccount) types.push('account');
    if (options.createOpportunity) types.push('opportunity');
    
    if (types.length === 3) return 'full';
    if (types.length === 1) return `${types[0]}_only`;
    return types.join('_');
  }

  /**
   * Get conversion history for a lead
   */
  static async getConversionHistory(leadId: string) {
    try {
      const { data, error } = await supabase
        .from('crm_conversion_audit')
        .select(`
          *,
          converted_by_profile:profiles!crm_conversion_audit_converted_by_fkey(
            first_name,
            last_name,
            email
          )
        `)
        .eq('lead_id', leadId)
        .order('conversion_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching conversion history:', error);
      return [];
    }
  }

  /**
   * Bulk convert multiple leads
   */
  static async bulkConvertLeads(
    leadIds: string[], 
    options: LeadConversionOptions
  ): Promise<ConversionResult[]> {
    const results: ConversionResult[] = [];
    
    for (const leadId of leadIds) {
      const result = await this.convertLead(leadId, options);
      results.push(result);
    }
    
    return results;
  }

  /**
   * Get contacts with optional filters
   */
  static async getContacts(filters?: {
    account_id?: string;
    contact_status?: string;
    lead_source?: string;
    converted_from_lead_id?: string;
  }): Promise<Contact[]> {
    try {
      let query = supabase
        .from('crm_contacts')
        .select(`
          *,
          account:crm_accounts(id, account_name),
          converted_from_lead:crm_leads(id, first_name, last_name)
        `)
        .order('created_at', { ascending: false });

      if (filters?.account_id) {
        query = query.eq('account_id', filters.account_id);
      }
      if (filters?.contact_status) {
        query = query.eq('contact_status', filters.contact_status);
      }
      if (filters?.lead_source) {
        query = query.eq('lead_source', filters.lead_source);
      }
      if (filters?.converted_from_lead_id) {
        query = query.eq('converted_from_lead_id', filters.converted_from_lead_id);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching contacts:', error);
      return [];
    }
  }

  /**
   * Get accounts with optional filters
   */
  static async getAccounts(filters?: {
    account_type?: string;
    industry?: string;
    assigned_to?: string;
    converted_from_lead_id?: string;
  }): Promise<Account[]> {
    try {
      let query = supabase
        .from('crm_accounts')
        .select(`
          *,
          primary_contact:crm_contacts(id, first_name, last_name, email),
          contacts:crm_contacts(count),
          opportunities:crm_opportunities(count)
        `)
        .order('created_at', { ascending: false });

      if (filters?.account_type) {
        query = query.eq('account_type', filters.account_type);
      }
      if (filters?.industry) {
        query = query.eq('industry', filters.industry);
      }
      if (filters?.assigned_to) {
        query = query.eq('assigned_to', filters.assigned_to);
      }
      if (filters?.converted_from_lead_id) {
        query = query.eq('converted_from_lead_id', filters.converted_from_lead_id);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching accounts:', error);
      return [];
    }
  }

  /**
   * Get lead with conversion data
   */
  static async getLeadWithConversionData(leadId: string) {
    try {
      const { data, error } = await supabase
        .from('crm_leads')
        .select(`
          *,
          converted_contact:crm_contacts(id, first_name, last_name, email),
          converted_account:crm_accounts(id, account_name),
          converted_opportunity:crm_opportunities(id, opportunity_name, estimated_value),
          conversion_audit:crm_conversion_audit(*)
        `)
        .eq('id', leadId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching lead with conversion data:', error);
      throw error;
    }
  }
}