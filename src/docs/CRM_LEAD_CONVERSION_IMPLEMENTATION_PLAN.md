# CRM Lead Conversion System Implementation Plan

## Executive Summary

This document provides a comprehensive implementation plan for adding industry-standard lead conversion functionality to the CRM system. The current system has a significant gap where leads can be marked as "converted" but lack the actual conversion mechanism to create opportunities, contacts, and accounts.

## Current State Analysis

### Existing Architecture
- ✅ **Leads Table**: Well-structured with proper fields and status workflow
- ✅ **Opportunities Table**: Exists with lead_id foreign key relationship
- ✅ **Activities Table**: Supports both lead and opportunity associations
- ✅ **Database Schema**: Includes conversion tracking fields (`converted_date`, `converted_to_opportunity_id`)
- ❌ **Missing**: Dedicated Contacts and Accounts tables
- ❌ **Missing**: Automated conversion workflow and service layer

### Critical Gaps Identified
1. **No Lead Conversion Mechanism**: Manual status updates without data flow
2. **Missing Standard CRM Entities**: No Contacts or Accounts tables
3. **Poor Data Preservation**: No audit trail for conversions
4. **Inconsistent Pipeline Visibility**: Manual processes lead to data gaps
5. **Forecasting Inaccuracy**: Lack of proper lead-to-opportunity tracking

## Implementation Plan

### Phase 1: Database Schema Enhancement

#### 1.1 New Tables Creation

**Contacts Table**
```sql
-- CRM Contacts Table
CREATE TABLE IF NOT EXISTS public.crm_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    mobile_phone VARCHAR(50),
    title VARCHAR(255),
    department VARCHAR(100),
    account_id UUID REFERENCES public.crm_accounts(id) ON DELETE SET NULL,
    lead_source VARCHAR(50) DEFAULT 'unknown',
    converted_from_lead_id UUID REFERENCES public.crm_leads(id) ON DELETE SET NULL,
    contact_status VARCHAR(50) DEFAULT 'active' CHECK (contact_status IN ('active', 'inactive', 'bounced')),
    preferred_contact_method VARCHAR(20) DEFAULT 'email' CHECK (preferred_contact_method IN ('email', 'phone', 'mobile')),
    do_not_call BOOLEAN DEFAULT false,
    do_not_email BOOLEAN DEFAULT false,
    last_activity_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) DEFAULT auth.uid()
);

-- Enable RLS
ALTER TABLE public.crm_contacts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "SA and AD can manage contacts" ON public.crm_contacts FOR ALL TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('SA', 'AD')
    )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_crm_contacts_email ON public.crm_contacts(email);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_account_id ON public.crm_contacts(account_id);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_lead_id ON public.crm_contacts(converted_from_lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_status ON public.crm_contacts(contact_status);
```

**Accounts Table**
```sql
-- CRM Accounts Table
CREATE TABLE IF NOT EXISTS public.crm_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_name VARCHAR(255) NOT NULL,
    account_type VARCHAR(100) DEFAULT 'prospect' CHECK (account_type IN ('prospect', 'customer', 'partner', 'competitor')),
    industry VARCHAR(100),
    company_size VARCHAR(50),
    annual_revenue DECIMAL(15,2),
    website VARCHAR(255),
    phone VARCHAR(50),
    fax VARCHAR(50),
    billing_address TEXT,
    shipping_address TEXT,
    billing_city VARCHAR(100),
    billing_state VARCHAR(100),
    billing_postal_code VARCHAR(20),
    billing_country VARCHAR(100),
    shipping_city VARCHAR(100),
    shipping_state VARCHAR(100),
    shipping_postal_code VARCHAR(20),
    shipping_country VARCHAR(100),
    parent_account_id UUID REFERENCES public.crm_accounts(id) ON DELETE SET NULL,
    converted_from_lead_id UUID REFERENCES public.crm_leads(id) ON DELETE SET NULL,
    account_status VARCHAR(50) DEFAULT 'active' CHECK (account_status IN ('active', 'inactive', 'suspended')),
    primary_contact_id UUID, -- Will be set after contacts table creation
    assigned_to UUID REFERENCES auth.users(id),
    last_activity_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) DEFAULT auth.uid()
);

-- Enable RLS
ALTER TABLE public.crm_accounts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "SA and AD can manage accounts" ON public.crm_accounts FOR ALL TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('SA', 'AD')
    )
);

-- Add foreign key constraint after contacts table is created
ALTER TABLE public.crm_accounts 
ADD CONSTRAINT crm_accounts_primary_contact_fkey 
FOREIGN KEY (primary_contact_id) REFERENCES public.crm_contacts(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_crm_accounts_name ON public.crm_accounts(account_name);
CREATE INDEX IF NOT EXISTS idx_crm_accounts_type ON public.crm_accounts(account_type);
CREATE INDEX IF NOT EXISTS idx_crm_accounts_industry ON public.crm_accounts(industry);
CREATE INDEX IF NOT EXISTS idx_crm_accounts_assigned_to ON public.crm_accounts(assigned_to);
CREATE INDEX IF NOT EXISTS idx_crm_accounts_lead_id ON public.crm_accounts(converted_from_lead_id);
```

**Conversion Audit Table**
```sql
-- CRM Conversion Audit Table
CREATE TABLE IF NOT EXISTS public.crm_conversion_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES public.crm_leads(id) ON DELETE CASCADE,
    conversion_type VARCHAR(50) NOT NULL CHECK (conversion_type IN ('full', 'contact_only', 'account_only', 'opportunity_only')),
    before_data JSONB NOT NULL,
    after_data JSONB NOT NULL,
    created_entities JSONB NOT NULL, -- {contact_id, account_id, opportunity_id}
    conversion_options JSONB, -- Store the conversion options used
    converted_by UUID REFERENCES auth.users(id) NOT NULL,
    conversion_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    success BOOLEAN DEFAULT true,
    error_details TEXT
);

-- Enable RLS
ALTER TABLE public.crm_conversion_audit ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "SA and AD can view conversion audit" ON public.crm_conversion_audit FOR SELECT TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('SA', 'AD')
    )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_crm_conversion_audit_lead_id ON public.crm_conversion_audit(lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_conversion_audit_date ON public.crm_conversion_audit(conversion_date);
CREATE INDEX IF NOT EXISTS idx_crm_conversion_audit_converted_by ON public.crm_conversion_audit(converted_by);
```

#### 1.2 Existing Table Enhancements

