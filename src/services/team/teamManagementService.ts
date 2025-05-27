
import { supabase } from '@/integrations/supabase/client';

export interface EnhancedTeam {
  id: string;
  name: string;
  description?: string;
  location_id?: string;
  provider_id?: string;
  team_type: string;
  status: 'active' | 'inactive' | 'suspended';
  performance_score: number;
  monthly_targets: Record<string, any>;
  current_metrics: Record<string, any>;
  created_at: string;
  updated_at: string;
  location?: {
    id: string;
    name: string;
    address?: string;
    city?: string;
    state?: string;
  };
  provider?: {
    id: string;
    name: string;
    provider_type: string;
  };
  members?: TeamMemberWithProfile[];
}

export interface TeamMemberWithProfile {
  id: string;
  team_id: string;
  user_id: string;
  role: 'ADMIN' | 'MEMBER';
  location_assignment?: string;
  assignment_start_date?: string;
  assignment_end_date?: string;
  team_position?: string;
  permissions: Record<string, any>;
  profile?: {
    id: string;
    display_name: string;
    role: string;
    email?: string;
  };
}

export interface TeamPerformanceMetric {
  id: string;
  team_id: string;
  location_id?: string;
  metric_type: string;
  metric_value: number;
  metric_period: string;
  recorded_date: string;
  recorded_by: string;
  metadata: Record<string, any>;
}

export interface TeamLocationAssignment {
  id: string;
  team_id: string;
  location_id: string;
  assignment_type: 'primary' | 'secondary' | 'temporary';
  start_date: string;
  end_date?: string;
  location_name: string;
}

export class TeamManagementService {
  async getEnhancedTeams(): Promise<EnhancedTeam[]> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select(`
          *,
          location:locations!location_id(id, name, address, city, state),
          team_members(
            *,
            profile:profiles(id, display_name, role, email)
          )
        `)
        .order('name');

      if (error) throw error;
      
