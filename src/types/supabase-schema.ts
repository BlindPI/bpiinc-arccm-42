
// Enhanced Supabase schema types for production readiness

export type AssignmentType = 'round_robin' | 'load_based' | 'territory' | 'skills';

export function safeAssignmentType(value: any): AssignmentType {
  const validTypes: AssignmentType[] = ['round_robin', 'load_based', 'territory', 'skills'];
  
  // Handle common variations
  if (value === 'load_balanced') return 'load_based';
  
  return validTypes.includes(value) ? value : 'round_robin';
}

// Role type definitions
export type UserRole = 'SA' | 'AD' | 'AP' | 'IT' | 'IC' | 'IP' | 'IN';

// Safe user role function
export function safeUserRole(value: any): UserRole {
  const validRoles: UserRole[] = ['SA', 'AD', 'AP', 'IT', 'IC', 'IP', 'IN'];
  return validRoles.includes(value) ? value : 'IT';
}

// Status types
export type ContactStatus = 'active' | 'inactive';
export type AccountType = 'prospect' | 'customer' | 'partner' | 'competitor';
export type AccountStatus = 'active' | 'inactive' | 'prospect';
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
export type LeadSource = 'website' | 'referral' | 'cold_call' | 'email' | 'social_media' | 'trade_show' | 'other';
export type LeadType = 'individual' | 'corporate' | 'government';
export type TrainingUrgency = 'immediate' | 'within_month' | 'within_quarter' | 'planning';
export type PreferredTrainingFormat = 'online' | 'in_person' | 'hybrid';
export type PreferredContactMethod = 'email' | 'phone' | 'mail';
export type OpportunityStage = 'prospect' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
export type OpportunityStatus = 'open' | 'closed';
export type ActivityType = 'call' | 'email' | 'meeting' | 'task' | 'note';

// Safe functions for all types
export function safeLeadStatus(value: any): LeadStatus {
  const validStatuses: LeadStatus[] = ['new', 'contacted', 'qualified', 'converted', 'lost'];
  return validStatuses.includes(value) ? value : 'new';
}

export function safeLeadSource(value: any): LeadSource {
  const validSources: LeadSource[] = ['website', 'referral', 'cold_call', 'email', 'social_media', 'trade_show', 'other'];
  return validSources.includes(value) ? value : 'other';
}

export function safeLeadType(value: any): LeadType {
  const validTypes: LeadType[] = ['individual', 'corporate', 'government'];
  return validTypes.includes(value) ? value : 'individual';
}

export function safeTrainingUrgency(value: any): TrainingUrgency {
  const validUrgencies: TrainingUrgency[] = ['immediate', 'within_month', 'within_quarter', 'planning'];
  return validUrgencies.includes(value) ? value : 'planning';
}

export function safePreferredTrainingFormat(value: any): PreferredTrainingFormat {
  const validFormats: PreferredTrainingFormat[] = ['online', 'in_person', 'hybrid'];
  return validFormats.includes(value) ? value : 'in_person';
}

export function safeContactStatus(value: any): ContactStatus {
  const validStatuses: ContactStatus[] = ['active', 'inactive'];
  return validStatuses.includes(value) ? value : 'active';
}

export function safePreferredContactMethod(value: any): PreferredContactMethod {
  const validMethods: PreferredContactMethod[] = ['email', 'phone', 'mail'];
  return validMethods.includes(value) ? value : 'email';
}

export function safeAccountType(value: any): AccountType {
  const validTypes: AccountType[] = ['prospect', 'customer', 'partner', 'competitor'];
  return validTypes.includes(value) ? value : 'prospect';
}

export function safeAccountStatus(value: any): AccountStatus {
  const validStatuses: AccountStatus[] = ['active', 'inactive', 'prospect'];
  return validStatuses.includes(value) ? value : 'prospect';
}

export function safeOpportunityStage(value: any): OpportunityStage {
  const validStages: OpportunityStage[] = ['prospect', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];
  return validStages.includes(value) ? value : 'prospect';
}

export function safeOpportunityStatus(value: any): OpportunityStatus {
  const validStatuses: OpportunityStatus[] = ['open', 'closed'];
  return validStatuses.includes(value) ? value : 'open';
}