**Leads Table Enhancements**
```sql
-- Add conversion tracking fields to leads table
ALTER TABLE public.crm_leads 
ADD COLUMN IF NOT EXISTS converted_contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS converted_account_id UUID REFERENCES public.crm_accounts(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS converted_opportunity_id UUID REFERENCES public.crm_opportunities(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS conversion_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS conversion_notes TEXT,
ADD COLUMN IF NOT EXISTS converted_by UUID REFERENCES auth.users(id);

-- Add indexes for conversion tracking
CREATE INDEX IF NOT EXISTS idx_crm_leads_converted_contact ON public.crm_leads(converted_contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_leads_converted_account ON public.crm_leads(converted_account_id);
CREATE INDEX IF NOT EXISTS idx_crm_leads_converted_opportunity ON public.crm_leads(converted_opportunity_id);
CREATE INDEX IF NOT EXISTS idx_crm_leads_conversion_date ON public.crm_leads(conversion_date);
```

**Opportunities Table Enhancements**
```sql
-- Add contact and account references to opportunities
ALTER TABLE public.crm_opportunities 
ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES public.crm_accounts(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS converted_from_lead_id UUID REFERENCES public.crm_leads(id) ON DELETE SET NULL;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_crm_opportunities_contact_id ON public.crm_opportunities(contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_opportunities_account_id ON public.crm_opportunities(account_id);
CREATE INDEX IF NOT EXISTS idx_crm_opportunities_converted_from_lead ON public.crm_opportunities(converted_from_lead_id);
```

#### 1.3 Triggers and Functions

**Updated At Triggers**
```sql
-- Add updated_at triggers for new tables
CREATE TRIGGER update_crm_contacts_updated_at 
    BEFORE UPDATE ON public.crm_contacts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_simple();

CREATE TRIGGER update_crm_accounts_updated_at 
    BEFORE UPDATE ON public.crm_accounts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_simple();
```

### Phase 2: Core Service Implementation

#### 2.1 Lead Conversion Service

**File: `src/services/crm/leadConversionService.ts`**

```typescript
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
  static async bul
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
}
```

#### 2.2 Enhanced CRM Service Integration

**File: `src/services/crm/crmService.ts` - Enhancements**

```typescript
// Add to existing CRMService class

// Contact Management
static async getContacts(filters?: {
  account_id?: string;
  contact_status?: string;
  lead_source?: string;
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

    const { data, error } = await query;
    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return [];
  }
}

// Account Management
static async getAccounts(filters?: {
  account_type?: string;
  industry?: string;
  assigned_to?: string;
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

    const { data, error } = await query;
    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return [];
  }
}

// Enhanced Lead methods with conversion tracking
static async getLeadWithConversionData(leadId: string): Promise<Lead & ConversionData> {
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
```

### Phase 3: User Interface Implementation

#### 3.1 Lead Conversion Modal Component

**File: `src/components/crm/LeadConversionModal.tsx`**

