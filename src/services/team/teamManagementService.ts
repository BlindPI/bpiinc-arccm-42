
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
          location:locations(id, name, address, city, state),
          provider:authorized_providers(id, name, provider_type),
          team_members(
            *,
            profile:profiles(id, display_name, role, email)
          )
        `)
        .order('name');

      if (error) throw error;
      return data as EnhancedTeam[];
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
          ...teamData,
          team_type: teamData.team_type || 'operational',
          status: 'active',
          performance_score: 0.00,
          monthly_targets: {},
          current_metrics: {}
        })
        .select(`
          *,
          location:locations(id, name, address, city, state),
          provider:authorized_providers(id, name, provider_type)
        `)
        .single();

      if (error) throw error;
      return data as EnhancedTeam;
    } catch (error) {
      console.error('Error creating team:', error);
      throw error;
    }
  }

  async assignTeamToLocation(teamId: string, locationId: string, assignmentType: 'primary' | 'secondary' | 'temporary' = 'primary'): Promise<void> {
    try {
      // First update the team's primary location if it's a primary assignment
      if (assignmentType === 'primary') {
        const { error: teamError } = await supabase
          .from('teams')
          .update({ location_id: locationId })
          .eq('id', teamId);

        if (teamError) throw teamError;
      }

      // Create location assignment record
      const { error } = await supabase
        .from('team_location_assignments')
        .insert({
          team_id: teamId,
          location_id: locationId,
          assignment_type: assignmentType,
          created_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;
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
        .is('end_date', null)
        .order('assignment_type');

      if (error) throw error;
      
      return data.map(item => ({
        ...item,
        location_name: item.location?.name || 'Unknown Location'
      })) as TeamLocationAssignment[];
    } catch (error) {
      console.error('Error fetching team location assignments:', error);
      throw error;
    }
  }

  async recordTeamPerformance(metric: Omit<TeamPerformanceMetric, 'id' | 'recorded_by'>): Promise<void> {
    try {
      const { error } = await supabase
        .from('team_performance')
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

      if (error) throw error;
      return data?.[0] || null;
    } catch (error) {
      console.error('Error fetching team performance summary:', error);
      throw error;
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
          location:locations(id, name, address, city, state),
          provider:authorized_providers(id, name, provider_type),
          team_members(
            *,
            profile:profiles(id, display_name, role, email)
          )
        `)
        .eq('location_id', locationId)
        .order('name');

      if (error) throw error;
      return data as EnhancedTeam[];
    } catch (error) {
      console.error('Error fetching teams by location:', error);
      throw error;
    }
  }
}

export const teamManagementService = new TeamManagementService();