export function safeActivityType(value: any): ActivityType {
  const validTypes: ActivityType[] = ['call', 'email', 'meeting', 'task', 'note'];
  return validTypes.includes(value) ? value : 'call';
}

// Unified Location interface with status property
export interface Location {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
  updated_at: string;
  email?: string;
  phone?: string;
  website?: string;
}

// Export Lead interface - THIS WAS MISSING
export interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  company_name?: string;
  job_title?: string;
  lead_status: LeadStatus;
  lead_source: string;
  lead_score: number;
  assigned_to?: string;
  notes?: string;
  training_urgency?: string;
  estimated_participant_count?: number;
  created_at: string;
  updated_at: string;
}

// Certificate Request interface
export interface CertificateRequest {
  id: string;
  recipient_name: string;
  recipient_email?: string;
  email?: string;
  phone?: string;
  company?: string;
  course_name: string;
  issue_date: string;
  expiry_date: string;
  city?: string;
  province?: string;
  postal_code?: string;
  instructor_name?: string;
  instructor_level?: string;
  first_aid_level?: string;
  cpr_level?: string;
  length?: number;
  assessment_status?: string;
  status: string;
  user_id?: string;
  reviewer_id?: string;
  rejection_reason?: string;
  location_id?: string;
  batch_id?: string;
  batch_name?: string;
  roster_id?: string;
  generation_attempts?: number;
  generation_error?: string;
  last_generation_attempt?: string;
  created_at: string;
  updated_at: string;
}

// Enhanced Certificate Request with additional properties
export interface EnhancedCertificateRequest extends CertificateRequest {
  submitter?: {
    id: string;
    display_name?: string;
    email: string;
  };
  location?: {
    id: string;
    name: string;
    city?: string;
    state?: string;
  };
}

// Certificate Request with Submitter info
export interface CertificateRequestWithSubmitter extends CertificateRequest {
  submitter?: {
    id: string;
    display_name?: string;
    email: string;
  };
}

export interface Database {
  public: {
    Tables: {
      crm_leads: {
        Row: {
          id: string;
          first_name: string;
          last_name: string;
          email: string;
          phone?: string;
          company_name?: string;
          job_title?: string;
          lead_status: LeadStatus;
          lead_source: string;
          lead_score: number;
          assigned_to?: string;
          notes?: string;
          training_urgency?: string;
          estimated_participant_count?: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['crm_leads']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['crm_leads']['Insert']>;
      };
      crm_opportunities: {
        Row: {
          id: string;
          opportunity_name: string;
          account_name?: string;
          account_id?: string;
          estimated_value: number;
          stage: OpportunityStage;
          probability: number;
          expected_close_date?: string;
          opportunity_status: OpportunityStatus;
          description?: string;
          created_by: string;
          lead_id?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['crm_opportunities']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['crm_opportunities']['Insert']>;
      };
      crm_contacts: {
        Row: {
          id: string;
          first_name: string;
          last_name: string;
          email: string;
          phone?: string;
          mobile_phone?: string;
          title?: string;
          department?: string;
          account_id?: string;
          contact_status: ContactStatus;
          lead_source?: string;
          preferred_contact_method?: string;
          do_not_call?: boolean;
          do_not_email?: boolean;
          last_activity_date?: string;
          notes?: string;
          converted_from_lead_id?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['crm_contacts']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['crm_contacts']['Insert']>;
      };
      crm_accounts: {
        Row: {
          id: string;
          account_name: string;
          account_type: AccountType;
          industry?: string;
          account_status: AccountStatus;
          phone?: string;
          email?: string;
          website?: string;
          address?: string;
          company_size?: string;
          fax?: string;
          billing_address?: string;
          billing_city?: string;
          billing_state?: string;
          billing_postal_code?: string;
          billing_country?: string;
          shipping_address?: string;
          annual_revenue?: number;
          notes?: string;
          converted_from_lead_id?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['crm_accounts']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['crm_accounts']['Insert']>;
      };
      crm_activities: {
        Row: {
          id: string;
          activity_type: ActivityType;
          subject: string;
          description?: string;
          activity_date: string;
          due_date?: string;
          completed: boolean;
          lead_id?: string;
          opportunity_id?: string;
          contact_id?: string;
          account_id?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['crm_activities']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['crm_activities']['Insert']>;
      };
    };
  };
}
