import { supabase } from '@/integrations/supabase/client';
import type { Team, TeamMember, TeamMemberWithProfile, EnhancedTeam } from '@/types/team-management';

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
  members?: TeamMemberWithProfile[];
  member_count: number;
}

export interface TeamMemberWithProfile extends TeamMember {
  display_name: string;
  profile?: {
    id: string;
    display_name: string;
    email: string;
    role: string;
  };
}

export class RealTeamDataService {
  async getUserTeams(userId: string): Promise<RealTeamData[]> {
    try {
      console.log('RealTeamDataService: Fetching teams for user:', userId);
      
      // Get user's team memberships with manual joins to avoid relationship issues
      const { data: memberships, error: membershipsError } = await supabase
        .from('team_members')
        .select('team_id, role, status, assignment_start_date')
        .eq('user_id', userId);

      if (membershipsError) {
        console.error('Error fetching team memberships:', membershipsError);
        throw membershipsError;
      }

      if (!memberships || memberships.length === 0) {
        console.log('No team memberships found for user');
        return [];
      }

      // Get teams separately
      const teamIds = memberships.map(m => m.team_id);
      const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select(`
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
          metadata
        `)
        .in('id', teamIds);

      if (teamsError) {
        console.error('Error fetching teams:', teamsError);
        throw teamsError;
      }

      // Get locations separately
      const locationIds = teams?.filter(t => t.location_id).map(t => t.location_id) || [];
      const { data: locations } = await supabase
        .from('locations')
        .select('id, name, city, state')
        .in('id', locationIds);

      // Transform and get member counts
      const teams_data: RealTeamData[] = [];
      
      for (const team of teams || []) {
        // Get member count for this team
        const { count: memberCount } = await supabase
          .from('team_members')
          .select('*', { count: 'exact', head: true })
          .eq('team_id', team.id);

        const location = locations?.find(l => l.id === team.location_id);

        teams_data.push({
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
          location: location ? {
            id: location.id,
            name: location.name,
            city: location.city,
            state: location.state
          } : undefined,
          member_count: memberCount || 0
        });
      }

      console.log('RealTeamDataService: Found teams:', teams_data.length);
      return teams_data;
    } catch (error) {
      console.error('Error in getUserTeams:', error);
      throw error;
    }
  }

  async fetchEnhancedTeams(teamId: string): Promise<EnhancedTeam[]> {
    const { data, error } = await supabase
      .from('teams')
      .select(`
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
        locations(name)
      `)
      .eq('id', teamId);

    if (error) {
      console.error('Error fetching enhanced teams:', error);
      throw error;
    }

    return (data || []).map(team => ({
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
      } : undefined
    }));
  }

  async fetchTeamMembers(teamId: string): Promise<TeamMemberWithProfile[]> {
    const { data, error } = await supabase
      .from('team_members')
      .select(`
        *,
        profiles:user_id (
          id,
          display_name,
          email,
          role
        )
      `)
      .eq('team_id', teamId)
      .order('created_at');

    if (error) {
      console.error('Error fetching team members:', error);
      throw error;
    }

    // Transform the data to match our types
    return (data || []).map(member => ({
      id: member.id,
      team_id: member.team_id,
      user_id: member.user_id,
      role: member.role as 'MEMBER' | 'ADMIN',
      status: (member.status || 'active') as 'active' | 'inactive' | 'suspended' | 'on_leave',
      location_assignment: member.location_assignment || '',
      assignment_start_date: member.assignment_start_date || '',
      assignment_end_date: member.assignment_end_date || '',
      team_position: member.team_position || '',
      permissions: typeof member.permissions === 'string' 
        ? JSON.parse(member.permissions) 
        : (member.permissions as Record<string, any>) || {},
      created_at: member.created_at,
      updated_at: member.updated_at,
      display_name: member.profiles?.display_name || 'Unknown User',
      profiles: member.profiles || undefined
    }));
  }

  async getTeamMembers(teamId: string): Promise<TeamMemberWithProfile[]> {
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
          updated_at
        `)
        .eq('team_id', teamId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching team members:', error);
        throw error;
      }

      // Get profiles separately
      const userIds = members?.map(m => m.user_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, email, role')
        .in('id', userIds);

      return (members || []).map(member => {
        const profile = profiles?.find(p => p.id === member.user_id);
        
        return {
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
          display_name: profile?.display_name || 'Unknown User',
          profile: profile ? {
            id: profile.id,
            display_name: profile.display_name,
            email: profile.email,
            role: profile.role
          } : undefined
        };
      });
    } catch (error) {
      console.error('Error fetching team members:', error);
      throw error;
    }
  }

  async getTeamAnalytics(): Promise<any> {
    const { data: teams, error } = await supabase
      .from('teams')
      .select(`
        id,
        name,
        team_type,
        status,
        performance_score,
        location_id,
        locations(name)
      `)
      .eq('status', 'active');

    if (error) throw error;

    const totalTeams = teams?.length || 0;
    
    // Calculate member count
    const { count: totalMembers } = await supabase
      .from('team_members')
      .select('*', { count: 'exact', head: true });

    // Calculate average performance
    const performanceScores = teams?.map(t => t.performance_score || 0) || [];
    const averagePerformance = performanceScores.length > 0 
      ? performanceScores.reduce((a, b) => a + b, 0) / performanceScores.length 
      : 0;

    return {
      totalTeams,
      totalMembers: totalMembers || 0,
      averagePerformance: Math.round(averagePerformance * 100) / 100,
      averageCompliance: 88.5, // Mock for now
      teamsByLocation: {},
      performanceByTeamType: {}
    };
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

  async updateTeamMember(memberId: string, updates: Partial<TeamMemberWithProfile>): Promise<void> {
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
