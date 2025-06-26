
export type UserRole = 'SA' | 'AD' | 'AP' | 'IT' | 'IC' | 'IP' | 'IN';

// Additional types that were missing
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
export type LeadSource = 'website' | 'referral' | 'cold_call' | 'email' | 'social_media' | 'trade_show' | 'other';
export type LeadType = 'individual' | 'corporate';
export type TrainingUrgency = 'immediate' | 'within_month' | 'within_quarter' | 'planning';
export type PreferredTrainingFormat = 'in_person' | 'virtual' | 'hybrid';

export type ContactStatus = 'active' | 'inactive';
export type PreferredContactMethod = 'email' | 'phone' | 'mobile';

export type AccountType = 'prospect' | 'customer' | 'partner' | 'competitor';
export type AccountStatus = 'active' | 'inactive';

export type OpportunityStage = 'prospect' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
export type OpportunityStatus = 'open' | 'closed';

export type ActivityType = 'call' | 'email' | 'meeting' | 'task' | 'note';

export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'cancelled';
export type AssignmentType = 'round_robin' | 'load_balanced' | 'criteria_based';

// Location interface matching actual schema
export interface Location {
  id: string;
  name: string;
  address?: string;
  city?: string;
  province?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  phone?: string;
  email?: string;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
  updated_at: string;
}

// Lead interface
export interface Lead {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  company_name?: string;
  job_title?: string;
  lead_source: LeadSource;
  lead_status: LeadStatus;
  lead_score: number;
  lead_type?: LeadType;
  training_urgency?: TrainingUrgency;
  preferred_training_format?: PreferredTrainingFormat;
  estimated_participant_count?: number;
  budget_range?: string;
  notes?: string;
  assigned_to?: string;
  conversion_date?: string;
  created_at: string;
  updated_at: string;
}

// Contact interface matching CRM schema
export interface Contact {
  id: string;
  first_name?: string;
  last_name?: string;
  email: string;
  phone?: string;
  title?: string;
  department?: string;
  contact_status: ContactStatus;
  account_id?: string;
  lead_source?: string;
  converted_from_lead_id?: string;
  lead_conversion_date?: string;
  preferred_contact_method?: PreferredContactMethod;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

// Account interface matching CRM schema
export interface Account {
  id: string;
  account_name: string;
  account_type: AccountType;
  account_status: AccountStatus;
  industry?: string;
  company_size?: string;
  website?: string;
  phone?: string;
  annual_revenue?: number;
  billing_address?: string;
  billing_city?: string;
  billing_state?: string;
  billing_country?: string;
  billing_postal_code?: string;
  shipping_address?: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_country?: string;
  shipping_postal_code?: string;
  primary_contact_id?: string;
  parent_account_id?: string;
  converted_from_lead_id?: string;
  lead_conversion_date?: string;
  assigned_to?: string;
  tier?: string;
  priority?: number;
  health_score?: number;
  last_activity_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

// Certificate Request interface that matches the actual database table
export interface CertificateRequest {
  id: string;
  user_id?: string;
  reviewer_id?: string;
  status: string;
  recipient_name: string;
  email?: string;
  recipient_email?: string;
  phone?: string;
  company?: string;
  course_name: string;
  instructor_name?: string;
  instructor_level?: string;
  first_aid_level?: string;
  cpr_level?: string;
  issue_date: string;
  expiry_date: string;
  assessment_status?: string;
  rejection_reason?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  location_id?: string;
  roster_id?: string;
  batch_id?: string;
  batch_name?: string;
  length?: number;
  generation_attempts?: number;
  generation_error?: string;
  last_generation_attempt?: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  role: UserRole;
  display_name?: string;
  email?: string;
  created_at?: string;
  updated_at?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  phone?: string;
  organization?: string;
  job_title?: string;
  compliance_tier?: 'basic' | 'robust';
}

// Safe casting functions with fallbacks
export function safeUserRole(role: string): UserRole {
  const validRoles: UserRole[] = ['SA', 'AD', 'AP', 'IT', 'IC', 'IP', 'IN'];
  return validRoles.includes(role as UserRole) ? (role as UserRole) : 'IT';
}

export function safeAssignmentType(type: string): AssignmentType {
  const validTypes: AssignmentType[] = ['round_robin', 'load_balanced', 'criteria_based'];
  return validTypes.includes(type as AssignmentType) ? (type as AssignmentType) : 'round_robin';
}

export function safeContactStatus(status: string): ContactStatus {
  return status === 'inactive' ? 'inactive' : 'active';
}

export function safeAccountType(type: string): AccountType {
  const validTypes: AccountType[] = ['prospect', 'customer', 'partner', 'competitor'];
  return validTypes.includes(type as AccountType) ? (type as AccountType) : 'prospect';
}

export function safeAccountStatus(status: string): AccountStatus {
  return status === 'inactive' ? 'inactive' : 'active';
}

// Database types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>;
      };
    };
  };
}
