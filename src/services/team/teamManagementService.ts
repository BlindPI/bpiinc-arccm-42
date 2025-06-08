
import { supabase } from '@/integrations/supabase/client';
import type { 
  Team, 
  EnhancedTeam, 
  TeamMember, 
  TeamMemberWithProfile,
  CreateTeamRequest,
  TeamPerformanceMetrics,
  TeamAnalytics,
  TeamLocationAssignment
} from '@/types/team-management';

export class TeamManagementService {
  async createTeam(teamData: CreateTeamRequest): Promise<Team> {
    try {
      const insertData = {
        name: teamData.name,
        description: teamData.description,
        team_type: teamData.team_type,
        location_id: teamData.location_id,
        provider_id: teamData.provider_id,
        created_by: teamData.created_by,
        metadata: teamData.metadata || {},
        monthly_targets: {},
        current_metrics: {},
        performance_score: 0,
        status: 'active' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('teams')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      return data as Team;
    } catch (error) {
      console.error('Error creating team:', error);
      throw error;
    }
  }

  async createTeamWithLocation(teamData: CreateTeamRequest & { location_id: string }): Promise<Team> {
    return this.createTeam(teamData);
  }

  async updateTeam(teamId: string, updates: Partial<Team>): Promise<Team> {
    try {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('teams')
        .update(updateData)
        .eq('id', teamId)
        .select()
        .single();

      if (error) throw error;

      return data as Team;
    } catch (error) {
      console.error('Error updating team:', error);
      throw error;
    }
  }

  async deleteTeam(teamId: string): Promise<void> {
    try {
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

  async getAllTeams(): Promise<Team[]> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []) as Team[];
    } catch (error) {
      console.error('Error fetching teams:', error);
      return [];
    }
  }

