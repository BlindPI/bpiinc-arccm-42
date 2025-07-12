import { supabase } from '@/integrations/supabase/client';
import type { DatabaseUserRole } from '@/types/database-roles';

export interface TeamPerformanceMetrics {
  team_id: string;
  metric_date: string;
  certificates_issued: number;
  courses_conducted: number;
  average_satisfaction_score: number;
  compliance_score: number;
  member_retention_rate: number;
  training_hours_delivered: number;
  goal_completion_rate: number;
  productivity_score: number;
}

export interface TeamGoal {
  id: string;
  team_id: string;
  goal_type: 'certificates' | 'courses' | 'satisfaction' | 'compliance' | 'retention' | 'training_hours';
  title: string;
  description?: string;
  target_value: number;
  current_value: number;
  target_date: string;
  status: 'active' | 'completed' | 'overdue' | 'cancelled';
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TeamAnalyticsSummary {
  team_id: string;
  team_name: string;
  current_period: TeamPerformanceMetrics;
  previous_period: TeamPerformanceMetrics;
  trend_analysis: {
    certificates_trend: number;
    courses_trend: number;
    satisfaction_trend: number;
    compliance_trend: number;
    retention_trend: number;
  };
  goals_summary: {
    total_goals: number;
    completed_goals: number;
    overdue_goals: number;
    completion_rate: number;
  };
  ranking: {
    overall_rank: number;
    total_teams: number;
    performance_percentile: number;
  };
}

export interface GlobalAnalytics {
  total_teams: number;
  total_members: number;
  average_performance: number;
  top_performing_teams: Array<{
    team_id: string;
    team_name: string;
    performance_score: number;
  }>;
  performance_distribution: {
    excellent: number; // 90-100%
    good: number;      // 70-89%
    average: number;   // 50-69%
    poor: number;      // <50%
  };
  monthly_trends: Array<{
    month: string;
    avg_certificates: number;
    avg_courses: number;
    avg_satisfaction: number;
    avg_compliance: number;
  }>;
}

export class TeamAnalyticsService {
  // Verify analytics access permissions
  private static async verifyAnalyticsAccess(userId: string): Promise<boolean> {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (error || !profile) {
        console.error('Error verifying analytics access:', error);
        return false;
      }

      // SA, AD, and team admins can access analytics
      return ['SA', 'AD'].includes(profile.role);
    } catch (error) {
      console.error('Failed to verify analytics access:', error);
      return false;
    }
  }