```typescript
import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  AlertTriangle, 
  CheckCircle, 
  User, 
  Building, 
  Target, 
  ArrowRight,
  Eye,
  Settings
} from 'lucide-react';
import { 
  LeadConversionService, 
  LeadConversionOptions, 
  DEFAULT_CONVERSION_OPTIONS,
  ConversionResult,
  ConversionValidation,
  ConversionPreview
} from '@/services/crm/leadConversionService';
import { Lead } from '@/services/crm/crmService';
import { toast } from 'sonner';

interface LeadConversionModalProps {
  lead: Lead;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (result: ConversionResult) => void;
}

export const LeadConversionModal: React.FC<LeadConversionModalProps> = ({
  lead,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [options, setOptions] = useState<LeadConversionOptions>(DEFAULT_CONVERSION_OPTIONS);
  const [activeTab, setActiveTab] = useState('options');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Validation query
  const { data: validation, isLoading: isValidating } = useQuery({
    queryKey: ['lead-conversion-validation', lead.id],
    queryFn: () => LeadConversionService.validateConversion(lead.id),
    enabled: isOpen
  });

  // Preview query
  const { data: preview, isLoading: isLoadingPreview } = useQuery({
    queryKey: ['lead-conversion-preview', lead.id, options],
    queryFn: () => LeadConversionService.getConversionPreview(lead.id, options),
    enabled: isOpen && validation?.canProceed
  });

  // Conversion mutation
  const conversionMutation = useMutation({
    mutationFn: () => LeadConversionService.convertLead(lead.id, options),
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Lead converted successfully!');
        onSuccess(result);
        onClose();
      } else {
        toast.error('Conversion failed: ' + (result.errors?.join(', ') || 'Unknown error'));
      }
    },
    onError: (error) => {
      toast.error('Conversion failed: ' + error.message);
    }
  });

  // Reset options when modal opens
  useEffect(() => {
    if (isOpen) {
      setOptions({
        ...DEFAULT_CONVERSION_OPTIONS,
        opportunityName: `${lead.company || lead.first_name + ' ' + lead.last_name} - Training Opportunity`,
        contactTitle: lead.title
      });
      setActiveTab('options');
    }
  }, [isOpen, lead]);

  const handleConvert = () => {
    conversionMutation.mutate();
  };

  const canProceed = validation?.canProceed && !isValidating && !conversionMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5" />
            Convert Lead: {lead.first_name} {lead.last_name}
          </DialogTitle>
        </DialogHeader>

        {/* Validation Alerts */}
        {validation && (
          <div className="space-y-2">
            {validation.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium">Cannot proceed with conversion:</div>
                  <ul className="list-disc list-inside mt-1">
                    {validation.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            
            {validation.warnings.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium">Warnings:</div>
                  <ul className="list-disc list-inside mt-1">
                    {validation.warnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="options">Conversion Options</TabsTrigger>
            <TabsTrigger value="preview" disabled={!validation?.canProceed}>
              <Eye className="h-4 w-4 mr-1" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="advanced">
              <Settings className="h-4 w-4 mr-1" />
              Advanced
            </TabsTrigger>
          </TabsList>

          <TabsContent value="options" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Contact Creation */}
              <Card className={options.createContact ? 'ring-2 ring-blue-500' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <CardTitle className="text-sm">Create Contact</CardTitle>
                    </div>
                    <Checkbox
                      checked={options.createContact}
                      onCheckedChange={(checked) => 
                        setOptions(prev => ({ ...prev, createContact: !!checked }))
                      }
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label htmlFor="contactTitle">Title</Label>
                    <Input
                      id="contactTitle"
                      value={options.contactTitle || ''}
                      onChange={(e) => setOptions(prev => ({ ...prev, contactTitle: e.target.value }))}
                      placeholder={lead.title || 'Contact title'}
                      disabled={!options.createContact}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Email: {lead.email}<br/>
                    Phone: {lead.phone || 'Not provided'}
                  </div>
                </CardContent>
              </Card>

              {/* Account Creation */}
              <Card className={options.createAccount ? 'ring-2 ring-green-500' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      <CardTitle className="text-sm">Create Account</CardTitle>
                    </div>
                    <Checkbox
                      checked={options.createAccount}
                      onCheckedChange={(checked) => 
                        setOptions(prev => ({ ...prev, createAccount: !!checked }))
                      }
                      disabled={!lead.company}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label htmlFor="accountType">Account Type</Label>
                    <Select
                      value={options.accountType}
                      onValueChange={(value) => setOptions(prev => ({ ...prev, accountType: value }))}
                      disabled={!options.createAccount}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="prospect">Prospect</SelectItem>
                        <SelectItem value="customer">Customer</SelectItem>
                        <SelectItem value="partner">Partner</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="accountIndustry">Industry</Label>
                    <Input
                      id="accountIndustry"
                      value={options.accountIndustry || ''}
                      onChange={(e) => setOptions(prev => ({ ...prev, accountIndustry: e.target.value }))}
                      placeholder="Industry"
                      disabled={!options.createAccount}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Company: {lead.company || 'Not provided'}
                  </div>
                </CardContent>
              </Card>

              {/* Opportunity Creation */}
              <Card className={options.createOpportunity ? 'ring-2 ring-purple-500' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      <CardTitle className="text-sm">Create Opportunity</CardTitle>
                    </div>
                    <Checkbox
                      checked={options.createOpportunity}
                      onCheckedChange={(checked) => 
                        setOptions(prev => ({ ...prev, createOpportunity: !!checked }))
                      }
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label htmlFor="opportunityName">Opportunity Name</Label>
                    <Input
                      id="opportunityName"
                      value={options.opportunityName || ''}
                      onChange={(e) => setOptions(prev => ({ ...prev, opportunityName: e.target.value }))}
                      disabled={!options.createOpportunity}
                    />
                  </div>
                  <div>
                    <Label htmlFor="opportunityValue">Estimated Value ($)</Label>
                    <Input
                      id="opportunityValue"
                      type="number"
                      value={options.opportunityValue || ''}
                      onChange={(e) => setOptions(prev => ({ ...prev, opportunityValue: Number(e.target.value) }))}
                      disabled={!options.createOpportunity}
                    />
                  </div>
                  <div>
                    <Label htmlFor="opportunityStage">Stage</Label>
                    <Select
                      value={options.opportunityStage}
                      onValueChange={(value) => setOptions(prev => ({ ...prev, opportunityStage: value }))}
                      disabled={!options.createOpportunity}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="prospect">Prospect</SelectItem>
                        <SelectItem value="proposal">Proposal</SelectItem>
                        <SelectItem value="negotiation">Negotiation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="conversionNotes">Conversion Notes</Label>
                <Textarea
                  id="conversionNotes"
                  value={options.conversionNotes || ''}
                  onChange={(e) => setOptions(prev => ({ ...prev, conversionNotes: e.target.value }))}
                  placeholder="Add notes about this conversion..."
                  rows={3}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="space-y-6">
            {isLoadingPreview ? (
              <div className="text-center py-8">Loading preview...</div>
            ) : preview ? (
              <div className="space-y-6">
                <div className="text-sm text-muted-foreground">
                  Preview of entities that will be created:
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {preview.proposedContact && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                          <User className="h-4 w-4" />
                          New Contact
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div><strong>Name:</strong> {preview.proposedContact.first_name} {preview.proposedContact.last_name}</div>
                        <div><strong>Email:</strong> {preview.proposedContact.email}</div>
                        <div><strong>Title:</strong> {preview.proposedContact.title || 'Not specified'}</div>
                        <div><strong>Source:</strong> {preview.proposedContact.lead_source}</div>
                      </CardContent>
                    </Card>
                  )}

                  {preview.proposedAccount && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Building className="h-4 w-4" />
                          New Account
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div><strong>Name:</strong> {preview.proposedAccount.account_name}</div>
                        <div><strong>Type:</strong> {preview.proposedAccount.account_type}</div>
                        <div><strong>Industry:</strong> {preview.proposedAccount.industry || 'Not specified'}</div>
                      </CardContent>
                    </Card>
                  )}

                  {preview.proposedOpportunity && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          New Opportunity
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div><strong>Name:</strong> {preview.proposedOpportunity.opportunity_name}</div>
                        <div><strong>Value:</strong> ${preview.proposedOpportunity.estimated_value?.toLocaleString()}</div>
                        <div><strong>Stage:</strong> {preview.proposedOpportunity.stage}</div>
                        <div><strong>Close Date:</strong> {preview.proposedOpportunity.expected_close_date || 'Not set'}</div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {preview.dataMapping.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Data Mapping</CardTitle>
                      <CardDescription>How lead data will be mapped to new entities</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {preview.dataMapping.map((mapping, index) => (
                          <div key={index} className="flex items-center justify-between text-sm border-b pb-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{mapping.targetEntity}</Badge>
                              <span>{mapping.sourceField}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">{mapping.sourceValue}</span>
                              <ArrowRight className="h-3 w-3" />
                              <span>{mapping.targetValue}</span>
                              {mapping.transformation && (
                                <Badge variant="secondary" className="text-xs">Transformed</Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : null}
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Advanced Options</CardTitle>
                <CardDescription>Additional conversion settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="preserveLeadData"
                    checked={options.preserveLeadData}
                    onCheckedChange={(checked) => 
                      setOptions(prev => ({ ...prev, preserveLeadData: !!checked }))
                    }
                  />
                  <Label htmlFor="preserveLeadData">Preserve lead data after conversion</Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="opportunityCloseDate">Expected Close Date</Label>
                  <Input
                    id="opportunityCloseDate"
                    type="date"
                    value={options.opportunityCloseDate || ''}
                    onChange={(e) => setOptions(prev => ({ ...prev, opportunityCloseDate: e.target.value }))}
                    disabled={!options.createOpportunity}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleConvert}
            disabled={!canProceed}
            className="min-w-32"
          >
            {conversionMutation.isPending ? 'Converting...' : 'Convert Lead'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
```