      return (data || []).map(team => ({
        id: team.id,
        name: team.name || '',
        description: team.description,
        location_id: team.location_id,
        provider_id: team.provider_id?.toString(),
        team_type: team.team_type || 'operational',
        status: team.status || 'active',
        performance_score: team.performance_score || 0,
        monthly_targets: team.monthly_targets || {},
        current_metrics: team.current_metrics || {},
        created_at: team.created_at || '',
        updated_at: team.updated_at || '',
        location: team.location ? {
          id: team.location.id,
          name: team.location.name,
          address: team.location.address,
          city: team.location.city,
          state: team.location.state
        } : undefined,
        provider: undefined,
        members: (team.team_members || []).map((member: any) => ({
          id: member.id,
          team_id: member.team_id,
          user_id: member.user_id,
          role: member.role,
          location_assignment: member.location_assignment,
          assignment_start_date: member.assignment_start_date,
          assignment_end_date: member.assignment_end_date,
          team_position: member.team_position,
          permissions: member.permissions || {},
          profile: member.profile ? {
            id: member.profile.id,
            display_name: member.profile.display_name,
            role: member.profile.role,
            email: member.profile.email
          } : undefined
        }))
      }));
    } catch (error) {
      console.error('Error fetching enhanced teams:', error);
      throw error;
    }
  }

  async createTeamWithLocation(teamData: {
    name: string;
    description?: string;
    location_id?: string;
    provider_id?: string;
    team_type?: string;
  }): Promise<EnhancedTeam> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .insert({
          name: teamData.name,
          description: teamData.description,
          location_id: teamData.location_id,
          provider_id: teamData.provider_id ? parseInt(teamData.provider_id) : null,
          team_type: teamData.team_type || 'operational',
          status: 'active',
          performance_score: 0.00,
          monthly_targets: {},
          current_metrics: {}
        })
        .select(`
          *,
          location:locations!location_id(id, name, address, city, state)
        `)
        .single();

      if (error) throw error;
      
      return {
        id: data.id,
        name: data.name || '',
        description: data.description,
        location_id: data.location_id,
        provider_id: data.provider_id?.toString(),
        team_type: data.team_type || 'operational',
        status: data.status || 'active',
        performance_score: data.performance_score || 0,
        monthly_targets: data.monthly_targets || {},
        current_metrics: data.current_metrics || {},
        created_at: data.created_at || '',
        updated_at: data.updated_at || '',
        location: data.location ? {
          id: data.location.id,
          name: data.location.name,
          address: data.location.address,
          city: data.location.city,
          state: data.location.state
        } : undefined,
        provider: undefined,
        members: []
      };
    } catch (error) {
      console.error('Error creating team:', error);
      throw error;
    }
  }

  async assignTeamToLocation(teamId: string, locationId: string, assignmentType: 'primary' | 'secondary' | 'temporary' = 'primary'): Promise<void> {
    try {
      if (assignmentType === 'primary') {
        const { error: teamError } = await supabase
          .from('teams')
          .update({ location_id: locationId })
          .eq('id', teamId);

        if (teamError) throw teamError;
      }

      const { error: assignmentError } = await supabase
        .from('team_location_assignments')
        .insert({
          team_id: teamId,
          location_id: locationId,
          assignment_type: assignmentType,
          start_date: new Date().toISOString()
        });

      if (assignmentError) throw assignmentError;
    } catch (error) {
      console.error('Error assigning team to location:', error);
      throw error;
    }
  }

  async getTeamLocationAssignments(teamId: string): Promise<TeamLocationAssignment[]> {
    try {
      const { data, error } = await supabase
        .from('team_location_assignments')
        .select(`
          *,
          location:locations(name)
        `)
        .eq('team_id', teamId)
        .order('start_date', { ascending: false });

      if (error) throw error;
      
      return (data || []).map(assignment => ({
        id: assignment.id,
        team_id: assignment.team_id,
        location_id: assignment.location_id,
        assignment_type: assignment.assignment_type,
        start_date: assignment.start_date,
        end_date: assignment.end_date,
        location_name: assignment.location?.name || 'Unknown Location'
      }));
    } catch (error) {
      console.error('Error fetching team location assignments:', error);
      throw error;
    }
  }

  async recordTeamPerformance(metric: Omit<TeamPerformanceMetric, 'id' | 'recorded_by'>): Promise<void> {
    try {
      const { error } = await supabase
        .from('team_performance_metrics')
        .insert({
          ...metric,
          recorded_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error recording team performance:', error);
      throw error;
    }
  }

  async getTeamPerformanceSummary(teamId: string, period: string = 'monthly'): Promise<any> {
    try {
      const { data, error } = await supabase.rpc('get_team_performance_summary', {
        p_team_id: teamId,
        p_period: period
      });

      if (error) {
        console.warn('Performance summary function not available yet:', error);
        return null;
      }
      
      return data?.[0] || null;
    } catch (error) {
      console.error('Error fetching team performance summary:', error);
      return null;
    }
  }

  async updateTeamMemberLocation(memberId: string, locationId: string, position?: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('team_members')
        .update({
          location_assignment: locationId,
          team_position: position,
          assignment_start_date: new Date().toISOString()
        })
        .eq('id', memberId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating team member location:', error);
      throw error;
    }
  }

  async getTeamsByLocation(locationId: string): Promise<EnhancedTeam[]> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select(`
          *,
          location:locations!location_id(id, name, address, city, state),
          team_members(
            *,
            profile:profiles(id, display_name, role, email)
          )
        `)
        .eq('location_id', locationId)
        .order('name');

      if (error) throw error;
      
      return (data || []).map(team => ({
        id: team.id,
        name: team.name || '',
        description: team.description,
        location_id: team.location_id,
        provider_id: team.provider_id?.toString(),
        team_type: team.team_type || 'operational',
        status: team.status || 'active',
        performance_score: team.performance_score || 0,
        monthly_targets: team.monthly_targets || {},
        current_metrics: team.current_metrics || {},
        created_at: team.created_at || '',
        updated_at: team.updated_at || '',
        location: team.location ? {
          id: team.location.id,
          name: team.location.name,
          address: team.location.address,
          city: team.location.city,
          state: team.location.state
        } : undefined,
        provider: undefined,
        members: (team.team_members || []).map((member: any) => ({
          id: member.id,
          team_id: member.team_id,
          user_id: member.user_id,
          role: member.role,
          location_assignment: member.location_assignment,
          assignment_start_date: member.assignment_start_date,
          assignment_end_date: member.assignment_end_date,
          team_position: member.team_position,
          permissions: member.permissions || {},
          profile: member.profile ? {
            id: member.profile.id,
            display_name: member.profile.display_name,
            role: member.profile.role,
            email: member.profile.email
          } : undefined
        }))
      }));
    } catch (error) {
      console.error('Error fetching teams by location:', error);
      throw error;
    }
  }
}

export const teamManagementService = new TeamManagementService();