  // Get team performance metrics for a specific period
  static async getTeamPerformanceMetrics(
    teamId: string,
    startDate: string,
    endDate: string
  ): Promise<TeamPerformanceMetrics[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const hasAccess = await this.verifyAnalyticsAccess(user.id);
      if (!hasAccess) {
        throw new Error('Insufficient permissions to access team analytics');
      }

      // For now, generate mock data since we don't have the performance metrics table yet
      // In a real implementation, this would query the team_performance_metrics table
      const mockMetrics: TeamPerformanceMetrics = {
        team_id: teamId,
        metric_date: new Date().toISOString().split('T')[0],
        certificates_issued: Math.floor(Math.random() * 50) + 10,
        courses_conducted: Math.floor(Math.random() * 20) + 5,
        average_satisfaction_score: Math.random() * 2 + 3, // 3-5 scale
        compliance_score: Math.random() * 30 + 70, // 70-100%
        member_retention_rate: Math.random() * 20 + 80, // 80-100%
        training_hours_delivered: Math.floor(Math.random() * 200) + 50,
        goal_completion_rate: Math.random() * 40 + 60, // 60-100%
        productivity_score: Math.random() * 30 + 70 // 70-100%
      };

      return [mockMetrics];
    } catch (error) {
      console.error('Failed to fetch team performance metrics:', error);
      throw error;
    }
  }

  // Get team goals and their progress
  static async getTeamGoals(teamId: string): Promise<TeamGoal[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const hasAccess = await this.verifyAnalyticsAccess(user.id);
      if (!hasAccess) {
        throw new Error('Insufficient permissions to access team goals');
      }

      // Mock data for now - in real implementation, query team_goals table
      const mockGoals: TeamGoal[] = [
        {
          id: '1',
          team_id: teamId,
          goal_type: 'certificates',
          title: 'Issue 100 Certificates',
          description: 'Issue 100 certificates by end of quarter',
          target_value: 100,
          current_value: 75,
          target_date: '2025-12-31',
          status: 'active',
          created_by: user.id,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-06-15T00:00:00Z'
        },
        {
          id: '2',
          team_id: teamId,
          goal_type: 'satisfaction',
          title: 'Maintain 4.5+ Satisfaction',
          description: 'Maintain average satisfaction score above 4.5',
          target_value: 4.5,
          current_value: 4.3,
          target_date: '2025-12-31',
          status: 'active',
          created_by: user.id,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-06-15T00:00:00Z'
        }
      ];

      return mockGoals;
    } catch (error) {
      console.error('Failed to fetch team goals:', error);
      throw error;
    }
  }

  // Create a new team goal
  static async createTeamGoal(goalData: Omit<TeamGoal, 'id' | 'created_at' | 'updated_at'>): Promise<TeamGoal> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const hasAccess = await this.verifyAnalyticsAccess(user.id);
      if (!hasAccess) {
        throw new Error('Insufficient permissions to create team goals');
      }

      // Mock implementation - in real version, insert into team_goals table
      const newGoal: TeamGoal = {
        ...goalData,
        id: Math.random().toString(36).substr(2, 9),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      return newGoal;
    } catch (error) {
      console.error('Failed to create team goal:', error);
      throw error;
    }
  }

  // Update team goal progress
  static async updateTeamGoalProgress(goalId: string, currentValue: number): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const hasAccess = await this.verifyAnalyticsAccess(user.id);
      if (!hasAccess) {
        throw new Error('Insufficient permissions to update team goals');
      }

      // Mock implementation - in real version, update team_goals table
      console.log(`Updated goal ${goalId} progress to ${currentValue}`);
    } catch (error) {
      console.error('Failed to update team goal progress:', error);
      throw error;
    }
  }

  // Get comprehensive team analytics summary
  static async getTeamAnalyticsSummary(teamId: string): Promise<TeamAnalyticsSummary> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const hasAccess = await this.verifyAnalyticsAccess(user.id);
      if (!hasAccess) {
        throw new Error('Insufficient permissions to access team analytics');
      }

      // Get team name
      const { data: team } = await supabase
        .from('teams')
        .select('name')
        .eq('id', teamId)
        .single();

      if (!team) {
        throw new Error('Team not found');
      }

      // Mock comprehensive analytics data
      const currentPeriod: TeamPerformanceMetrics = {
        team_id: teamId,
        metric_date: new Date().toISOString().split('T')[0],
        certificates_issued: 45,
        courses_conducted: 12,
        average_satisfaction_score: 4.2,
        compliance_score: 85,
        member_retention_rate: 92,
        training_hours_delivered: 180,
        goal_completion_rate: 75,
        productivity_score: 88
      };

      const previousPeriod: TeamPerformanceMetrics = {
        team_id: teamId,
        metric_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        certificates_issued: 38,
        courses_conducted: 10,
        average_satisfaction_score: 4.0,
        compliance_score: 82,
        member_retention_rate: 89,
        training_hours_delivered: 165,
        goal_completion_rate: 70,
        productivity_score: 85
      };

      const summary: TeamAnalyticsSummary = {
        team_id: teamId,
        team_name: team.name,
        current_period: currentPeriod,
        previous_period: previousPeriod,
        trend_analysis: {
          certificates_trend: ((currentPeriod.certificates_issued - previousPeriod.certificates_issued) / previousPeriod.certificates_issued) * 100,
          courses_trend: ((currentPeriod.courses_conducted - previousPeriod.courses_conducted) / previousPeriod.courses_conducted) * 100,
          satisfaction_trend: ((currentPeriod.average_satisfaction_score - previousPeriod.average_satisfaction_score) / previousPeriod.average_satisfaction_score) * 100,
          compliance_trend: ((currentPeriod.compliance_score - previousPeriod.compliance_score) / previousPeriod.compliance_score) * 100,
          retention_trend: ((currentPeriod.member_retention_rate - previousPeriod.member_retention_rate) / previousPeriod.member_retention_rate) * 100
        },
        goals_summary: {
          total_goals: 5,
          completed_goals: 2,
          overdue_goals: 1,
          completion_rate: 40
        },
        ranking: {
          overall_rank: 3,
          total_teams: 15,
          performance_percentile: 80
        }
      };

      return summary;
    } catch (error) {
      console.error('Failed to fetch team analytics summary:', error);
      throw error;
    }
  }

  // Get global analytics across all teams
  static async getGlobalAnalytics(): Promise<GlobalAnalytics> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const hasAccess = await this.verifyAnalyticsAccess(user.id);
      if (!hasAccess) {
        throw new Error('Insufficient permissions to access global analytics');
      }

      // Get basic team data
      const { data: teams } = await supabase
        .from('teams')
        .select('id, name, performance_score, status')
        .eq('status', 'active');

      const { data: members } = await supabase
        .from('team_members')
        .select('id')
        .eq('status', 'active');

      const totalTeams = teams?.length || 0;
      const totalMembers = members?.length || 0;
      const averagePerformance = teams?.length 
        ? Math.round(teams.reduce((sum, team) => sum + (team.performance_score || 0), 0) / teams.length)
        : 0;

      // Mock additional analytics data
      const globalAnalytics: GlobalAnalytics = {
        total_teams: totalTeams,
        total_members: totalMembers,
        average_performance: averagePerformance,
        top_performing_teams: teams?.slice(0, 5).map(team => ({
          team_id: team.id,
          team_name: team.name,
          performance_score: team.performance_score || 0
        })) || [],
        performance_distribution: {
          excellent: Math.floor(totalTeams * 0.2),
          good: Math.floor(totalTeams * 0.4),
          average: Math.floor(totalTeams * 0.3),
          poor: Math.floor(totalTeams * 0.1)
        },
        monthly_trends: [
          { month: '2025-01', avg_certificates: 35, avg_courses: 8, avg_satisfaction: 4.1, avg_compliance: 80 },
          { month: '2025-02', avg_certificates: 38, avg_courses: 9, avg_satisfaction: 4.2, avg_compliance: 82 },
          { month: '2025-03', avg_certificates: 42, avg_courses: 10, avg_satisfaction: 4.3, avg_compliance: 84 },
          { month: '2025-04', avg_certificates: 45, avg_courses: 11, avg_satisfaction: 4.2, avg_compliance: 85 },
          { month: '2025-05', avg_certificates: 48, avg_courses: 12, avg_satisfaction: 4.4, avg_compliance: 87 },
          { month: '2025-06', avg_certificates: 50, avg_courses: 13, avg_satisfaction: 4.5, avg_compliance: 88 }
        ]
      };

      return globalAnalytics;
    } catch (error) {
      console.error('Failed to fetch global analytics:', error);
      throw error;
    }
  }

  // Generate team performance report
  static async generateTeamReport(
    teamId: string,
    reportType: 'monthly' | 'quarterly' | 'annual',
    format: 'json' | 'csv' | 'pdf' = 'json'
  ): Promise<any> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const hasAccess = await this.verifyAnalyticsAccess(user.id);
      if (!hasAccess) {
        throw new Error('Insufficient permissions to generate reports');
      }

      const summary = await this.getTeamAnalyticsSummary(teamId);
      const goals = await this.getTeamGoals(teamId);

      const report = {
        team_id: teamId,
        team_name: summary.team_name,
        report_type: reportType,
        generated_at: new Date().toISOString(),
        generated_by: user.id,
        performance_summary: summary,
        goals: goals,
        recommendations: [
          'Focus on improving satisfaction scores',
          'Increase course completion rates',
          'Maintain current compliance levels'
        ]
      };

      return report;
    } catch (error) {
      console.error('Failed to generate team report:', error);
      throw error;
    }
  }
}