#### 3.2 Enhanced LeadsTable Integration

**File: `src/components/crm/LeadsTable.tsx` - Enhancements**

```typescript
// Add to existing imports
import { LeadConversionModal } from './LeadConversionModal';
import { ArrowRight } from 'lucide-react';

// Add to component state
const [conversionModalOpen, setConversionModalOpen] = useState(false);
const [leadToConvert, setLeadToConvert] = useState<Lead | null>(null);

// Add conversion handler
const handleConvertLead = (lead: Lead) => {
  setLeadToConvert(lead);
  setConversionModalOpen(true);
};

const handleConversionSuccess = (result: ConversionResult) => {
  toast.success(`Lead converted successfully! Created ${Object.keys(result).filter(k => k.endsWith('Id') && result[k]).length} entities.`);
  queryClient.invalidateQueries({ queryKey: ['leads'] });
};

// Add to dropdown menu in actions column
<DropdownMenuItem 
  onClick={() => handleConvertLead(lead)}
  disabled={lead.status === 'converted' || lead.status === 'lost'}
>
  <ArrowRight className="mr-2 h-4 w-4" />
  Convert Lead
</DropdownMenuItem>

// Add modal at the end of component return
{leadToConvert && (
  <LeadConversionModal
    lead={leadToConvert}
    isOpen={conversionModalOpen}
    onClose={() => {
      setConversionModalOpen(false);
      setLeadToConvert(null);
    }}
    onSuccess={handleConversionSuccess}
  />
)}
```

### Phase 4: Workflow Automation & Business Rules

#### 4.1 Conversion Rules Engine

**File: `src/services/crm/conversionRulesService.ts`**

```typescript
import { supabase } from '@/integrations/supabase/client';

export interface ConversionRule {
  id: string;
  rule_name: string;
  rule_description?: string;
  conditions: ConversionCondition[];
  actions: ConversionAction[];
  is_active: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface ConversionCondition {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'not_equals';
  value: any;
  logical_operator?: 'AND' | 'OR';
}

export interface ConversionAction {
  type: 'auto_convert' | 'require_approval' | 'assign_to' | 'set_opportunity_value' | 'notify_user';
  parameters: Record<string, any>;
}

export interface RuleEvaluationResult {
  ruleId: string;
  ruleName: string;
  matched: boolean;
  actions: ConversionAction[];
  priority: number;
}

export class ConversionRulesService {
  /**
   * Evaluate all active rules against a lead
   */
  static async evaluateRulesForLead(leadId: string): Promise<RuleEvaluationResult[]> {
    try {
      // Get lead data
      const { data: lead, error: leadError } = await supabase
        .from('crm_leads')
        .select('*')
        .eq('id', leadId)
        .single();

      if (leadError || !lead) {
        throw new Error('Lead not found');
      }

      // Get active rules
      const { data: rules, error: rulesError } = await supabase
        .from('crm_conversion_rules')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: false });

      if (rulesError) {
        throw rulesError;
      }

      const results: RuleEvaluationResult[] = [];

      for (const rule of rules || []) {
        const matched = this.evaluateConditions(lead, rule.conditions);
        
        results.push({
          ruleId: rule.id,
          ruleName: rule.rule_name,
          matched,
          actions: matched ? rule.actions : [],
          priority: rule.priority
        });
      }

      return results.filter(r => r.matched).sort((a, b) => b.priority - a.priority);

    } catch (error) {
      console.error('Error evaluating conversion rules:', error);
      return [];
    }
  }

  /**
   * Evaluate conditions against lead data
   */
  private static evaluateConditions(lead: any, conditions: ConversionCondition[]): boolean {
    if (!conditions || conditions.length === 0) return true;

    let result = true;
    let currentLogicalOp = 'AND';

    for (let i = 0; i < conditions.length; i++) {
      const condition = conditions[i];
      const conditionResult = this.evaluateCondition(lead, condition);

      if (i === 0) {
        result = conditionResult;
      } else {
        if (currentLogicalOp === 'AND') {
          result = result && conditionResult;
        } else {
          result = result || conditionResult;
        }
      }

      // Set logical operator for next iteration
      if (condition.logical_operator) {
        currentLogicalOp = condition.logical_operator;
      }
    }

    return result;
  }

  /**
   * Evaluate a single condition
   */
  private static evaluateCondition(lead: any, condition: ConversionCondition): boolean {
    const fieldValue = lead[condition.field];
    const conditionValue = condition.value;

    switch (condition.operator) {
      case 'equals':
        return fieldValue === conditionValue;
      case 'not_equals':
        return fieldValue !== conditionValue;
      case 'contains':
        return String(fieldValue || '').toLowerCase().includes(String(conditionValue).toLowerCase());
      case 'greater_than':
        return Number(fieldValue || 0) > Number(conditionValue);
      case 'less_than':
        return Number(fieldValue || 0) < Number(conditionValue);
      default:
        return false;
    }
  }

  /**
   * Execute rule actions
   */
  static async executeRuleActions(
    leadId: string, 
    actions: ConversionAction[]
  ): Promise<{ success: boolean; results: any[] }> {
    const results = [];

    for (const action of actions) {
      try {
        const result = await this.executeAction(leadId, action);
        results.push({ action: action.type, success: true, result });
      } catch (error) {
        results.push({ action: action.type, success: false, error: error.message });
      }
    }

    return {
      success: results.every(r => r.success),
      results
    };
  }

  /**
   * Execute a single action
   */
  private static async executeAction(leadId: string, action: ConversionAction): Promise<any> {
    switch (action.type) {
      case 'auto_convert':
        const { LeadConversionService } = await import('./leadConversionService');
        return await LeadConversionService.convertLead(leadId, action.parameters);

      case 'assign_to':
        return await supabase
          .from('crm_leads')
          .update({ assigned_to: action.parameters.user_id })
          .eq('id', leadId);

      case 'set_opportunity_value':
        // This would be used during conversion
        return { opportunityValue: action.parameters.value };

      case 'notify_user':
        // Implement notification logic
        return { notified: action.parameters.user_id };

      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  /**
   * Create a new conversion rule
   */
  static async createRule(rule: Omit<ConversionRule, 'id' | 'created_at' | 'updated_at'>): Promise<ConversionRule> {
    const { data, error } = await supabase
      .from('crm_conversion_rules')
      .insert(rule)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get all conversion rules
   */
  static async getRules(): Promise<ConversionRule[]> {
    const { data, error } = await supabase
      .from('crm_conversion_rules')
      .select('*')
      .order('priority', { ascending: false });

    if (error
if (error) throw error;
    return data || [];
  }

  /**
   * Update a conversion rule
   */
  static async updateRule(id: string, updates: Partial<ConversionRule>): Promise<ConversionRule> {
    const { data, error } = await supabase
      .from('crm_conversion_rules')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete a conversion rule
   */
  static async deleteRule(id: string): Promise<void> {
    const { error } = await supabase
      .from('crm_conversion_rules')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}
```

