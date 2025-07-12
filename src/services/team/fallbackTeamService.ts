import { supabase } from '@/integrations/supabase/client';
import type { EnhancedTeam, TeamMemberWithProfile } from '@/types/team-management';

// Fallback service for when RPC functions are not available
export class FallbackTeamService {
  // Get teams with direct table queries
  static async getEnhancedTeams(): Promise<EnhancedTeam[]> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*');

      if (error) {
        console.error('Error fetching teams:', error);
        // Return empty array instead of throwing to prevent UI crashes
        return [];
      }

      // Get member counts for each team using RLS-safe function
      const teamsWithMembers = await Promise.all(
        (data || []).map(async (team) => {
          try {
            const memberData = await this.getTeamMembers(team.id);
            const activeMembers = memberData.filter(m => m.status === 'active');

            return {
              id: team.id,
              name: team.name,
              description: team.description,
              team_type: team.team_type || 'general',
              status: team.status || 'active',
              performance_score: team.performance_score || 0,
              location_id: team.location_id,
              provider_id: team.provider_id ? String(team.provider_id) : undefined,
              created_by: team.created_by,
              created_at: team.created_at,
              updated_at: team.updated_at,
              metadata: team.metadata || {},
              monthly_targets: team.monthly_targets || {},
              current_metrics: team.current_metrics || {},
              members: activeMembers || [],
              member_count: activeMembers.length,
            } as EnhancedTeam;
          } catch (memberError) {
            console.error('Error fetching members for team', team.id, memberError);
            return {
              id: team.id,
              name: team.name,
              description: team.description,
              team_type: team.team_type || 'general',
              status: team.status || 'active',
              performance_score: team.performance_score || 0,
              location_id: team.location_id,
              provider_id: team.provider_id ? String(team.provider_id) : undefined,
              created_by: team.created_by,
              created_at: team.created_at,
              updated_at: team.updated_at,
              metadata: team.metadata || {},
              monthly_targets: team.monthly_targets || {},
              current_metrics: team.current_metrics || {},
              members: [],
              member_count: 0,
            } as EnhancedTeam;
          }
        })
      );

