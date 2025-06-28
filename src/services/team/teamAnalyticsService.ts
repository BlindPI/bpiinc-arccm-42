
import { supabase } from '@/integrations/supabase/client';

export interface TeamAnalyticsData {
  totalUsers: number;
  activeSessions: number;
  completionRate: number;
  complianceScore: number;
  topPerformingTeams: Array<{
    id: string;
    name: string;
    performance: number;
    memberCount: number;
  }>;
}

export interface TeamGoalData {
  id: string;
  title: string;
  progress: number;
  target: number;
  status: 'on_track' | 'at_risk' | 'behind';
}

export class TeamAnalyticsService {
  static async getGlobalAnalytics(): Promise<TeamAnalyticsData> {
    try {
      // Get total users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, role');

      if (profilesError) throw profilesError;

      const totalUsers = profiles?.length || 0;

      // Mock data for demo - replace with real queries
      return {
        totalUsers,
        activeSessions: Math.floor(totalUsers * 0.3),
        completionRate: 85.5,
        complianceScore: 92.3,
        topPerformingTeams: [
          {
            id: '1',
            name: 'Training Team Alpha',
            performance: 94.2,
            memberCount: 12
          },
          {
            id: '2', 
            name: 'Compliance Team Beta',
            performance: 89.7,
            memberCount: 8
          },
          {
            id: '3',
            name: 'Operations Team Gamma',
            performance: 87.3,
            memberCount: 15
          }
        ]
      };
    } catch (error) {
      console.error('Error fetching global analytics:', error);
      return {
        totalUsers: 0,
        activeSessions: 0,
        completionRate: 0,
        complianceScore: 0,
        topPerformingTeams: []
      };
    }
  }

  static async getTeamGoals(teamId: string): Promise<TeamGoalData[]> {
    try {
      // Mock data for demo - replace with real queries
      return [
        {
          id: '1',
          title: 'Monthly Training Completion',
          progress: 85,
          target: 100,
          status: 'on_track'
        },
        {
          id: '2',
          title: 'Compliance Score Target',
          progress: 92,
          target: 95,
          status: 'at_risk'
        },
        {
          id: '3',
          title: 'User Engagement Rate',
          progress: 78,
          target: 80,
          status: 'behind'
        }
      ];
    } catch (error) {
      console.error('Error fetching team goals:', error);
      return [];
    }
  }
}