  async getEnhancedTeams(): Promise<EnhancedTeam[]> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select(`
          *,
          locations:location_id(id, name, city, state, address, created_at, updated_at),
          authorized_providers:provider_id(id, name, provider_type, status, performance_rating, compliance_score, created_at, updated_at),
          team_members(
            id,
            team_id,
            user_id,
            role,
            status,
            location_assignment,
            assignment_start_date,
            assignment_end_date,
            team_position,
            permissions,
            created_at,
            updated_at,
            profiles:user_id(id, display_name, email, role, created_at, updated_at)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(team => ({
        ...team,
        metadata: team.metadata || {},
        location: team.locations || undefined,
        provider: team.authorized_providers || undefined,
        members: (team.team_members || []).map((member: any) => ({
          ...member,
          display_name: member.profiles?.display_name || member.user_id || 'Unknown',
          profiles: member.profiles
        }))
      })) as EnhancedTeam[];
    } catch (error) {
      console.error('Error fetching enhanced teams:', error);
      return [];
    }
  }

  async getTeamsByLocation(locationId: string): Promise<EnhancedTeam[]> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select(`
          *,
          locations:location_id(id, name, city, state, address, created_at, updated_at),
          authorized_providers:provider_id(id, name, provider_type, status, performance_rating, compliance_score, created_at, updated_at),
          team_members(
            id,
            team_id,
            user_id,
            role,
            status,
            location_assignment,
            assignment_start_date,
            assignment_end_date,
            team_position,
            permissions,
            created_at,
            updated_at,
            profiles:user_id(id, display_name, email, role, created_at, updated_at)
          )
        `)
        .eq('location_id', locationId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(team => ({
        ...team,
        metadata: team.metadata || {},
        location: team.locations || undefined,
        provider: team.authorized_providers || undefined,
        members: (team.team_members || []).map((member: any) => ({
          ...member,
          display_name: member.profiles?.display_name || member.user_id || 'Unknown',
          profiles: member.profiles
        }))
      })) as EnhancedTeam[];
    } catch (error) {
      console.error('Error fetching teams by location:', error);
      return [];
    }
  }

  async getProviderTeams(providerId: string): Promise<EnhancedTeam[]> {
    try {
      // Convert string to number for provider_id comparison
      const providerIdNum = parseInt(providerId, 10);
      
      const { data, error } = await supabase
        .from('teams')
        .select(`
          *,
          locations:location_id(id, name, city, state, address, created_at, updated_at),
          authorized_providers:provider_id(id, name, provider_type, status, performance_rating, compliance_score, created_at, updated_at),
          team_members(
            id,
            team_id,
            user_id,
            role,
            status,
            location_assignment,
            assignment_start_date,
            assignment_end_date,
            team_position,
            permissions,
            created_at,
            updated_at,
            profiles:user_id(id, display_name, email, role, created_at, updated_at)
          )
        `)
        .eq('provider_id', providerIdNum)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(team => ({
        ...team,
        metadata: team.metadata || {},
        location: team.locations || undefined,
        provider: team.authorized_providers || undefined,
        members: (team.team_members || []).map((member: any) => ({
          ...member,
          display_name: member.profiles?.display_name || member.user_id || 'Unknown',
          profiles: member.profiles
        }))
      })) as EnhancedTeam[];
    } catch (error) {
      console.error('Error fetching provider teams:', error);
      return [];
    }
  }

  async getTeamPerformanceMetrics(teamId: string): Promise<TeamPerformanceMetrics | null> {
    try {
      // Get team performance from the database
      const { data: performanceData, error: perfError } = await supabase
        .from('provider_performance')
        .select(`
          *,
          teams!inner(
            id,
            name,
            locations:location_id(name)
          )
        `)
        .eq('team_id', teamId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (perfError && perfError.code !== 'PGRST116') {
        throw perfError;
      }

      // If no performance data exists, return default metrics
      if (!performanceData) {
        const { data: teamData } = await supabase
          .from('teams')
          .select(`
            id,
            name,
            locations:location_id(name)
          `)
          .eq('id', teamId)
          .single();

        return {
          team_id: teamId,
          location_name: teamData?.locations?.name || 'Unknown',
          totalCertificates: 0,
          totalCourses: 0,
          averageSatisfaction: 0,
          complianceScore: 0,
          performanceTrend: 0,
          total_certificates: 0,
          total_courses: 0,
          avg_satisfaction: 0,
          compliance_score: 0,
          performance_trend: 0
        };
      }

      return {
        team_id: teamId,
        location_name: performanceData.teams?.locations?.name || 'Unknown',
        totalCertificates: performanceData.certificates_issued || 0,
        totalCourses: performanceData.courses_conducted || 0,
        averageSatisfaction: performanceData.student_satisfaction_score || 0,
        complianceScore: performanceData.compliance_score || 0,
        performanceTrend: performanceData.compliance_score || 0, // Use compliance_score as fallback
        total_certificates: performanceData.certificates_issued || 0,
        total_courses: performanceData.courses_conducted || 0,
        avg_satisfaction: performanceData.student_satisfaction_score || 0,
        compliance_score: performanceData.compliance_score || 0,
        performance_trend: performanceData.compliance_score || 0 // Use compliance_score as fallback
      };
    } catch (error) {
      console.error('Error fetching team performance metrics:', error);
      return null;
    }
  }

  async getSystemWideAnalytics(): Promise<TeamAnalytics> {
    try {
      const { data: teams, error } = await supabase
        .from('teams')
        .select(`
          id,
          performance_score,
          team_type,
          locations:location_id(name),
          team_members(id)
        `);

      if (error) throw error;

      const totalTeams = teams?.length || 0;
      const totalMembers = teams?.reduce((sum, team) => sum + (team.team_members?.length || 0), 0) || 0;
      const averagePerformance = totalTeams > 0 
        ? teams.reduce((sum, team) => sum + (team.performance_score || 0), 0) / totalTeams 
        : 0;

      const teamsByLocation = teams?.reduce((acc: Record<string, number>, team) => {
        const locationName = team.locations?.name || 'Unassigned';
        acc[locationName] = (acc[locationName] || 0) + 1;
        return acc;
      }, {}) || {};

      const performanceByTeamType = teams?.reduce((acc: Record<string, number>, team) => {
        acc[team.team_type] = (acc[team.team_type] || 0) + (team.performance_score || 0);
        return acc;
      }, {}) || {};

      return {
        totalTeams,
        totalMembers,
        averagePerformance,
        averageCompliance: 85, // Default value
        teamsByLocation,
        performanceByTeamType
      };
    } catch (error) {
      console.error('Error fetching system analytics:', error);
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

  async getTeamLocationAssignments(teamId: string): Promise<TeamLocationAssignment[]> {
    try {
      const { data, error } = await supabase
        .from('team_location_assignments')
        .select(`
          *,
          locations:location_id(name)
        `)
        .eq('team_id', teamId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(assignment => ({
        ...assignment,
        location_name: assignment.locations?.name
      })) as TeamLocationAssignment[];
    } catch (error) {
      console.error('Error fetching team location assignments:', error);
      return [];
    }
  }

  async assignTeamToLocation(teamId: string, locationId: string, assignmentType: 'primary' | 'secondary' | 'temporary'): Promise<TeamLocationAssignment> {
    try {
      const { data, error } = await supabase
        .from('team_location_assignments')
        .insert({
          team_id: teamId,
          location_id: locationId,
          assignment_type: assignmentType,
          start_date: new Date().toISOString()
        })
        .select(`
          *,
          locations:location_id(name)
        `)
        .single();

      if (error) throw error;

      return {
        ...data,
        location_name: data.locations?.name
      } as TeamLocationAssignment;
    } catch (error) {
      console.error('Error assigning team to location:', error);
      throw error;
    }
  }
}

export const teamManagementService = new TeamManagementService();

// Re-export types for compatibility
export type { 
  Team, 
  EnhancedTeam, 
  TeamMember, 
  TeamMemberWithProfile,
  TeamPerformanceMetrics,
  TeamAnalytics,
  CreateTeamRequest,
  TeamLocationAssignment
} from '@/types/team-management';
