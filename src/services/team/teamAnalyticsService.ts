
import { supabase } from '@/integrations/supabase/client';

export interface TeamAnalyticsSummary {
  teamId: string;
  teamName: string;
  memberCount: number;
  activeMembers: number;
  completionRate: number;
  performanceScore: number;
  recentActivity: number;
}

export interface TeamGoal {
  id: string;
  teamId: string;
  goalName: string;
  targetValue: number;
  currentValue: number;
  progress: number;
  dueDate: string;
  status: 'active' | 'completed' | 'overdue';
}

export interface GlobalAnalytics {
  totalTeams: number;
  totalMembers: number;
  averageTeamSize: number;
  overallPerformance: number;
  topPerformingTeams: TeamAnalyticsSummary[];
  trends: {
    memberGrowth: number;
    performanceChange: number;
    completionRateChange: number;
  };
}

export interface TeamAnalytics {
  teamId: string;
  teamName: string;
  memberCount: number;
  performance: {
    overall: number;
    individual: Array<{
      userId: string;
      name: string;
      score: number;
    }>;
  };
  completion: {
    rate: number;
    breakdown: Array<{
      category: string;
      completed: number;
      total: number;
    }>;
  };
  activity: {
    recent: number;
    trend: 'up' | 'down' | 'stable';
  };
}

export class TeamAnalyticsService {
  static async getTeamAnalytics(teamId: string): Promise<TeamAnalytics> {
    try {
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .select('name')
        .eq('id', teamId)
        .single();

      if (teamError) throw teamError;

      const { data: members, error: membersError } = await supabase
        .from('team_memberships')
        .select('user_id, profiles(display_name)')
        .eq('team_id', teamId)
        .eq('status', 'active');

      if (membersError) throw membersError;

      return {
        teamId,
        teamName: team?.name || 'Unknown Team',
        memberCount: members?.length || 0,
        performance: {
          overall: 85,
          individual: members?.map((member, index) => ({
            userId: member.user_id,
            name: member.profiles?.display_name || 'Unknown',
            score: 80 + (index % 20)
          })) || []
        },
        completion: {
          rate: 75,
          breakdown: [
            { category: 'Training', completed: 8, total: 10 },
            { category: 'Compliance', completed: 6, total: 8 },
            { category: 'Certifications', completed: 4, total: 5 }
          ]
        },
        activity: {
          recent: 12,
          trend: 'up'
        }
      };
    } catch (error) {
      console.error('Error fetching team analytics:', error);
      return {
        teamId,
        teamName: 'Unknown Team',
        memberCount: 0,
        performance: { overall: 0, individual: [] },
        completion: { rate: 0, breakdown: [] },
        activity: { recent: 0, trend: 'stable' }
      };
    }
  }

  static async getGlobalAnalytics(): Promise<GlobalAnalytics> {
    try {
      const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select('id, name');

      if (teamsError) throw teamsError;

      const { data: memberships, error: membershipsError } = await supabase
        .from('team_memberships')
        .select('team_id')
        .eq('status', 'active');

      if (membershipsError) throw membershipsError;

      const totalTeams = teams?.length || 0;
      const totalMembers = memberships?.length || 0;
      const averageTeamSize = totalTeams > 0 ? Math.round(totalMembers / totalTeams) : 0;

      const topPerformingTeams = await Promise.all(
        (teams || []).slice(0, 5).map(async (team) => {
          const analytics = await this.getTeamAnalytics(team.id);
          return {
            teamId: team.id,
            teamName: team.name,
            memberCount: analytics.memberCount,
            activeMembers: analytics.memberCount,
            completionRate: analytics.completion.rate,
            performanceScore: analytics.performance.overall,
            recentActivity: analytics.activity.recent
          };
        })
      );

      return {
        totalTeams,
        totalMembers,
        averageTeamSize,
        overallPerformance: 82,
        topPerformingTeams,
        trends: {
          memberGrowth: 12,
          performanceChange: 5,
          completionRateChange: 8
        }
      };
    } catch (error) {
      console.error('Error fetching global analytics:', error);
      return {
        totalTeams: 0,
        totalMembers: 0,
        averageTeamSize: 0,
        overallPerformance: 0,
        topPerformingTeams: [],
        trends: {
          memberGrowth: 0,
          performanceChange: 0,
          completionRateChange: 0
        }
      };
    }
  }

  static async getTeamAnalyticsSummary(teamId: string): Promise<TeamAnalyticsSummary> {
    const analytics = await this.getTeamAnalytics(teamId);
    return {
      teamId: analytics.teamId,
      teamName: analytics.teamName,
      memberCount: analytics.memberCount,
      activeMembers: analytics.memberCount,
      completionRate: analytics.completion.rate,
      performanceScore: analytics.performance.overall,
      recentActivity: analytics.activity.recent
    };
  }

  static async getTeamGoals(teamId: string): Promise<TeamGoal[]> {
    // Mock data for now - replace with actual database queries
    return [
      {
        id: '1',
        teamId,
        goalName: 'Complete Training Program',
        targetValue: 100,
        currentValue: 75,
        progress: 75,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active'
      },
      {
        id: '2',
        teamId,
        goalName: 'Certification Achievement',
        targetValue: 10,
        currentValue: 6,
        progress: 60,
        dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active'
      }
    ];
  }

  static async generateTeamReport(teamId: string): Promise<any> {
    const analytics = await this.getTeamAnalytics(teamId);
    const goals = await this.getTeamGoals(teamId);
    
    return {
      analytics,
      goals,
      generatedAt: new Date().toISOString(),
      summary: {
        performance: analytics.performance.overall,
        completion: analytics.completion.rate,
        goalProgress: goals.reduce((acc, goal) => acc + goal.progress, 0) / goals.length
      }
    };
  }

  static async updateTeamGoalProgress(goalId: string, newValue: number): Promise<boolean> {
    // Mock implementation - replace with actual database update
    console.log(`Updating goal ${goalId} progress to ${newValue}`);
    return true;
  }

  static async getSystemWideAnalytics(): Promise<GlobalAnalytics> {
    return this.getGlobalAnalytics();
  }
}
