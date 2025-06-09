// Team management types - unified interface definitions

export interface TeamAnalytics {
  totalTeams: number;
  activeTeams: number;
  totalMembers: number;
  averageTeamSize: number;
  teamsByType: Record<string, number>;
  performanceMetrics: {
    averagePerformanceScore: number;
    topPerformingTeams: Array<{
      id: string;
      name: string;
      score: number;
    }>;
  };
  complianceMetrics: {
    compliantTeams: number;
    pendingReviews: number;
    overdueTasks: number;
  };
  averagePerformance: number;
  averageCompliance: number;
  teamsByLocation: Record<string, number>;
  performanceByTeamType: Record<string, number>;
  teamsByProvider: Record<string, number>;
  // CRITICAL: Add missing properties that analytics expect
  total_teams: number;
  total_members: number;
  performance_average: number;
  compliance_score: number;
  cross_location_teams: number;
}

export interface SystemWideAnalytics {
  overview: {
    totalTeams: number;
    totalMembers: number;
    activeProjects: number;
    systemHealth: number;
  };
  performance: {
    averageTeamPerformance: number;
    topPerformers: Array<{ id: string; name: string; score: number }>;
    bottomPerformers: Array<{ id: string; name: string; score: number }>;
  };
  compliance: {
    compliantTeams: number;
    nonCompliantTeams: number;
    pendingReviews: number;
  };
  trends: {
    monthlyGrowth: number;
    performanceTrend: number;
    membershipTrend: number;
  };
  totalTeams: number;
  totalMembers: number;
  averagePerformance: number;
  averageCompliance: number;
  teamsByProvider: Record<string, number>;
}

// UNIFIED TeamMemberWithProfile interface - single source of truth
export interface TeamMemberWithProfile {
  id: string;
  team_id: string;
  user_id: string;
  role: 'ADMIN' | 'MEMBER';
  joined_at: string;
  status: 'active' | 'inactive';
  permissions?: string[];
  created_at?: string;
  updated_at?: string;
  last_activity?: string;
  display_name?: string;
  location_assignment?: string | null;
  assignment_start_date?: string | null;
  assignment_end_date?: string | null;
  team_position?: string | null;
  // UNIFIED profile property (not profiles)
  profile?: {
    id: string;
    display_name?: string;
    email: string;
    role: string;
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
  };
}

// Enhanced Team interface with all required properties
export interface EnhancedTeam {
  id: string;
  name: string;
  description?: string;
  team_type: string;
  status: 'active' | 'inactive' | 'archived' | 'suspended';
  location_id?: string;
  provider_id?: string;
  created_by: string; // Required field
  created_at: string;
  updated_at: string;
  performance_score?: number;
  member_count?: number;
  // Add missing properties that components expect
  current_metrics?: Record<string, any>;
  monthly_targets?: Record<string, any>;
  metadata?: Record<string, any>;
  members?: TeamMemberWithProfile[];
  location?: {
    id: string;
    name: string;
    city?: string;
    state?: string;
  };
  provider?: {
    id: string;
    name: string;
    provider_type?: string;
    status?: string;
    performance_rating?: number;
  };
  metrics?: {
    performance_score: number;
    compliance_score: number;
    member_count: number;
  };
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  team_type: string;
  status: 'active' | 'inactive' | 'archived';
  location_id?: string;
  provider_id?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  performance_score?: number;
}

export interface CreateTeamRequest {
  name: string;
  description?: string;
  team_type: string;
  location_id?: string;
  provider_id?: string;
  created_by: string;
  metadata?: Record<string, any>;
}

export interface TeamLocationAssignment {
  id: string;
  team_id: string;
  location_id: string;
  assignment_type: 'primary' | 'secondary' | 'coverage';
  is_active: boolean;
  assigned_at: string;
  assigned_by: string;
  start_date?: string;
  location_name?: string;
  team?: {
    id: string;
    name: string;
    team_type: string;
  };
  location?: {
    id: string;
    name: string;
    city?: string;
    state?: string;
  };
}

export interface TeamPerformanceMetrics {
  team_id: string;
  team_name: string;
  performance_score: number;
  efficiency_rating: number;
  completion_rate: number;
  quality_score: number;
  member_satisfaction: number;
  metrics_period: string;
  last_updated: string;
  key_achievements: string[];
  improvement_areas: string[];
  total_certificates?: number;
  total_courses?: number;
  averageSatisfaction?: number;
  complianceScore?: number;
  location_name?: string;
  performance_trend?: number;
}

export interface WorkflowRequest {
  id: string;
  request_type: string;
  status: 'pending' | 'approved' | 'rejected';
  requested_by: string;
  request_data: Record<string, any>;
  created_at: string;
  workflow_type?: string;
  requester?: {
    id: string;
    display_name?: string;
    email: string;
  };
  completed_at?: string;
  approved_by?: string;
}

export interface InstructorPerformanceMetrics {
  instructor_id: string;
  instructor_name: string;
  total_sessions: number;
  total_hours: number;
  average_rating: number;
  completion_rate: number;
  student_satisfaction: number;
  certification_success_rate: number;
  monthly_breakdown: Array<{
    month: string;
    sessions: number;
    hours: number;
    rating: number;
  }>;
  performance_trends: {
    sessions_trend: number;
    rating_trend: number;
    satisfaction_trend: number;
  };
  last_updated: string;
}

export interface MembershipStatistics {
  totalMembers: number;
  activeMembers: number;
  adminMembers: number;
  recentJoins: number;
  membersByStatus: Record<string, number>;
}

export interface RoleChangeRequest {
  id: string;
  userId: string;
  fromRole: string;
  toRole: string;
  requestedBy: string;
  status: 'pending' | 'approved' | 'rejected';
  requiresApproval: boolean;
  processed: boolean;
  createdAt: string;
}