#### 4.2 Automated Conversion Triggers

**File: `src/services/crm/conversionTriggerService.ts`**

```typescript
import { ConversionRulesService } from './conversionRulesService';
import { LeadConversionService } from './leadConversionService';

export interface TriggerEvent {
  type: 'lead_updated' | 'lead_scored' | 'activity_completed' | 'time_based';
  leadId: string;
  data?: any;
}

export class ConversionTriggerService {
  /**
   * Process trigger event and evaluate conversion rules
   */
  static async processTriggerEvent(event: TriggerEvent): Promise<void> {
    try {
      console.log(`Processing trigger event: ${event.type} for lead ${event.leadId}`);

      // Evaluate rules for the lead
      const ruleResults = await ConversionRulesService.evaluateRulesForLead(event.leadId);

      if (ruleResults.length === 0) {
        console.log('No matching rules found');
        return;
      }

      // Execute highest priority rule actions
      const highestPriorityRule = ruleResults[0];
      console.log(`Executing actions for rule: ${highestPriorityRule.ruleName}`);

      const actionResults = await ConversionRulesService.executeRuleActions(
        event.leadId,
        highestPriorityRule.actions
      );

      console.log('Action results:', actionResults);

      // Log trigger execution
      await this.logTriggerExecution(event, highestPriorityRule, actionResults);

    } catch (error) {
      console.error('Error processing trigger event:', error);
      await this.logTriggerError(event, error);
    }
  }

  /**
   * Check for time-based triggers (called by scheduled job)
   */
  static async checkTimeBased(): Promise<void> {
    try {
      // Get leads that might need time-based conversion
      const { data: leads } = await supabase
        .from('crm_leads')
        .select('*')
        .eq('lead_status', 'qualified')
        .lt('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()); // 7 days old

      for (const lead of leads || []) {
        await this.processTriggerEvent({
          type: 'time_based',
          leadId: lead.id,
          data: { daysOld: Math.floor((Date.now() - new Date(lead.created_at).getTime()) / (24 * 60 * 60 * 1000)) }
        });
      }
    } catch (error) {
      console.error('Error checking time-based triggers:', error);
    }
  }

  /**
   * Log trigger execution
   */
  private static async logTriggerExecution(
    event: TriggerEvent,
    rule: any,
    results: any
  ): Promise<void> {
    try {
      await supabase
        .from('crm_trigger_log')
        .insert({
          trigger_type: event.type,
          lead_id: event.leadId,
          rule_id: rule.ruleId,
          rule_name: rule.ruleName,
          actions_executed: rule.actions,
          results: results,
          success: results.success,
          executed_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error logging trigger execution:', error);
    }
  }

  /**
   * Log trigger error
   */
  private static async logTriggerError(event: TriggerEvent, error: any): Promise<void> {
    try {
      await supabase
        .from('crm_trigger_log')
        .insert({
          trigger_type: event.type,
          lead_id: event.leadId,
          success: false,
          error_details: error.message,
          executed_at: new Date().toISOString()
        });
    } catch (logError) {
      console.error('Error logging trigger error:', logError);
    }
  }
}
```

### Phase 5: Integration & Data Preservation

#### 5.1 Enhanced CRM Service Integration

**File: `src/services/crm/crmService.ts` - Additional Enhancements**

```typescript
// Add Contact and Account interfaces
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

// Add conversion tracking to existing Lead interface
export interface LeadWithConversion extends Lead {
  converted_contact_id?: string;
  converted_account_id?: string;
  converted_opportunity_id?: string;
  conversion_date?: string;
  conversion_notes?: string;
  converted_by?: string;
  converted_contact?: Contact;
  converted_account?: Account;
  converted_opportunity?: Opportunity;
}
```

#### 5.2 API Integration Points

**File: `src/services/crm/crmApiService.ts`**

```typescript
import { supabase } from '@/integrations/supabase/client';

export class CRMApiService {
  /**
   * Webhook endpoint for external lead creation
   */
  static async handleWebhookLead(webhookData: any): Promise<{ success: boolean; leadId?: string; error?: string }> {
    try {
      // Validate webhook data
      const validatedData = this.validateWebhookData(webhookData);
      
      // Create lead
      const lead = await CRMService.createLead(validatedData);
      
      // Check for auto-conversion rules
      const { ConversionTriggerService } = await import('./conversionTriggerService');
      await ConversionTriggerService.processTriggerEvent({
        type: 'lead_updated',
        leadId: lead.id
      });
      
      return { success: true, leadId: lead.id };
    } catch (error) {
      console.error('Webhook lead creation failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Sync conversion data with external systems
   */
  static async syncConversionData(conversionResult: ConversionResult): Promise<void> {
    try {
      // Example: Sync with external CRM
      if (process.env.EXTERNAL_CRM_WEBHOOK_URL) {
        await fetch(process.env.EXTERNAL_CRM_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'lead_converted',
            data: conversionResult
          })
        });
      }

      // Example: Update marketing automation platform
      if (process.env.MARKETING_AUTOMATION_API_KEY && conversionResult.contactId) {
        await this.updateMarketingAutomation(conversionResult);
      }

    } catch (error) {
      console.error('Error syncing conversion data:', error);
      // Don't throw - this shouldn't fail the conversion
    }
  }

  /**
   * Export conversion data for reporting
   */
  static async exportConversionData(filters: {
    startDate?: string;
    endDate?: string;
    convertedBy?: string;
  }): Promise<any[]> {
    try {
      let query = supabase
        .from('crm_conversion_audit')
        .select(`
          *,
          lead:crm_leads(*),
          converted_by_profile:profiles!crm_conversion_audit_converted_by_fkey(first_name, last_name, email)
        `)
        .eq('success', true);

      if (filters.startDate) {
        query = query.gte('conversion_date', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('conversion_date', filters.endDate);
      }
      if (filters.convertedBy) {
        query = query.eq('converted_by', filters.convertedBy);
      }

      const { data, error } = await query.order('conversion_date', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error exporting conversion data:', error);
      return [];
    }
  }

  private static validateWebhookData(data: any): Omit<Lead, 'id' | 'created_at' | 'updated_at'> {
    // Implement validation logic
    return {
      first_name: data.firstName || '',
      last_name: data.lastName || '',
      email: data.email,
      phone: data.phone,
      company: data.company,
      title: data.title,
      status: 'new',
      source: data.source || 'website',
      notes: data.notes
    };
  }

  private static async updateMarketingAutomation(conversionResult: ConversionResult): Promise<void> {
    // Implement marketing automation update logic
    console.log('Updating marketing automation for conversion:', conversionResult);
  }
}
```

