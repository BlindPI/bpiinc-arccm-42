import { supabase } from '@/integrations/supabase/client';
import type { DatabaseUserRole } from '@/types/database-roles';

/**
 * Safe Team Service - Avoids RLS infinite recursion issues
 * Uses simplified queries that don't trigger circular policy dependencies
 */
export class SafeTeamService {
  /**
   * Get teams safely without triggering RLS recursion
   */
  static async getTeamsSafely(userRole: DatabaseUserRole, userId: string) {
    try {
      // Use direct queries without complex joins to avoid RLS recursion
      const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select('*');

      if (teamsError) {
        console.error('Error fetching teams:', teamsError);
        return [];
      }

      // Get member counts separately to avoid join issues
      const teamsWithCounts = await Promise.all(
        (teams || []).map(async (team) => {
          const { count } = await supabase
            .from('team_members')
            .select('*', { count: 'exact', head: true })
            .eq('team_id', team.id);

          return {
            ...team,
            member_count: count || 0
          };
        })
      );

      return teamsWithCounts;
    } catch (error) {
      console.error('SafeTeamService.getTeamsSafely error:', error);
      return [];
    }
  }

  /**
   * Create team safely using direct INSERT with RLS policies
   */
  static async createTeamSafely(teamData: {
    name: string;
    description?: string;
    location_id?: string;
    team_type?: string;
    status?: string;
  }) {
    try {
      console.log('🔨 SAFETEAMSERVICE: Creating team safely with INSERT:', teamData);
      
      const { data, error } = await supabase
        .from('teams')
        .insert({
          name: teamData.name,
          description: teamData.description || null,
          location_id: teamData.location_id || null,
          team_type: teamData.team_type || 'operational',
          status: teamData.status || 'active',
          performance_score: 85,
          metadata: {},
          monthly_targets: {},
          current_metrics: {}
        })
        .select('*')
        .single();

      if (error) {
        console.error('💥 SAFETEAMSERVICE: Error creating team:', error);
        throw error;
      }
      
      console.log('✅ SAFETEAMSERVICE: Team created successfully:', data);
      return data;
    } catch (error) {
      console.error('Error creating team safely:', error);
      throw error;
    }
  }

  /**
   * Get team members safely
   */
  static async getTeamMembersSafely(teamId: string) {
    try {
      // First get team members
      const { data: members, error: membersError } = await supabase
        .from('team_members')
        .select('*')
        .eq('team_id', teamId);

      if (membersError) throw membersError;

      // Then get profiles separately to avoid RLS issues
      const membersWithProfiles = await Promise.all(
        (members || []).map(async (member) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, email, role')
            .eq('id', member.user_id)
            .single();

          return {
            ...member,
            joined_at: member.created_at || new Date().toISOString(),
            profile: profile || null
          };
        })
      );

      return membersWithProfiles;
    } catch (error) {
      console.error('Error fetching team members safely:', error);
      return [];
    }
  }

  /**
   * Add member safely
   */
  static async addMemberSafely(teamId: string, userId: string, role: string = 'member') {
    try {
      const { error } = await supabase
        .from('team_members')
        .insert({
          team_id: teamId,
          user_id: userId,
          role: role
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error adding team member safely:', error);
      throw error;
    }
  }

  /**
   * Remove member safely
   */
  static async removeMemberSafely(teamId: string, userId: string) {
    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('team_id', teamId)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error removing team member safely:', error);
      throw error;
    }
  }

  /**
   * Update team safely
   */
  static async updateTeamSafely(teamId: string, updates: {
    name?: string;
    description?: string;
    location_id?: string;
    team_type?: string;
    status?: string;
  }) {
    try {
      const { data, error } = await supabase
        .from('teams')
        .update(updates)
        .eq('id', teamId)
        .select('*')
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating team safely:', error);
      throw error;
    }
  }

  /**
   * Delete team safely
   */
  static async deleteTeamSafely(teamId: string) {
    try {
      // First remove all members
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
      console.error('Error deleting team safely:', error);
      throw error;
    }
  }

  /**
   * Archive team safely
   */
  static async archiveTeamSafely(teamId: string, archive: boolean = true) {
    try {
      const { error } = await supabase
        .from('teams')
        .update({ status: archive ? 'archived' : 'active' })
        .eq('id', teamId);

      if (error) throw error;
    } catch (error) {
      console.error('Error archiving team safely:', error);
      throw error;
    }
  }

  /**
   * Get basic analytics safely
   */
  static async getAnalyticsSafely() {
    try {
      const { data: teams } = await supabase
        .from('teams')
        .select('id, status');

      const { data: members } = await supabase
        .from('team_members')
        .select('id');

      return {
        totalTeams: teams?.length || 0,
        totalMembers: members?.length || 0,
        averagePerformance: 85, // Placeholder
        averageCompliance: 90, // Placeholder
        teamsByLocation: {},
        performanceByTeamType: {}
      };
    } catch (error) {
      console.error('Error getting analytics safely:', error);
      return {
        totalTeams: 0,
        totalMembers: 0,
        averagePerformance: 0,
        averageCompliance: 0,
        teamsByLocation: {},
        performanceByTeamType: {}
      };
    }
  }

  /**
   * Get available users for team safely (not already members)
   */
  static async getAvailableUsers(teamId: string) {
    try {
      // First get current team members
      const { data: currentMembers } = await supabase
        .from('team_members')
        .select('user_id')
        .eq('team_id', teamId);

      const memberIds = currentMembers?.map(m => m.user_id) || [];

      // Then get all profiles excluding current members
      const { data: availableUsers, error } = await supabase
        .from('profiles')
        .select('id, display_name, email, role')
        .not('id', 'in', `(${memberIds.length > 0 ? memberIds.join(',') : 'null'})`)
        .not('display_name', 'is', null)
        .order('display_name');

      if (error) throw error;
      return availableUsers || [];
    } catch (error) {
      console.error('Error getting available users safely:', error);
      return [];
    }
  }
}

export default SafeTeamService;