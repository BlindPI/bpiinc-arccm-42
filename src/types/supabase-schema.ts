// UNIFIED TYPE SYSTEM - SINGLE SOURCE OF TRUTH
export interface Profile {
  id: string;
  display_name: string;
  email: string;
  role: UserRole;
  phone?: string;
  organization?: string;
  job_title?: string;
  bio?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  created_at: string;
  updated_at: string;
  compliance_status?: boolean | null;
  last_training_date?: string | null;
  next_training_due?: string | null;
  performance_score?: number | null;
  training_hours?: number | null;
  certifications_count?: number | null;
  location_id?: string | null;
  department?: string | null;
  supervisor_id?: string | null;
  user_id?: string;
}

// Extended Profile for user management components
export interface ExtendedProfile extends Profile {
  teams_count?: number;
  last_activity?: string;
  assigned_teams?: string[];
  permissions?: string[];
  metadata?: Record<string, any>;
}

// UNIFIED UserRole type - SINGLE SOURCE OF TRUTH
export type UserRole = 
  | 'SA' 
  | 'AD' 
  | 'TL' 
  | 'IT' 
  | 'IC' 
  | 'IP' 
  | 'ITC'
  | 'student'
  | 'instructor_candidate'
  | 'instructor_provisional'
  | 'instructor_trainer';

// Database user roles (from Supabase)
export type DatabaseUserRole = 
  | 'SA' 
  | 'AD' 
  | 'TL' 
  | 'IT' 
  | 'IC' 
  | 'IP' 
  | 'ITC'
  | 'student'
  | 'instructor_candidate'
  | 'instructor_provisional'
  | 'instructor_trainer';

// UNIFIED Location interface - handle both postal_code and zip from database
export interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  postal_code: string; // Unified field
  country: string;
  email: string;
  phone: string;
  website: string;
  logo_url: string;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
  updated_at: string;
}

// UNIFIED AuthorizedProvider interface with primary_location_id
export interface AuthorizedProvider {
  id: string;
  name: string;
  provider_type: string;
  status: 'APPROVED' | 'REJECTED' | 'PENDING' | 'SUSPENDED';
  performance_rating?: number;
  compliance_score?: number;
  created_at: string;
  updated_at: string;
  description?: string;
  primary_location_id?: string; // Added missing field
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  website?: string;
  logo_url?: string;
  specializations?: any;
  certification_levels?: any;
  metadata?: any;
  approved_by?: string;
  approval_date?: string;
  user_id?: string;
}

// UNIFIED CertificateRequest interface
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

// Password validation interface
export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
  message?: string;
  requirements: string[];
  strength: number;
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

// UNIFIED CRM Types with proper exports
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
export type LeadSource = 'website' | 'referral' | 'cold_call' | 'email' | 'social_media' | 'trade_show' | 'other';

export interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  company_name?: string;
  job_title?: string;
  lead_status: LeadStatus;
  lead_source: LeadSource;
  lead_score: number;
  assigned_to?: string;
  notes?: string;
  training_urgency?: 'immediate' | 'within_month' | 'within_quarter' | 'planning';
  estimated_participant_count?: number;
  lead_type?: 'individual' | 'corporate' | 'government';
  preferred_training_format?: 'online' | 'in_person' | 'hybrid';
  budget_range?: string;
  created_at: string;
  updated_at: string;
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
  contact_status: 'active' | 'inactive';
  lead_source?: string;
  preferred_contact_method?: 'email' | 'phone' | 'mail';
  do_not_call?: boolean;
  do_not_email?: boolean;
  last_activity_date?: string;
  notes?: string;
  converted_from_lead_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Account {
  id: string;
  account_name: string;
  account_type: 'prospect' | 'customer' | 'partner' | 'competitor';
  industry?: string;
  account_status: 'active' | 'inactive' | 'prospect';
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
}

export interface Opportunity {
  id: string;
  opportunity_name: string;
  account_name?: string;
  account_id?: string;
  estimated_value: number;
  stage: 'prospect' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
  probability: number;
  expected_close_date?: string;
  opportunity_status: 'open' | 'closed';
  description?: string;
  created_by: string;
  lead_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: string;
  activity_type: 'call' | 'email' | 'meeting' | 'task' | 'note';
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
}

export interface AssignmentRule {
  id: string;
  rule_name: string;
  rule_description?: string;
  criteria: Record<string, any>;
  assignment_type: 'round_robin' | 'load_based' | 'territory' | 'skills';
  assigned_user_id?: string;
  priority: number;
  is_active: boolean;
  working_hours?: Record<string, any>;
  escalation_rules?: Record<string, any>;
  automation_enabled?: boolean;
  created_at: string;
  updated_at: string;
}

// UNIFIED Team status type - align with database schema
export type TeamStatus = 'active' | 'inactive' | 'suspended' | 'archived';

// Assignment Performance interface for CRM
export interface AssignmentPerformance {
  id: string;
  user_id: string;
  user_name: string; // Computed property
  assignment_date: string;
  leads_assigned: number;
  leads_contacted: number;
  leads_converted: number;
  avg_response_time: string;
  quality_score: number;
  current_load: number;
  max_capacity: number;
  availability_status: 'available' | 'busy' | 'unavailable';
  created_at: string;
  updated_at: string;
}