### Phase 6: Testing Strategy

#### 6.1 Unit Tests

**File: `src/services/crm/__tests__/leadConversionService.test.ts`**

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LeadConversionService, DEFAULT_CONVERSION_OPTIONS } from '../leadConversionService';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn()
        }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn()
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn()
      }))
    })),
    auth: {
      getUser: vi.fn(() => ({
        data: { user: { id: 'test-user-id' } }
      }))
    }
  }
}));

describe('LeadConversionService', () => {
  const mockLead = {
    id: 'test-lead-id',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    phone: '555-1234',
    company_name: 'Test Company',
    job_title: 'Manager',
    lead_status: 'qualified',
    lead_source: 'website'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validateConversion', () => {
    it('should validate a qualified lead successfully', async () => {
      // Mock successful lead fetch
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: mockLead, error: null })
        }))
      }));
      
      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect
      } as any);

      const result = await LeadConversionService.validateConversion('test-lead-id');

      expect(result.isValid).toBe(true);
      expect(result.canProceed).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject conversion for already converted lead', async () => {
      const convertedLead = { ...mockLead, lead_status: 'converted' };
      
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: convertedLead, error: null })
        }))
      }));
      
      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect
      } as any);

      const result = await LeadConversionService.validateConversion('test-lead-id');

      expect(result.isValid).toBe(false);
      expect(result.canProceed).toBe(false);
      expect(result.errors).toContain('Lead is already converted');
    });

    it('should reject conversion for lead without email', async () => {
      const leadWithoutEmail = { ...mockLead, email: null };
      
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: leadWithoutEmail, error: null })
        }))
      }));
      
      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect
      } as any);

      const result = await LeadConversionService.validateConversion('test-lead-id');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Lead must have an email address');
    });
  });

  describe('getConversionPreview', () => {
    it('should generate correct preview for full conversion', async () => {
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: mockLead, error: null })
        }))
      }));
      
      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect
      } as any);

      const preview = await LeadConversionService.getConversionPreview(
        'test-lead-id',
        DEFAULT_CONVERSION_OPTIONS
      );

      expect(preview.proposedContact).toBeDefined();
      expect(preview.proposedAccount).toBeDefined();
      expect(preview.proposedOpportunity).toBeDefined();
      expect(preview.proposedContact.email).toBe(mockLead.email);
      expect(preview.proposedAccount.account_name).toBe(mockLead.company_name);
    });
  });

  describe('convertLead', () => {
    it('should successfully convert a valid lead', async () => {
      // Mock all the database operations
      const mockOperations = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: mockLead, error: null })
          }))
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ 
              data: { id: 'new-entity-id' }, 
              error: null 
            })
          }))
        })),
        update: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ error: null })
        }))
      };

      vi.mocked(supabase.from).mockReturnValue(mockOperations as any);

      const result = await LeadConversionService.convertLead(
        'test-lead-id',
        DEFAULT_CONVERSION_OPTIONS
      );

      expect(result.success).toBe(true);
      expect(result.contactId).toBeDefined();
      expect(result.accountId).toBeDefined();
      expect(result.opportunityId).toBeDefined();
    });
  });
});
```

#### 6.2 Integration Tests

**File: `src/services/crm/__tests__/conversionIntegration.test.ts`**

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { LeadConversionService } from '../leadConversionService';
import { CRMService } from '../crmService';

// Integration tests require a test database
describe('Lead Conversion Integration Tests', () => {
  let testLeadId: string;
  let supabaseTest: any;

  beforeAll(async () => {
    // Setup test database connection
    supabaseTest = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Create test lead
    const testLead = await CRMService.createLead({
      first_name: 'Integration',
      last_name: 'Test',
      email: `integration-test-${Date.now()}@example.com`,
      phone: '555-0123',
      company: 'Test Integration Company',
      title: 'Test Manager',
      status: 'qualified',
      source: 'website',
      notes: 'Created for integration testing'
    });

    testLeadId = testLead.id;
  });

  afterAll(async () => {
    // Cleanup test data
    if (testLeadId) {
      await supabaseTest
        .from('crm_conversion_audit')
        .delete()
        .eq('lead_id', testLeadId);
      
      await supabaseTest
        .from('crm_opportunities')
        .delete()
        .eq('converted_from_lead_id', testLeadId);
      
      await supabaseTest
        .from('crm_contacts')
        .delete()
        .eq('converted_from_lead_id', testLeadId);
      
      await supabaseTest
        .from('crm_accounts')
        .delete()
        .eq('converted_from_lead_id', testLeadId);
      
      await supabaseTest
        .from('crm_leads')
        .delete()
        .eq('id', testLeadId);
    }
  });

  it('should perform end-to-end lead conversion', async () => {
    // Validate lead can be converted
    const validation = await LeadConversionService.validateConversion(testLeadId);
    expect(validation.canProceed).toBe(true);

    // Get conversion preview
    const preview = await LeadConversionService.getConversionPreview(testLeadId, {
      createContact: true,
      createAccount: true,
      createOpportunity: true,
      preserveLeadData: true,
      opportunityValue: 10000,
      conversionNotes: 'Integration test conversion'
    });

    expect(preview.proposedContact).toBeDefined();
    expect(preview.proposedAccount).toBeDefined();
    expect(preview.proposedOpportunity).toBeDefined();

    // Perform conversion
    const result = await LeadConversionService.convertLead(testLeadId, {
      createContact: true,
      createAccount: true,
      createOpportunity: true,
      preserveLeadData: true,
      opportunityValue: 10000,
      conversionNotes: 'Integration test conversion'
    });

    expect(result.success).toBe(true);
    expect(result.contactId).toBeDefined();
    expect(result.accountId).toBeDefined();
    expect(result.opportunityId).toBeDefined();
    expect(result.auditId).toBeDefined();

    // Verify lead status updated
    const updatedLead = await CRMService.getLeadWithConversionData(testLeadId);
    expect(updatedLead.lead_status).toBe('converted');
    expect(updatedLead.converted_contact_id).toBe(result.contactId);
    expect(updatedLead.converted_account_id).toBe(result.accountId);
    expect(updatedLead.converted_opportunity_id).toBe(result.opportunityId);

    // Verify entities were created correctly
    const contact = await CRMService.getContacts({ converted_from_lead_id: testLeadId });
    expect(contact).toHaveLength(1);
    expect(contact[0].email).toBe(updatedLead.email);

    const account = await CRMService.getAccounts({ converted_from_lead_id: testLeadId });
    expect(account).toHaveLength(1);
    expect(account[0].account_name).toBe(updatedLead.company_name);

    const opportunity = await CRMService.getOpportunities({ converted_from_lead_id: testLeadId });
    expect(opportunity).toHaveLength(1);
    expect(opportunity[0].estimated_value).toBe(10000);
  });
});
```

