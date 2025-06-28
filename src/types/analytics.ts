
export interface GlobalAnalytics {
  totalUsers: number;
  activeSessions: number;
  completionRate: number;
  complianceScore: number;
  topPerformingTeams: TeamAnalyticsSummary[];
}

export interface TeamAnalyticsSummary {
  id: string;
  name: string;
  performance: number;
  memberCount: number;
}

export interface TeamGoal {
  id: string;
  title: string;
  progress: number;
  target: number;
  status: 'on_track' | 'at_risk' | 'behind';
}

export interface TeamGoalData {
  id: string;
  title: string;
  progress: number;
  target: number;
  status: 'on_track' | 'at_risk' | 'behind';
}

export interface RealPerformanceData {
  performanceRating: number;
  averageSatisfactionScore: number;
  efficiencyRating: number;
  complianceScore: number;
  performanceScore?: number;
}

export interface RealTeamStats {
  performanceScore: number;
  totalMembers: number;
  activeMembers: number;
  completionRate: number;
}

export interface ComplianceProgress {
  completion: {
    overall: number;
    byCategory: Record<string, number>;
    byPriority: Record<string, number>;
  };
  byType: Record<string, { completed: number; total: number }>;
  points: {
    earned: number;
    total: number;
    byCategory: Record<string, number>;
  };
}

export interface ComplianceTierInfo {
  tier: 'basic' | 'robust';
  requirements: string[];
  completedRequirements: number;
  totalRequirements: number;
  completionPercentage: number;
  description?: string;
}

export interface UserAchievement {
  id: string;
  milestone_id: string;
  user_id: string;
  achievement_name: string;
  achievement_description: string;
  achievement_type: string;
  badge_icon: string;
  category: string;
  tier_level: string;
  points_awarded: number;
  points_earned: number;
  achieved_at: string;
  created_at: string;
  updated_at: string;
  metadata: any;
}
