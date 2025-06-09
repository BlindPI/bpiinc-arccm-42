
// Team management types - complete interface definitions

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
  // Additional properties needed by components
  averagePerformance: number;
  averageCompliance: number;
  teamsByLocation: Record<string, number>;
  performanceByTeamType: Record<string, number>;
  teamsByProvider: Record<string, number>;
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
  // Additional properties for components
  total_certificates?: number;
  total_courses?: number;
  averageSatisfaction?: number;
  complianceScore?: number;
  location_name?: string;
  performance_trend?: number;
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
  // Additional properties needed by components
  totalTeams: number;
  totalMembers: number;
  averagePerformance: number;
  averageCompliance: number;
  teamsByProvider: Record<string, number>;
}

// Core Team interfaces with fixed properties
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

export interface TeamMemberWithProfile {
  id: string;
  team_id: string;
  user_id: string;
  role: 'ADMIN' | 'MEMBER';
  joined_at: string;
  status: 'active' | 'inactive';
  permissions?: string[];
  // Fixed: changed from profiles to profile to match database schema
  profile?: {
    id: string;
    display_name?: string;
    email: string;
    role: string;
  };
  // Added missing properties that components expect
  created_at?: string;
  last_activity?: string;
}

// Enhanced Team interface with missing properties
export interface EnhancedTeam {
  id: string;
  name: string;
  description?: string;
  team_type: string;
  status: 'active' | 'inactive' | 'archived' | 'suspended';
  location_id?: string;
  provider_id?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  performance_score?: number;
  member_count?: number;
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
  };
  metrics?: {
    performance_score: number;
    compliance_score: number;
    member_count: number;
  };
}

// Fixed: Request type with created_by field
export interface CreateTeamRequest {
  name: string;
  description?: string;
  team_type: string;
  location_id?: string;
  provider_id?: string;
  created_by: string; // Added this required field
  metadata?: Record<string, any>;
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
