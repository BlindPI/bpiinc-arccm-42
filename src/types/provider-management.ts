// Unified Provider Management Types
// Phase 2: TypeScript Interface Updates
// Fixes all type mismatches and ensures consistency

// =============================================================================
// Core Provider Types
// =============================================================================

export interface Provider {
  id: string; // UUID string, not number
  name: string;
  provider_type: string;
  status: string;
  primary_location_id?: string;
  performance_rating: number;
  compliance_score: number;
  description?: string;
  website?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  approved_by?: string;
  approval_date?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthorizedProvider extends Provider {
  // Relations populated by joins
  primary_location?: Location;
  teams?: Team[];
  assignments?: ProviderTeamAssignment[];
}

// =============================================================================
// Team Management Types (Fixed)
// =============================================================================

export interface Team {
  id: string;
  name: string;
  team_type: string;
  status: string;
  location_id?: string;
  provider_id?: string; // Now properly references authorized_providers.id
  performance_score: number;
  monthly_targets?: Record<string, any>;
  current_metrics?: Record<string, any>;
  created_at: string;
  updated_at: string;
  // Relations
  location?: Location;
  provider?: AuthorizedProvider;
  members?: TeamMemberWithProfile[];
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: string;
  status: string;
  location_assignment?: string;
  assignment_start_date?: string;
  assignment_end_date?: string;
  team_position?: string;
  permissions?: Record<string, any>;
  last_activity?: string;
  created_at: string;
  updated_at: string;
}

// Fixed team member interface with proper database fields
export interface TeamMemberWithProfile extends TeamMember {
  display_name: string;
  email?: string;
  user_role?: string;
  // Note: 'profiles' and 'teams' properties removed - these are populated separately
}

// =============================================================================
// Provider-Team Assignment Types
// =============================================================================

export interface ProviderTeamAssignment {
  id: string;
  provider_id: string;
  team_id: string;
  assignment_role: 'primary' | 'secondary' | 'supervisor' | 'coordinator';
  oversight_level: 'monitor' | 'standard' | 'manage' | 'admin';
  assignment_type: 'ongoing' | 'project_based' | 'temporary';
  start_date: string;
  end_date?: string;
  status: 'active' | 'inactive' | 'suspended' | 'completed';
  assigned_by?: string;
  assigned_at: string;
  created_at: string;
  updated_at: string;
  // Relations
  provider?: AuthorizedProvider;
  team?: Team;
}

export interface ProviderTeamAssignmentDetailed extends ProviderTeamAssignment {
  team_name: string;
  team_type: string;
  team_status: string;
  location_name?: string;
  member_count: number;
  performance_score: number;
}

// =============================================================================
// Location Types
// =============================================================================

export interface Location {
  id: string;
  name: string;
  city?: string;
  state?: string;
  address?: string;
  created_at: string;
  updated_at: string;
  // Relations
  teams?: Team[];
  providers?: AuthorizedProvider[];
}

// =============================================================================
// Provider Analytics & Performance Types
// =============================================================================

export interface ProviderPerformanceMetrics {
  certificates_issued: number;
  courses_conducted: number;
  total_members: number;
  active_assignments: number;
}

export interface ProviderWithRelationships {
  provider_data: AuthorizedProvider;
  location_data?: Location;
  teams_data: Team[];
  performance_metrics: ProviderPerformanceMetrics;
}

// =============================================================================
// Navigation Types (Fixed)
// =============================================================================

export interface NavigationItem {
  name: string;
  href: string;
  icon: any; // React component
  group: string;
  enterpriseOnly: boolean; // Add this property to all navigation items
  badge?: string;
  subItems?: NavigationItem[];
}

// =============================================================================
// API Response Types
// =============================================================================

export interface ApiResponse<T> {
  data: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  limit: number;
  total_pages: number;
}

// =============================================================================
// Form Types for Provider Management
// =============================================================================

export interface CreateProviderRequest {
  name: string;
  provider_type: string;
  primary_location_id?: string;
  description?: string;
  website?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  status?: string;
  user_id?: string;
}

export interface UpdateProviderRequest extends Partial<CreateProviderRequest> {
  id: string;
  status?: string;
  performance_rating?: number;
  compliance_score?: number;
}

export interface AssignProviderToTeamRequest {
  provider_id: string;
  team_id: string;
  assignment_role?: 'primary' | 'secondary' | 'supervisor' | 'coordinator';
  oversight_level?: 'monitor' | 'standard' | 'manage' | 'admin';
  assignment_type?: 'ongoing' | 'project_based' | 'temporary';
  end_date?: string;
}

export interface AddTeamMemberRequest {
  team_id: string;
  user_id: string;
  role?: string;
}

// =============================================================================
// Three-Click Workflow Types
// =============================================================================

export interface WorkflowStep {
  step: number;
  title: string;
  description: string;
  completed: boolean;
  data?: any;
}

export interface ProviderManagementWorkflow {
  step1: WorkflowStep; // Location Selection/Creation
  step2: WorkflowStep; // Provider Assignment (from AP users)
  step3: WorkflowStep; // Team Creation/Assignment
  currentStep: number;
  isComplete: boolean;
}

// =============================================================================
// Filter and Search Types
// =============================================================================

export interface ProviderFilters {
  status?: string[];
  provider_type?: string[];
  location_id?: string;
  performance_rating_min?: number;
  compliance_score_min?: number;
  search?: string;
}

export interface TeamFilters {
  status?: string[];
  team_type?: string[];
  location_id?: string;
  provider_id?: string;
  performance_score_min?: number;
  search?: string;
}

// All types are already exported with their interface declarations above