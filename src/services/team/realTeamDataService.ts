
import { supabase } from '@/integrations/supabase/client';
import type { EnhancedTeam, TeamMember, TeamAnalytics } from '@/types/team-management';

export interface RealTeamData {
  id: string;
  name: string;
  description?: string;
  team_type: string;
  status: 'active' | 'inactive' | 'suspended';
  performance_score: number;
  location_id?: string;
  provider_id?: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
  location?: {
    id: string;
    name: string;
    city?: string;
    state?: string;
  };
  members?: TeamMember[];
  member_count: number;
}

export class RealTeamDataService {
  async getUserTeams(userId: string): Promise<RealTeamData[]> {
    try {
      console.log('RealTeamDataService: Fetching teams for user:', userId);
      
      // Get user's team memberships
      const { data: memberships, error: membershipsError } = await supabase
        .from('team_members')
        .select(`
          team_id,
          role,
          status,
          assignment_start_date,
          teams!inner(
            id,
            name,
            description,
            team_type,
            status,
            performance_score,
            location_id,
            provider_id,
            created_at,
            updated_at,
            metadata,
            locations(
              id,
              name,
              city,
              state
            )
          )
        `)
        .eq('user_id', userId);

      if (membershipsError) {
        console.error('Error fetching team memberships:', membershipsError);
        throw membershipsError;
      }

      if (!memberships || memberships.length === 0) {
        console.log('No team memberships found for user');
        return [];
      }

      // Transform and get member counts
      const teams: RealTeamData[] = [];
      
      for (const membership of memberships) {
        if (!membership.teams) continue;
        
        const team = membership.teams;
        
        // Get member count for this team
        const { count: memberCount } = await supabase
          .from('team_members')
          .select('*', { count: 'exact', head: true })
          .eq('team_id', team.id);

        teams.push({
          id: team.id,
          name: team.name,
          description: team.description,
          team_type: team.team_type,
          status: team.status as 'active' | 'inactive' | 'suspended',
          performance_score: team.performance_score || 0,
          location_id: team.location_id,
          provider_id: team.provider_id,
          created_at: team.created_at,
          updated_at: team.updated_at,
          metadata: team.metadata,
          location: team.locations ? {
            id: team.locations.id,
            name: team.locations.name,
            city: team.locations.city,
            state: team.locations.state
          } : undefined,
          member_count: memberCount || 0
        });
      }

      console.log('RealTeamDataService: Found teams:', teams.length);
      return teams;
    } catch (error) {
      console.error('Error in getUserTeams:', error);
      throw error;
    }
  }

  async getTeamMembers(teamId: string): Promise<TeamMember[]> {
    try {
      const { data: members, error } = await supabase
        .from('team_members')
        .select(`
          id,
          team_id,
          user_id,
          role,
          status,
          team_position,
          assignment_start_date,
          assignment_end_date,
          permissions,
          created_at,
          updated_at,
          profiles!inner(
            id,
            display_name,
            email,
            role as profile_role
          )
        `)
        .eq('team_id', teamId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching team members:', error);
        throw error;
      }

      return (members || []).map(member => ({
        id: member.id,
        team_id: member.team_id,
        user_id: member.user_id,
        role: member.role as 'MEMBER' | 'ADMIN',
        status: member.status || 'active',
        location_assignment: member.team_position,
        assignment_start_date: member.assignment_start_date,
        assignment_end_date: member.assignment_end_date,
        team_position: member.team_position,
        permissions: member.permissions || {},
        created_at: member.created_at,
        updated_at: member.updated_at,
        display_name: member.profiles?.display_name || 'Unknown User',
        profile: member.profiles ? {
          id: member.profiles.id,
          display_name: member.profiles.display_name,
          email: member.profiles.email,
          role: member.profiles.profile_role
        } : undefined
      }));
    } catch (error) {
      console.error('Error fetching team members:', error);
      throw error;
    }
  }

