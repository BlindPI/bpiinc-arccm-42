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

// Helper function to safely parse JSONB objects
function parseJsonObject(value: any): Record<string, any> {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
}

// Helper function to safely cast status
function parseTeamStatus(status: any): 'active' | 'inactive' | 'suspended' {
  if (typeof status === 'string' && ['active', 'inactive', 'suspended'].includes(status)) {
    return status as 'active' | 'inactive' | 'suspended';
  }
  return 'active';
}

// Helper function to safely cast assignment type
function parseAssignmentType(type: any): 'primary' | 'secondary' | 'temporary' {
  if (typeof type === 'string' && ['primary', 'secondary', 'temporary'].includes(type)) {
    return type as 'primary' | 'secondary' | 'temporary';
  }
  return 'primary';
}

export class TeamManagementService {
  async getEnhancedTeams(): Promise<EnhancedTeam[]> {
    try {
      // First, get teams with basic info
      const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select('*')
        .order('name');

      if (teamsError) throw teamsError;

      if (!teams || teams.length === 0) {
        return [];
      }

      // Get locations separately
      const locationIds = teams
        .map(team => team.location_id)
        .filter(id => id !== null && id !== undefined);

      let locations: any[] = [];
      if (locationIds.length > 0) {
        const { data: locationData, error: locationError } = await supabase
          .from('locations')
          .select('id, name, address, city, state')
          .in('id', locationIds);

        if (locationError) {
          console.warn('Error fetching locations:', locationError);
        } else {
          locations = locationData || [];
        }
      }

      // Get team members with profiles separately
      const teamIds = teams.map(team => team.id);
      let teamMembers: any[] = [];
      
      if (teamIds.length > 0) {
        const { data: memberData, error: memberError } = await supabase
          .from('team_members')
          .select(`
            id,
            team_id,
            user_id,
            role,
            location_assignment,
            assignment_start_date,
            assignment_end_date,
            team_position,
            permissions
          `)
          .in('team_id', teamIds);

        if (memberError) {
          console.warn('Error fetching team members:', memberError);
        } else {
          teamMembers = memberData || [];
        }

        // Get profiles for team members
        const userIds = teamMembers.map(member => member.user_id).filter(Boolean);
        let profiles: any[] = [];
        
        if (userIds.length > 0) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('id, display_name, role, email')
            .in('id', userIds);

          if (profileError) {
            console.warn('Error fetching profiles:', profileError);
          } else {
            profiles = profileData || [];
          }
        }

        // Attach profiles to team members
        teamMembers = teamMembers.map(member => ({
          ...member,
          profile: profiles.find(p => p.id === member.user_id) || null
        }));
      }

      // Combine all data
      return teams.map(team => {
        const location = locations.find(l => l.id === team.location_id);
        const members = teamMembers.filter(m => m.team_id === team.id);

        return {
          id: team.id,
          name: team.name || '',
          description: team.description,
          location_id: team.location_id,
          provider_id: team.provider_id?.toString(),
          team_type: team.team_type || 'operational',
          status: parseTeamStatus(team.status),
          performance_score: team.performance_score || 0,
          monthly_targets: parseJsonObject(team.monthly_targets),
          current_metrics: parseJsonObject(team.current_metrics),
          created_at: team.created_at || '',
          updated_at: team.updated_at || '',
          location: location ? {
            id: location.id,
            name: location.name,
            address: location.address,
            city: location.city,
            state: location.state
          } : undefined,
          provider: undefined,
          members: members.map((member: any) => ({
            id: member.id,
            team_id: member.team_id,
            user_id: member.user_id,
            role: member.role,
            location_assignment: member.location_assignment,
            assignment_start_date: member.assignment_start_date,
            assignment_end_date: member.assignment_end_date,
            team_position: member.team_position,
            permissions: parseJsonObject(member.permissions),
            profile: member.profile ? {
              id: member.profile.id,
              display_name: member.profile.display_name,
              role: member.profile.role,
              email: member.profile.email
            } : undefined
          }))
        };
      });
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
          location_id: teamData.location_id || null,
          provider_id: teamData.provider_id ? parseInt(teamData.provider_id) : null,
          team_type: teamData.team_type || 'operational',
          status: 'active',
          performance_score: 0.00,
          monthly_targets: {},
          current_metrics: {}
        })
        .select()
        .single();

      if (error) throw error;
      
      // Get location separately if location_id exists
      let location = undefined;
      if (data.location_id) {
        const { data: locationData } = await supabase
          .from('locations')
          .select('id, name, address, city, state')
          .eq('id', data.location_id)
          .single();
        
        if (locationData) {
          location = locationData;
        }
      }
      
      return {
        id: data.id,
        name: data.name || '',
        description: data.description,
        location_id: data.location_id,
        provider_id: data.provider_id?.toString(),
        team_type: data.team_type || 'operational',
        status: parseTeamStatus(data.status),
        performance_score: data.performance_score || 0,
        monthly_targets: parseJsonObject(data.monthly_targets),
        current_metrics: parseJsonObject(data.current_metrics),
        created_at: data.created_at || '',
        updated_at: data.updated_at || '',
        location: location ? {
          id: location.id,
          name: location.name,
          address: location.address,
          city: location.city,
          state: location.state
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
        .select('*')
        .eq('team_id', teamId)
        .order('start_date', { ascending: false });

      if (error) throw error;
      
      // Get location names separately
      const locationIds = (data || []).map(assignment => assignment.location_id);
      let locations: any[] = [];
      
      if (locationIds.length > 0) {
        const { data: locationData } = await supabase
          .from('locations')
          .select('id, name')
          .in('id', locationIds);
        
        locations = locationData || [];
      }
      
      return (data || []).map(assignment => ({
        id: assignment.id,
        team_id: assignment.team_id,
        location_id: assignment.location_id,
        assignment_type: parseAssignmentType(assignment.assignment_type),
        start_date: assignment.start_date,
        end_date: assignment.end_date,
        location_name: locations.find(l => l.id === assignment.location_id)?.name || 'Unknown Location'
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
      const { data: teams, error } = await supabase
        .from('teams')
        .select('*')
        .eq('location_id', locationId)
        .order('name');

      if (error) throw error;
      
      if (!teams || teams.length === 0) {
        return [];
      }

      // Use the same logic as getEnhancedTeams but filtered
      const teamIds = teams.map(team => team.id);
      let teamMembers: any[] = [];
      
      if (teamIds.length > 0) {
        const { data: memberData } = await supabase
          .from('team_members')
          .select(`
            id,
            team_id,
            user_id,
            role,
            location_assignment,
            assignment_start_date,
            assignment_end_date,
            team_position,
            permissions
          `)
          .in('team_id', teamIds);

        teamMembers = memberData || [];

        const userIds = teamMembers.map(member => member.user_id).filter(Boolean);
        let profiles: any[] = [];
        
        if (userIds.length > 0) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('id, display_name, role, email')
            .in('id', userIds);

          profiles = profileData || [];
        }

        teamMembers = teamMembers.map(member => ({
          ...member,
          profile: profiles.find(p => p.id === member.user_id) || null
        }));
      }

      // Get the location info
      const { data: locationData } = await supabase
        .from('locations')
        .select('id, name, address, city, state')
        .eq('id', locationId)
        .single();

      return teams.map(team => {
        const members = teamMembers.filter(m => m.team_id === team.id);

        return {
          id: team.id,
          name: team.name || '',
          description: team.description,
          location_id: team.location_id,
          provider_id: team.provider_id?.toString(),
          team_type: team.team_type || 'operational',
          status: parseTeamStatus(team.status),
          performance_score: team.performance_score || 0,
          monthly_targets: parseJsonObject(team.monthly_targets),
          current_metrics: parseJsonObject(team.current_metrics),
          created_at: team.created_at || '',
          updated_at: team.updated_at || '',
          location: locationData ? {
            id: locationData.id,
            name: locationData.name,
            address: locationData.address,
            city: locationData.city,
            state: locationData.state
          } : undefined,
          provider: undefined,
          members: members.map((member: any) => ({
            id: member.id,
            team_id: member.team_id,
            user_id: member.user_id,
            role: member.role,
            location_assignment: member.location_assignment,
            assignment_start_date: member.assignment_start_date,
            assignment_end_date: member.assignment_end_date,
            team_position: member.team_position,
            permissions: parseJsonObject(member.permissions),
            profile: member.profile ? {
              id: member.profile.id,
              display_name: member.profile.display_name,
              role: member.profile.role,
              email: member.profile.email
            } : undefined
          }))
        };
      });
    } catch (error) {
      console.error('Error fetching teams by location:', error);
      throw error;
    }
  }
}

export const teamManagementService = new TeamManagementService();