      return teamsWithMembers;
    } catch (error) {
      console.error('Failed to fetch enhanced teams:', error);
      return []; // Return empty array instead of throwing
    }
  }

  // Get team analytics with direct queries
  static async getTeamAnalytics() {
    try {
      // Get basic team statistics
      const { data: teams } = await supabase
        .from('teams')
        .select('id, status, team_type, performance_score, location_id');

      const { data: members } = await supabase
        .from('team_members')
        .select('id, status')
        .eq('status', 'active');

      const totalTeams = teams?.length || 0;
      const activeTeams = teams?.filter(t => t.status === 'active').length || 0;
      const totalMembers = members?.length || 0;
      const avgPerformance = totalTeams > 0 
        ? Math.round((teams?.reduce((sum, t) => sum + (t.performance_score || 0), 0) || 0) / totalTeams)
        : 0;

      // Group teams by location
      const teamsByLocation: Record<string, number> = {};
      teams?.forEach(team => {
        const locationId = team.location_id || 'unassigned';
        teamsByLocation[locationId] = (teamsByLocation[locationId] || 0) + 1;
      });

      // Group performance by team type
      const performanceByTeamType: Record<string, number> = {};
      const teamTypeGroups: Record<string, number[]> = {};
      teams?.forEach(team => {
        const type = team.team_type || 'general';
        if (!teamTypeGroups[type]) teamTypeGroups[type] = [];
        teamTypeGroups[type].push(team.performance_score || 0);
      });

      Object.keys(teamTypeGroups).forEach(type => {
        const scores = teamTypeGroups[type];
        performanceByTeamType[type] = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
      });

      return {
        totalTeams,
        activeTeams,
        totalMembers,
        avgPerformance,
        teamsByLocation,
        performanceByTeamType,
      };
    } catch (error) {
      console.error('Failed to fetch team analytics:', error);
      return {
        totalTeams: 0,
        activeTeams: 0,
        totalMembers: 0,
        avgPerformance: 0,
        teamsByLocation: {},
        performanceByTeamType: {},
      };
    }
  }

  // Create team with direct insert
  static async createTeam(teamData: {
    name: string;
    description?: string;
    team_type: string;
    location_id?: string;
    provider_id?: string;
    created_by: string;
  }) {
    try {
      const { data, error } = await supabase
        .from('teams')
        .insert({
          name: teamData.name,
          description: teamData.description,
          team_type: teamData.team_type,
          location_id: teamData.location_id,
          provider_id: teamData.provider_id || null, // Keep as string
          created_by: teamData.created_by,
          status: 'active',
          performance_score: 0,
          metadata: {},
          monthly_targets: {},
          current_metrics: {}
        })
        .select()
        .single();

      if (error) throw error;

      return {
        ...data,
        members: [],
        member_count: 0,
        metadata: data.metadata || {},
        monthly_targets: data.monthly_targets || {},
        current_metrics: data.current_metrics || {},
      };
    } catch (error) {
      console.error('Failed to create team:', error);
      throw error;
    }
  }

  // Get team members using the new RLS-safe function
  static async getTeamMembers(teamId: string): Promise<TeamMemberWithProfile[]> {
    try {
      // Use direct query (RLS policies are now fixed to prevent recursion)
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          *,
          profiles!inner(
            id,
            display_name,
            email,
            role
          )
        `)
        .eq('team_id', teamId);

      if (error) {
        console.error('Error fetching team members:', error);
        return [];
      }

      return (data || []).map(member => ({
        id: member.id,
        team_id: member.team_id,
        user_id: member.user_id,
        role: member.role as 'ADMIN' | 'MEMBER',
        status: member.status as 'active' | 'inactive' | 'on_leave' | 'suspended',
        location_assignment: member.location_assignment,
        assignment_start_date: member.assignment_start_date,
        assignment_end_date: member.assignment_end_date,
        team_position: member.team_position,
        permissions: member.permissions || {},
        created_at: member.created_at,
        updated_at: member.updated_at,
        last_activity: member.last_activity,
        display_name: member.profiles?.display_name || 'Unknown User',
        profiles: {
          id: member.profiles?.id || member.user_id,
          display_name: member.profiles?.display_name || 'Unknown User',
          email: member.profiles?.email,
          role: member.profiles?.role || 'USER',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      })) as TeamMemberWithProfile[];
    } catch (error) {
      console.error('Failed to fetch team members:', error);
      return [];
    }
  }

  // Add team member
  static async addTeamMember(
    teamId: string, 
    userId: string, 
    role: 'ADMIN' | 'MEMBER' = 'MEMBER'
  ) {
    try {
      const { error } = await supabase
        .from('team_members')
        .insert({
          team_id: teamId,
          user_id: userId,
          role: role,
          status: 'active',
          permissions: {},
          assignment_start_date: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to add team member:', error);
      throw error;
    }
  }

  // Remove team member
  static async removeTeamMember(teamId: string, userId: string) {
    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('team_id', teamId)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to remove team member:', error);
      throw error;
    }
  }

  // Update team member role
  static async updateTeamMemberRole(
    teamId: string,
    userId: string,
    newRole: 'ADMIN' | 'MEMBER'
  ) {
    try {
      const { error } = await supabase
        .from('team_members')
        .update({ 
          role: newRole,
          updated_at: new Date().toISOString()
        })
        .eq('team_id', teamId)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to update member role:', error);
      throw error;
    }
  }

  // Get available users for team assignment
  static async getAvailableUsers() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, email, role')
        .neq('role', 'SA') // Exclude system admins from regular assignment
        .limit(100);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Failed to fetch available users:', error);
      return [];
    }
  }

  // Update team
  static async updateTeam(teamId: string, updates: Partial<EnhancedTeam>) {
    try {
      const { data, error } = await supabase
        .from('teams')
        .update({
          name: updates.name,
          description: updates.description,
          team_type: updates.team_type,
          status: updates.status,
          location_id: updates.location_id,
          provider_id: updates.provider_id || undefined, // Keep as string
          metadata: updates.metadata,
          monthly_targets: updates.monthly_targets,
          current_metrics: updates.current_metrics,
          updated_at: new Date().toISOString()
        })
        .eq('id', teamId)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Failed to update team:', error);
      throw error;
    }
  }

  // Delete team
  static async deleteTeam(teamId: string) {
    try {
      // First check if team has members
      const { data: members } = await supabase
        .from('team_members')
        .select('id')
        .eq('team_id', teamId);

      if (members && members.length > 0) {
        throw new Error('Cannot delete team with active members. Remove all members first.');
      }

      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to delete team:', error);
      throw error;
    }
  }
}