  async getTeamAnalytics(): Promise<TeamAnalytics> {
    try {
      // Get total teams
      const { count: totalTeams } = await supabase
        .from('teams')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Get total members
      const { count: totalMembers } = await supabase
        .from('team_members')
        .select('*', { count: 'exact', head: true });

      // Get average performance
      const { data: performanceData } = await supabase
        .from('teams')
        .select('performance_score')
        .eq('status', 'active');

      const averagePerformance = performanceData?.length 
        ? performanceData.reduce((sum, team) => sum + (team.performance_score || 0), 0) / performanceData.length
        : 0;

      // Get teams by location
      const { data: locationData } = await supabase
        .from('teams')
        .select(`
          location_id,
          locations(name)
        `)
        .eq('status', 'active')
        .not('location_id', 'is', null);

      const teamsByLocation: Record<string, number> = {};
      for (const team of locationData || []) {
        const locationName = team.locations?.name || 'Unknown';
        teamsByLocation[locationName] = (teamsByLocation[locationName] || 0) + 1;
      }

      // Get performance by team type
      const { data: typeData } = await supabase
        .from('teams')
        .select('team_type, performance_score')
        .eq('status', 'active');

      const performanceByTeamType: Record<string, number> = {};
      const typeGroups: Record<string, number[]> = {};
      
      for (const team of typeData || []) {
        if (!typeGroups[team.team_type]) typeGroups[team.team_type] = [];
        typeGroups[team.team_type].push(team.performance_score || 0);
      }
      
      for (const [type, scores] of Object.entries(typeGroups)) {
        performanceByTeamType[type] = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      }

      return {
        totalTeams: totalTeams || 0,
        totalMembers: totalMembers || 0,
        averagePerformance: Math.round(averagePerformance),
        averageCompliance: 85, // Will be calculated from compliance_issues table later
        teamsByLocation,
        performanceByTeamType
      };
    } catch (error) {
      console.error('Error fetching team analytics:', error);
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

  async getTeamPerformanceMetrics(teamId: string) {
    try {
      // Use the existing database function
      const { data, error } = await supabase.rpc(
        'calculate_team_performance_metrics',
        {
          p_team_id: teamId,
          p_start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          p_end_date: new Date().toISOString().split('T')[0]
        }
      );

      if (error) throw error;

      const parsed = typeof data === 'string' ? JSON.parse(data) : data || {};

      return {
        team_id: teamId,
        totalCertificates: Number(parsed.certificates_issued) || 0,
        totalCourses: Number(parsed.courses_conducted) || 0,
        averageSatisfaction: Number(parsed.average_satisfaction_score) || 0,
        complianceScore: Number(parsed.compliance_score) || 0,
        performanceTrend: 0
      };
    } catch (error) {
      console.error('Error fetching team performance metrics:', error);
      return {
        team_id: teamId,
        totalCertificates: 0,
        totalCourses: 0,
        averageSatisfaction: 0,
        complianceScore: 0,
        performanceTrend: 0
      };
    }
  }

  async addTeamMember(teamId: string, userId: string, role: 'MEMBER' | 'ADMIN' = 'MEMBER'): Promise<void> {
    try {
      const { error } = await supabase
        .from('team_members')
        .insert({
          team_id: teamId,
          user_id: userId,
          role,
          status: 'active',
          assignment_start_date: new Date().toISOString(),
          permissions: role === 'ADMIN' ? { admin: true, manage_members: true } : {}
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error adding team member:', error);
      throw error;
    }
  }

  async updateTeamMember(memberId: string, updates: Partial<TeamMember>): Promise<void> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (updates.role !== undefined) updateData.role = updates.role;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.team_position !== undefined) updateData.team_position = updates.team_position;
      if (updates.permissions !== undefined) updateData.permissions = updates.permissions;

      const { error } = await supabase
        .from('team_members')
        .update(updateData)
        .eq('id', memberId);

      if (error) throw error;
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
}

export const realTeamDataService = new RealTeamDataService();
