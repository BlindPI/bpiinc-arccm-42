
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

// Fixed RealPerformanceData to match database schema
export interface RealPerformanceData {
  performanceRating: number;
  averageSatisfactionScore: number;
  efficiencyRating: number;
  complianceScore: number;
  performanceScore: number;
}

// Fixed RealTeamStats to include performanceScore
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

// Updated ComplianceTierInfo to match database schema
export interface ComplianceTierInfo {
  tier: 'basic' | 'robust';
  requirements: string[];
  completedRequirements: number;
  totalRequirements: number;
  completionPercentage: number;
  description?: string;
  completed_requirements?: number;
  total_requirements?: number;
  completion_percentage?: number;
}

// Updated UserAchievement to match actual database table structure
export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_name: string;
  achievement_description: string;
  achievement_type: string;
  badge_icon: string;
  category: string;
  tier_level: string;
  points_awarded: number;
  achieved_at: string;
  created_at: string;
  updated_at: string;
  metadata: any;
}

export interface AnalyticsReport {
  id: string;
  name: string;
  description?: string;
  report_type: string;
  configuration: Record<string, any>;
  created_by?: string;
  created_at: string;
  updated_at: string;
  is_automated?: boolean;
  schedule_config?: Record<string, any>;
}

// Updated EmailCampaign to match database schema
export interface EmailCampaign {
  id: string;
  campaign_name: string; // This is the actual field name in database
  subject_line: string; // This is the actual field name in database
  content: string;
  campaign_type: 'newsletter' | 'promotional' | 'drip' | 'event' | 'follow_up';
  status: string;
  sent_count?: number;
  created_at: string;
  updated_at: string;
  // Additional database fields
  html_content?: string;
  sender_name: string;
  sender_email: string;
  reply_to_email?: string;
  target_audience?: any;
  send_date?: string;
  created_by?: string;
  total_recipients?: number;
  delivered_count?: number;
  opened_count?: number;
  clicked_count?: number;
  bounced_count?: number;
  unsubscribed_count?: number;
  automation_rules?: any;
  tracking_enabled?: boolean;
}
