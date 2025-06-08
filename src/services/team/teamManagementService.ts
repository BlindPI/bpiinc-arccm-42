
import { supabase } from '@/integrations/supabase/client';

export interface Team {
  id: string;
  name: string;
  description?: string;
  team_type: string;
  status: 'active' | 'inactive';
  location_id?: string;
  performance_score?: number;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: 'ADMIN' | 'MEMBER';
  location_assignment?: string;
  assignment_start_date?: string;
  assignment_end_date?: string;
  team_position?: string;
  permissions?: Record<string, any>;
  status: 'active' | 'inactive';
}

export interface CreateTeamRequest {
  name: string;
  description?: string;
  team_type: string;
  location_id?: string;
}

export interface TeamAnalytics {
  memberCount: number;
  performanceScore: number;
  complianceScore: number;
  activityLevel: number;
  trends: {
    memberGrowth: number;
    performanceChange: number;
    complianceChange: number;
  };
}

export class TeamManagementService {
  // Team CRUD Operations
  async createTeam(teamData: CreateTeamRequest, createdBy: string): Promise<Team> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .insert({
          ...teamData,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Add creator as team admin
      await this.addTeamMember(data.id, createdBy, 'ADMIN');

      return data;
    } catch (error) {
      console.error('Error creating team:', error);
      throw error;
    }
  }

  async updateTeam(teamId: string, updates: Partial<Team>): Promise<Team> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', teamId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating team:', error);
      throw error;
    }
  }

  async deleteTeam(teamId: string): Promise<void> {
    try {
      // First remove all team members
      await supabase
        .from('team_members')
        .delete()
        .eq('team_id', teamId);

      // Then delete the team
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting team:', error);
      throw error;
    }
  }

  async getTeam(teamId: string): Promise<Team | null> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select(`
          *,
          locations(
            id,
            name
          )
        `)
        .eq('id', teamId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching team:', error);
      return null;
    }
  }

  async getAllTeams(): Promise<Team[]> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select(`
          *,
          locations(
            id,
            name
          )
        `)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching teams:', error);
      return [];
    }
  }

  // Team Member Management
  async addTeamMember(
    teamId: string, 
    userId: string, 
    role: 'ADMIN' | 'MEMBER',
    additionalData?: Partial<TeamMember>
  ): Promise<TeamMember> {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .insert({
          team_id: teamId,
          user_id: userId,
          role,
          status: 'active',
          assignment_start_date: new Date().toISOString(),
          ...additionalData
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding team member:', error);
      throw error;
    }
  }

  async updateTeamMember(
    memberId: string, 
    updates: Partial<TeamMember>
  ): Promise<TeamMember> {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .update(updates)
        .eq('id', memberId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating team member:', error);
      throw error;
    }
  }

  async removeTeamMember(memberId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;
    } catch (error) {
      console.error('Error removing team member:', error);
      throw error;
    }
  }

  async getTeamMembers(teamId: string): Promise<TeamMember[]> {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          *,
          profiles(
            id,
            display_name,
            email,
            role
          )
        `)
        .eq('team_id', teamId)
        .eq('status', 'active');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching team members:', error);
      return [];
    }
  }

  // Team Analytics
  async getTeamAnalytics(teamId: string): Promise<TeamAnalytics> {
    try {
      const members = await this.getTeamMembers(teamId);
      
      // Mock analytics data - in real implementation, this would come from actual metrics
      return {
        memberCount: members.length,
        performanceScore: Math.floor(Math.random() * 30) + 70, // 70-100
        complianceScore: Math.floor(Math.random() * 20) + 80,  // 80-100
        activityLevel: Math.floor(Math.random() * 40) + 60,    // 60-100
        trends: {
          memberGrowth: Math.floor(Math.random() * 20) - 10,   // -10 to +10
          performanceChange: Math.floor(Math.random() * 10) - 5, // -5 to +5
          complianceChange: Math.floor(Math.random() * 6) - 3    // -3 to +3
        }
      };
    } catch (error) {
      console.error('Error fetching team analytics:', error);
      throw error;
    }
  }

  async getSystemWideAnalytics(): Promise<{
    totalTeams: number;
    totalMembers: number;
    averagePerformance: number;
    averageCompliance: number;
  }> {
    try {
      const teams = await this.getAllTeams();
      const analytics = await Promise.all(
        teams.map(team => this.getTeamAnalytics(team.id))
      );

      return {
        totalTeams: teams.length,
        totalMembers: analytics.reduce((sum, a) => sum + a.memberCount, 0),
        averagePerformance: analytics.reduce((sum, a) => sum + a.performanceScore, 0) / analytics.length || 0,
        averageCompliance: analytics.reduce((sum, a) => sum + a.complianceScore, 0) / analytics.length || 0
      };
    } catch (error) {
      console.error('Error fetching system analytics:', error);
      throw error;
    }
  }

  // Utility Methods
  async isTeamAdmin(userId: string, teamId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('role')
        .eq('user_id', userId)
        .eq('team_id', teamId)
        .eq('status', 'active')
        .single();

      if (error) return false;
      return data?.role === 'ADMIN';
    } catch (error) {
      console.error('Error checking team admin status:', error);
      return false;
    }
  }

  async getUserTeamRole(userId: string, teamId: string): Promise<'ADMIN' | 'MEMBER' | null> {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('role')
        .eq('user_id', userId)
        .eq('team_id', teamId)
        .eq('status', 'active')
        .single();

      if (error) return null;
      return data?.role || null;
    } catch (error) {
      console.error('Error getting user team role:', error);
      return null;
    }
  }
}

export const teamManagementService = new TeamManagementService();