### Phase 7: Performance Optimization

#### 7.1 Database Optimization

```sql
-- Additional indexes for performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_crm_leads_conversion_status 
ON public.crm_leads(lead_status) WHERE lead_status IN ('qualified', 'converted');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_crm_conversion_audit_success_date 
ON public.crm_conversion_audit(success, conversion_date) WHERE success = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_crm_contacts_email_status 
ON public.crm_contacts(email, contact_status) WHERE contact_status = 'active';

-- Materialized view for conversion analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS crm_conversion_analytics AS
SELECT 
  DATE_TRUNC('month', conversion_date) as month,
  COUNT(*) as total_conversions,
  COUNT(CASE WHEN created_entities->>'contactId' IS NOT NULL THEN 1 END) as contacts_created,
  COUNT(CASE WHEN created_entities->>'accountId' IS NOT NULL THEN 1 END) as accounts_created,
  COUNT(CASE WHEN created_entities->>'opportunityId' IS NOT NULL THEN 1 END) as opportunities_created,
  AVG(EXTRACT(EPOCH FROM (conversion_date - (before_data->>'created_at')::timestamp))/86400) as avg_days_to_convert
FROM crm_conversion_audit 
WHERE success = true
GROUP BY DATE_TRUNC('month', conversion_date)
ORDER BY month DESC;

-- Refresh function for materialized view
CREATE OR REPLACE FUNCTION refresh_conversion_analytics()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW crm_conversion_analytics;
END;
$$ LANGUAGE plpgsql;
```

#### 7.2 Caching Strategy

**File: `src/services/crm/conversionCacheService.ts`**

```typescript
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class ConversionCacheService {
  private static cache = new Map<string, CacheEntry<any>>();
  private static readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  static set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  static get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  static invalidate(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  static clear(): void {
    this.cache.clear();
  }

  // Cache conversion validation results
  static async getCachedValidation(leadId: string): Promise<ConversionValidation | null> {
    return this.get(`validation:${leadId}`);
  }

  static setCachedValidation(leadId: string, validation: ConversionValidation): void {
    this.set(`validation:${leadId}`, validation, 2 * 60 * 1000); // 2 minutes
  }

  // Cache conversion previews
  static async getCachedPreview(leadId: string, optionsHash: string): Promise<ConversionPreview | null> {
    return this.get(`preview:${leadId}:${optionsHash}`);
  }

  static setCachedPreview(leadId: string, optionsHash: string, preview: ConversionPreview): void {
    this.set(`preview:${leadId}:${optionsHash}`, preview, 5 * 60 * 1000); // 5 minutes
  }
}
```

### Phase 8: Deployment & Monitoring

#### 8.1 Deployment Checklist

```markdown
## Pre-Deployment Checklist

### Database Migration
- [ ] Run database migration: `20250605_implement_lead_conversion_system.sql`
- [ ] Verify all tables created successfully
- [ ] Confirm RLS policies are active
- [ ] Test database performance with indexes
- [ ] Backup existing data

### Code Deployment
- [ ] Deploy LeadConversionService
- [ ] Deploy ConversionRulesService
- [ ] Deploy ConversionTriggerService
- [ ] Deploy UI components
- [ ] Update CRMService with new methods

### Configuration
- [ ] Set up environment variables for external integrations
- [ ] Configure webhook endpoints
- [ ] Set up monitoring alerts
- [ ] Configure backup schedules

### Testing
- [ ] Run unit tests
- [ ] Run integration tests
- [ ] Perform user acceptance testing
- [ ] Test conversion workflows end-to-end
- [ ] Verify data integrity

### Documentation
- [ ] Update API documentation
- [ ] Create user training materials
- [ ] Document troubleshooting procedures
- [ ] Update system architecture diagrams
```

#### 8.2 Monitoring & Alerting

**File: `src/services/monitoring/conversionMonitoringService.ts`**

```typescript
export class ConversionMonitoringService {
  /**
   * Monitor conversion success rates
   */
  static async monitorConversionRates(): Promise<void> {
    try {
      const { data: stats } = await supabase
        .from('crm_conversion_audit')
        .select('success, conversion_date')
        .gte('conversion_date', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      const total = stats?.length || 0;
      const successful = stats?.filter(s => s.success).length || 0;
      const successRate = total > 0 ? (successful / total) * 100 : 0;

      // Alert if success rate drops below threshold
      if (successRate < 95 && total > 10) {
        await this.sendAlert('conversion_success_rate_low', {
          successRate,
          total,
          successful
        });
      }

      // Log metrics
      console.log(`Conversion monitoring: ${successful}/${total} (${successRate.toFixed(1)}%)`);

    } catch (error) {
      console.error('Error monitoring conversion rates:', error);
      await this.sendAlert('conversion_monitoring_error', { error: error.message });
    }
  }

  /**
   * Monitor conversion performance
   */
  static async monitorPerformance(): Promise<void> {
    try {
      const { data: recentConversions } = await supabase
        .from('crm_conversion_audit')
        .select('conversion_date, before_data, created_entities')
        .gte('conversion_date', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Last hour
        .eq('success', true);

      if (!recentConversions?.length) return;

      // Calculate average conversion time
      const conversionTimes = recentConversions.map(c => {
        const conversionTime = new Date(c.conversion_date).getTime();
        const leadCreatedTime = new Date(c.before_data.created_at).getTime();
        return (conversionTime - leadCreatedTime) / (24 * 60 * 60 * 1000); // Days
      });

      const avgConversionTime = conversionTimes.reduce((a, b) => a + b, 0) / conversionTimes.length;

      // Alert if conversion time is too long
      if (avgConversionTime > 30) { // More than 30 days
        await this.sendAlert('conversion_time_high', {
          avgConversionTime: avgConversionTime.toFixed(1),
          count: recentConversions.length
        });
      }

    } catch (error) {
      console.error('Error monitoring conversion performance:', error);
    }
  }

  /**
   * Send alert to monitoring system
   */
  private static async sendAlert(type: string, data: any): Promise<void> {
    try {
      // Example: Send to external monitoring service
      if (process.env.MONITORING_WEBHOOK_URL) {
        await fetch(process.env.MONITORING_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            alert_type: type,
            timestamp: new Date().toISOString(),
            data
          })
        });
      }

      // Log locally
      console.warn(`ALERT [${type}]:`, data);

    } catch (error) {
      console.error('Error sending alert:', error);
    }
  }
}
```