// Email Campaign interface for CRM
export interface EmailCampaign {
  id: string;
  campaign_name: string;
  campaign_type: string;
  subject_line: string;
  email_content: string;
  target_audience: any;
  status: string;
  sent_count: number; // Computed property
  open_rate: number; // Computed property
  click_rate: number; // Computed property
  conversion_rate: number; // Computed property
  campaign_cost?: number;
  revenue_attributed?: number;
  created_at: string;
  updated_at: string;
}

// Instructor Performance Metrics interface
export interface InstructorPerformanceMetrics {
  instructor_id: string;
  instructor_name: string;
  total_sessions: number;
  completed_sessions: number;
  average_rating: number;
  compliance_score: number;
  monthly_hours: number;
  year_to_date_hours: number;
  certifications_issued: number;
  performance_trend: 'improving' | 'stable' | 'declining';
  last_evaluation_date?: string;
}

// Team Member interface with proper profile reference
export interface TeamMemberWithProfile {
  id: string;
  team_id: string;
  user_id: string;
  role: 'ADMIN' | 'MEMBER';
  status: 'active' | 'inactive';
  permissions?: string[];
  created_at: string;
  updated_at: string;
  last_activity?: string;
  location_assignment?: string;
  assignment_start_date?: string;
  assignment_end_date?: string;
  team_position?: string;
  joined_at?: string;
  profile?: Profile; // Use 'profile' not 'profiles'
}

// UTILITY FUNCTIONS - SINGLE SOURCE OF TRUTH
export function safeUserRole(role: any): UserRole {
  if (typeof role === 'string' && ['SA', 'AD', 'TL', 'IT', 'IC', 'IP', 'ITC', 'student', 'instructor_candidate', 'instructor_provisional', 'instructor_trainer'].includes(role)) {
    return role as UserRole;
  }
  return 'IT';
}

export function safeAssignmentType(type: any): 'primary' | 'secondary' | 'temporary' {
  if (typeof type === 'string' && ['primary', 'secondary', 'temporary'].includes(type)) {
    return type as 'primary' | 'secondary' | 'temporary';
  }
  return 'primary';
}

export function safeTeamStatus(status: any): TeamStatus {
  if (typeof status === 'string' && ['active', 'inactive', 'suspended', 'archived'].includes(status)) {
    return status as TeamStatus;
  }
  return 'active';
}

// METRICS INTERFACES
export interface ExecutiveMetrics {
  totalRevenue: number;
  totalUsers: number;
  activeProjects: number;
  complianceScore: number;
  activeInstructors: number;
  totalCertificates: number;
  monthlyGrowth: number;
  performanceIndex: number;
}

export interface ComplianceMetrics {
  overallScore: number;
  compliantTeams: number;
  pendingReviews: number;
  criticalIssues: number;
  overall_compliance: number;
  active_issues: number;
  resolved_issues: number;
}

// DATABASE SCHEMA DEFINITION
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile>;
        Update: Partial<Profile>;
      };
      certificate_requests: {
        Row: CertificateRequest;
        Insert: Partial<CertificateRequest>;
        Update: Partial<CertificateRequest>;
      };
      locations: {
        Row: Location;
        Insert: Partial<Location>;
        Update: Partial<Location>;
      };
      authorized_providers: {
        Row: AuthorizedProvider;
        Insert: Partial<AuthorizedProvider>;
        Update: Partial<AuthorizedProvider>;
      };
      teams: {
        Row: {
          id: string;
          name: string;
          description?: string;
          team_type: string;
          status: TeamStatus;
          location_id?: string;
          provider_id?: string;
          created_by: string;
          created_at: string;
          updated_at: string;
          performance_score?: number;
        };
        Insert: {
          name: string;
          description?: string;
          team_type: string;
          status?: TeamStatus;
          location_id?: string;
          provider_id?: string;
          created_by: string;
        };
        Update: Partial<{
          name: string;
          description?: string;
          team_type: string;
          status: TeamStatus;
          location_id?: string;
          provider_id?: string;
          performance_score?: number;
        }>;
      };
      team_members: {
        Row: {
          id: string;
          team_id: string;
          user_id: string;
          role: 'ADMIN' | 'MEMBER';
          status: 'active' | 'inactive';
          permissions?: string[];
          created_at: string;
          updated_at: string;
          last_activity?: string;
          location_assignment?: string;
          assignment_start_date?: string;
          assignment_end_date?: string;
          team_position?: string;
        };
        Insert: {
          team_id: string;
          user_id: string;
          role: 'ADMIN' | 'MEMBER';
          status?: 'active' | 'inactive';
          permissions?: string[];
        };
        Update: Partial<{
          role: 'ADMIN' | 'MEMBER';
          status: 'active' | 'inactive';
          permissions?: string[];
          location_assignment?: string;
          assignment_start_date?: string;
          assignment_end_date?: string;
          team_position?: string;
        }>;
      };
    };
  };
}
