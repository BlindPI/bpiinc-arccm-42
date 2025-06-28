
// Foundation Types - SINGLE SOURCE OF TRUTH for Complete Frontend Transplant
// Direct mapping to database schema with enterprise patterns

export type UserRole = 'SA' | 'AD' | 'AP' | 'IC' | 'IP' | 'IT' | 'IN' | 'ST';

export type ComplianceStatus = 'COMPLIANT' | 'NON_COMPLIANT' | 'PENDING' | 'EXPIRED';

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'SUSPENDED';

// ===== CORE USER & PROFILE TYPES =====
export interface UserProfile {
  id: string;
  email: string;
  display_name?: string;
  role: UserRole;
  status: UserStatus;
  compliance_status?: ComplianceStatus;
  compliance_tier?: string;
  compliance_score?: number;
  created_at: string;
  updated_at: string;
  avatar_url?: string;
  phone?: string;
  organization?: string;
}

// Auth Context Types
export interface AuthContextType {
  user: any | null;
  loading: boolean;
  authReady: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

// ===== TEAM MANAGEMENT TYPES =====
export interface Team {
  id: string;
  name: string;
  description?: string;
  team_type: string;
  status: 'ACTIVE' | 'INACTIVE';
  location_id?: string;
  provider_id?: string;
  performance_score?: number;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: 'ADMIN' | 'MEMBER';
  status: 'active' | 'inactive';
  team_position?: string;
  joined_at: string;
  profiles?: UserProfile;
  display_name?: string;
  email?: string;
}

export interface TeamMemberWithProfile extends TeamMember {
  profiles: UserProfile;
}

// ===== CRM TYPES =====
export type EmailCampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'cancelled';
export type EmailCampaignType = 'newsletter' | 'promotional' | 'follow_up' | 'onboarding' | 'retention';

export interface EmailCampaign {
  id: string;
  campaign_name: string;
  campaign_type: EmailCampaignType;
  status: EmailCampaignStatus;
  subject_line?: string;
  content?: string;
  html_content?: string;
  sender_name?: string;
  sender_email?: string;
  reply_to_email?: string;
  target_audience?: any;
  created_by?: string;
  tracking_enabled?: boolean;
  automation_rules?: any;
  scheduled_at?: string;
  sent_at?: string;
  created_at: string;
  updated_at: string;
  // Performance metrics
  recipient_count?: number;
  open_rate?: number;
  click_rate?: number;
  bounce_rate?: number;
}

export interface CRMLead {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  phone?: string;
  lead_source?: string;
  lead_status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  lead_type?: string;
  assigned_to?: string;
  conversion_date?: string;
  converted_contact_id?: string;
  converted_account_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CRMContact {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  account_id?: string;
  converted_from_lead_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CRMAccount {
  id: string;
  account_name: string;
  account_type?: string;
  industry?: string;
  website?: string;
  phone?: string;
  address?: string;
  primary_contact_id?: string;
  converted_from_lead_id?: string;
  created_at: string;
  updated_at: string;
}

// ===== CERTIFICATE TYPES =====
export interface Certificate {
  id: string;
  recipient_name: string;
  recipient_email: string;
  course_name: string;
  course_type: string;
  issue_date: string;
  expiration_date?: string;
  certificate_number: string;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
  location_name?: string;
  instructor_name?: string;
  roster_id?: string;
  created_at: string;
}

// ===== COURSE TYPES =====
export interface Course {
  id: string;
  name: string;
  description?: string;
  course_type: string;
  duration_hours?: number;
  max_participants?: number;
  prerequisites?: string[];
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
  updated_at: string;
}

export interface CoursePrerequisite {
  id: string;
  course_id: string;
  prerequisite_course_id: string;
  is_required: boolean;
  created_at: string;
  updated_at: string;
  prerequisite_course?: Course;
}

export interface CreateRosterData {
  course_name: string;
  course_type: string;
  location_name: string;
  instructor_name: string;
  issue_date: string;
  expiration_date?: string;
  recipients: Array<{
    name: string;
    email: string;
  }>;
}

// ===== NOTIFICATION TYPES =====
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'SUCCESS' | 'ERROR' | 'WARNING' | 'INFO' | 'ACTION';
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  read: boolean;
  read_at?: string;
  created_at: string;
  user_id: string;
  metadata?: Record<string, any>;
  action_url?: string;
}

// ===== COMPLIANCE TYPES =====
export interface ComplianceRequirement {
  id: string;
  name: string;
  description?: string;
  requirement_type: string;
  is_mandatory: boolean;
  tier_level?: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
}

export interface UserComplianceRecord {
  id: string;
  user_id: string;
  requirement_id: string;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at?: string;
  reviewed_at?: string;
  reviewed_by?: string;
  compliance_data?: any;
  created_at: string;
  updated_at: string;
}

export interface ComplianceData {
  user_id: string;
  status: ComplianceStatus;
  items: Array<{
    id: string;
    name: string;
    status: 'VALID' | 'EXPIRED' | 'PENDING';
    expiry_date?: string;
  }>;
}

// ===== DASHBOARD TYPES =====
export interface DashboardConfig {
  layout: 'grid' | 'list';
  theme: 'light' | 'dark';
  compactMode: boolean;
  showQuickActions: boolean;
  refreshInterval: number;
  welcomeMessage?: string;
  subtitle?: string;
  widgets?: DashboardWidget[];
}

export interface DashboardWidget {
  id: string;
  type: 'metrics' | 'chart' | 'table' | 'list';
  title: string;
  size: 'small' | 'medium' | 'large';
  position: { x: number; y: number };
  data?: any;
}

export interface DashboardMetric {
  title: string;
  value: string | number;
  icon: any;
  trend?: string;
  change?: number;
}

// Role-specific dashboard props
export interface SystemAdminDashboardProps {
  config: DashboardConfig;
  profile: UserProfile;
}

export interface AdminDashboardProps {
  config: DashboardConfig;
  profile: UserProfile;
}

export interface ProviderDashboardProps {
  teamContext?: any;
  config: DashboardConfig;
  profile: UserProfile;
}

export interface InstructorDashboardProps {
  teamContext?: any;
  config: DashboardConfig;
  profile: UserProfile;
}

export interface StudentDashboardProps {
  config: DashboardConfig;
  profile: UserProfile;
}

// ===== TEACHING & PERFORMANCE TYPES =====
export interface TeachingData {
  id: string;
  instructor_id: string;
  course_name: string;
  session_date: string;
  completion_status: string;
  participants_count: number;
  location?: string;
}

export interface DocumentRequirement {
  id: string;
  name: string;
  description?: string;
  from_role: UserRole;
  to_role: UserRole;
  is_required: boolean;
  document_type: string;
}

export interface DocumentSubmission {
  id: string;
  user_id: string;
  requirement_id: string;
  file_url: string;
  file_name: string;
  submission_date: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by?: string;
  review_date?: string;
  review_notes?: string;
}

// ===== API RESPONSE TYPES =====
export interface ApiResponse<T> {
  data?: T;
  success: boolean;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ===== FORM TYPES =====
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'select' | 'date' | 'textarea';
  required?: boolean;
  validation?: any;
  options?: Array<{ label: string; value: string }>;
}

// ===== FILTER AND SEARCH TYPES =====
export interface FilterConfig {
  field: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'between';
  value: any;
}

export interface SearchConfig {
  query: string;
  fields: string[];
  filters: FilterConfig[];
}

// ===== LOCATION TYPES =====
export interface Location {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
  updated_at: string;
}

// ===== PROVIDER TYPES =====
export interface AuthorizedProvider {
  id: string;
  name: string;
  provider_type?: string;
  status: 'active' | 'inactive' | 'APPROVED';
  primary_location_id?: string;
  contact_email?: string;
  contact_phone?: string;
  website?: string;
  description?: string;
  performance_rating?: number;
  compliance_score?: number;
  created_at: string;
  updated_at: string;
}

// ===== UTILITY TYPES =====
export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  field: string;
  direction: SortDirection;
}

export interface TableColumn<T> {
  key: keyof T;
  title: string;
  sortable?: boolean;
  render?: (value: any, record: T) => React.ReactNode;
}

// Export commonly used unions
export type DatabaseStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'SUSPENDED' | 'EXPIRED' | 'REVOKED';
export type CampaignStatus = EmailCampaignStatus;
export type CampaignType = EmailCampaignType;
