
// Team management types - missing interfaces

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
}

export interface TeamLocationAssignment {
  id: string;
  team_id: string;
  location_id: string;
  assignment_type: 'primary' | 'secondary' | 'coverage';
  is_active: boolean;
  assigned_at: string;
  assigned_by: string;
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
}

// Enhanced Team interface with missing properties
export interface EnhancedTeam {
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
  member_count?: number;
  members?: Array<{
    id: string;
    user_id: string;
    role: string;
    joined_at: string;
    profile?: {
      display_name?: string;
      email: string;
    };
  }>;
  location?: {
    id: string;
    name: string;
    city?: string;
    state?: string;
  };
}