## Implementation Timeline

### Week 1-2: Foundation
- **Days 1-3**: Database schema implementation
- **Days 4-7**: Core LeadConversionService development
- **Days 8-10**: Basic validation and preview functionality
- **Days 11-14**: Unit tests and initial integration testing

### Week 3-4: User Interface
- **Days 15-17**: LeadConversionModal component
- **Days 18-21**: Integration with existing LeadsTable
- **Days 22-24**: Advanced conversion options UI
- **Days 25-28**: User experience testing and refinement

### Week 5-6: Automation & Rules
- **Days
29-31**: ConversionRulesService development
- **Days 32-35**: ConversionTriggerService and automation
- **Days 36-42**: Rules engine testing and optimization

### Week 7-8: Integration & Performance
- **Days 43-45**: API integration points
- **Days 46-49**: Performance optimization and caching
- **Days 50-52**: External system integrations
- **Days 53-56**: Load testing and performance tuning

### Week 9-10: Testing & Deployment
- **Days 57-59**: Comprehensive integration testing
- **Days 60-63**: User acceptance testing
- **Days 64-66**: Documentation and training materials
- **Days 67-70**: Production deployment and monitoring setup

## Success Metrics & KPIs

### Operational Metrics
- **Lead Conversion Rate**: Target 25% improvement within 3 months
- **Time to Convert**: Reduce average lead-to-opportunity time by 40%
- **Data Consistency**: Achieve 99.9% data integrity across conversions
- **User Adoption**: 90% of sales team using conversion features within 6 weeks

### Technical Metrics
- **API Response Time**: < 500ms for conversion operations
- **Conversion Success Rate**: > 99% successful conversions
- **System Uptime**: 99.9% availability during business hours
- **Error Rate**: < 0.1% conversion failures

### Business Impact Metrics
- **Pipeline Visibility**: 100% of opportunities linked to original leads
- **Forecasting Accuracy**: 20% improvement in sales forecasting
- **Sales Productivity**: 30% reduction in manual data entry time
- **Revenue Attribution**: Complete lead source to revenue tracking

## Risk Mitigation

### Technical Risks
1. **Data Migration Issues**
   - **Risk**: Existing data corruption during schema changes
   - **Mitigation**: Comprehensive backup strategy, staged rollout, rollback procedures

2. **Performance Degradation**
   - **Risk**: Conversion operations impacting system performance
   - **Mitigation**: Async processing, caching, database optimization, load testing

3. **Integration Failures**
   - **Risk**: External system integration breaking existing workflows
   - **Mitigation**: Circuit breakers, fallback mechanisms, comprehensive error handling

### Business Risks
1. **User Resistance**
   - **Risk**: Sales team reluctant to adopt new conversion process
   - **Mitigation**: Comprehensive training, gradual rollout, user feedback incorporation

2. **Data Quality Issues**
   - **Risk**: Poor lead data quality affecting conversion accuracy
   - **Mitigation**: Enhanced validation rules, data cleansing procedures, quality monitoring

3. **Compliance Concerns**
   - **Risk**: Data handling not meeting regulatory requirements
   - **Mitigation**: Privacy by design, audit trails, compliance review

## Post-Implementation Support

### Monitoring & Maintenance
- **Daily**: Automated monitoring of conversion success rates
- **Weekly**: Performance metrics review and optimization
- **Monthly**: User feedback collection and feature enhancement planning
- **Quarterly**: Comprehensive system health assessment

### Training & Documentation
- **User Training**: Comprehensive training program for sales team
- **Administrator Training**: Advanced configuration and troubleshooting
- **Developer Documentation**: Technical documentation for future enhancements
- **Process Documentation**: Standard operating procedures for conversions

### Continuous Improvement
- **Feature Enhancements**: Regular feature updates based on user feedback
- **Performance Optimization**: Ongoing performance monitoring and optimization
- **Integration Expansion**: Additional external system integrations
- **Analytics Enhancement**: Advanced reporting and analytics capabilities

## Conclusion

This comprehensive implementation plan addresses the critical gap in the CRM system's lead conversion functionality. By implementing industry-standard lead conversion mechanisms with proper data preservation, audit trails, and automation capabilities, the system will achieve:

1. **Complete Lead-to-Opportunity Pipeline**: Seamless conversion workflow with full data traceability
2. **Enhanced Sales Productivity**: Automated processes reducing manual effort by 70%
3. **Improved Forecasting Accuracy**: Complete pipeline visibility enabling accurate revenue forecasting
4. **Scalable Architecture**: Robust foundation supporting future CRM enhancements
5. **Compliance & Audit**: Complete audit trails meeting regulatory requirements

The phased implementation approach ensures minimal disruption to existing operations while delivering immediate value to the sales team. The comprehensive testing strategy and risk mitigation plans ensure a successful deployment with high user adoption rates.

### Next Steps

1. **Stakeholder Review**: Present this plan to key stakeholders for approval
2. **Resource Allocation**: Assign development team and define project timeline
3. **Environment Setup**: Prepare development and testing environments
4. **Phase 1 Kickoff**: Begin database schema implementation
5. **Regular Reviews**: Establish weekly progress reviews and milestone checkpoints

This implementation will transform the CRM system from a basic lead tracking tool into a comprehensive sales pipeline management platform, providing the foundation for sustained business growth and improved sales performance.

---

**Document Version**: 1.0  
**Last Updated**: December 5, 2025  
**Next Review**: Upon stakeholder approval  
**Owner**: Technical Architecture Team  
**Stakeholders**: Sales Team, Development Team, Executive Leadership