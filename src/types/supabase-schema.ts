
export interface Profile {
  id: string;
  display_name?: string;
  email: string;
  role: string;
  phone?: string;
  organization?: string;
  created_at?: string;
  updated_at?: string;
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

export interface ExtendedProfile extends Profile {
  teams?: Array<{
    id: string;
    name: string;
    role: string;
  }>;
  locations?: Array<{
    id: string;
    name: string;
  }>;
  metrics?: {
    performance_score: number;
    compliance_score: number;
    training_completion_rate: number;
  };
}

// CRITICAL: Add missing UserRole type
export type UserRole = 'SA' | 'AD' | 'IT' | 'ITC' | 'IP' | 'S' | 'N';

// CRITICAL: Add missing CertificateRequest interface to fix 73+ import errors
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

// CRITICAL: Add missing Location interface
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
}

// CRITICAL: Add missing ExecutiveMetrics interface
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

// CRITICAL: Add missing ComplianceMetrics interface
export interface ComplianceMetrics {
  overallScore: number;
  compliantTeams: number;
  pendingReviews: number;
  criticalIssues: number;
  overall_compliance: number;
  active_issues: number;
  resolved_issues: number;
}

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
      teams: {
        Row: {
          id: string;
          name: string;
          description?: string;
          team_type: string;
          status: 'active' | 'inactive' | 'suspended';
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
          status?: 'active' | 'inactive' | 'suspended';
          location_id?: string;
          provider_id?: string;
          created_by: string;
        };
        Update: Partial<{
          name: string;
          description?: string;
          team_type: string;
          status: 'active' | 'inactive' | 'suspended';
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
