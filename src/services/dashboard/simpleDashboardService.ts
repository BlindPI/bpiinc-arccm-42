import { supabase } from '@/integrations/supabase/client';

export interface UserDashboardData {
  user_id: string;
  user_role: 'AP' | 'IC' | 'IP' | 'IT';
  display_name: string;
  teams: Array<{
    team_id: string;
    team_name: string;
    team_role: string;
    location_id: string;
    location_name: string;
  }>;
}

export interface DashboardConfig {
  showLocations: boolean;
  showTeams: boolean;
  showAllUsers: boolean;
  showReports: boolean;
}

export class SimpleDashboardService {
  /**
   * Get user's dashboard data - one simple query
   */
  static async getUserDashboardData(userId: string): Promise<UserDashboardData> {
    // Step 1: Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, display_name')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      throw new Error(`Failed to get user profile: ${profileError?.message}`);
    }

    // Step 2: Get user's team memberships (simple query)
    const { data: teamMemberships, error: teamError } = await supabase
      .from('team_members')
      .select('team_id, role')
      .eq('user_id', userId)
      .eq('status', 'active');

    if (teamError) {
      throw new Error(`Failed to get team memberships: ${teamError.message}`);
    }

    if (!teamMemberships || teamMemberships.length === 0) {
      return {
        user_id: profile.id,
        user_role: profile.role,
        display_name: profile.display_name,
        teams: []
      };
    }

    // Step 3: Get team details for each team
    const teamIds = teamMemberships.map(tm => tm.team_id);
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('id, name, location_id')
      .in('id', teamIds)
      .eq('status', 'active');

    if (teamsError) {
      throw new Error(`Failed to get teams: ${teamsError.message}`);
    }

    // Step 4: Get location details for each team
    const locationIds = (teams || []).map(t => t.location_id).filter(Boolean);
    const { data: locations, error: locationsError } = await supabase
      .from('locations')
      .select('id, name')
      .in('id', locationIds)
      .eq('status', 'ACTIVE');

    if (locationsError) {
      throw new Error(`Failed to get locations: ${locationsError.message}`);
    }

    // Step 5: Join the data in JavaScript
    const teamsWithDetails = teamMemberships
      .map(membership => {
        const team = teams?.find(t => t.id === membership.team_id);
        const location = locations?.find(l => l.id === team?.location_id);
        
        if (!team || !location) return null;
        
        return {
          team_id: team.id,
          team_name: team.name,
          team_role: membership.role,
          location_id: team.location_id,
          location_name: location.name
        };
      })
      .filter(Boolean) as UserDashboardData['teams'];

    return {
      user_id: profile.id,
      user_role: profile.role,
      display_name: profile.display_name,
      teams: teamsWithDetails
    };
  }

  /**
   * Simple role-based dashboard content
   */
  static getDashboardConfig(userRole: string): DashboardConfig {
    switch (userRole) {
      case 'AP': // Authorized Provider
        return {
          showLocations: true,
          showTeams: true,
          showAllUsers: false,
          showReports: true
        };
      case 'IC': // Certified Instructor
        return {
          showLocations: false,
          showTeams: true,
          showAllUsers: false,
          showReports: false
        };
      case 'IP': // Provisional Instructor
        return {
          showLocations: false,
          showTeams: true,
          showAllUsers: false,
          showReports: false
        };
      case 'IT': // Instructor In Training
        return {
          showLocations: true,
          showTeams: true,
          showAllUsers: true,
          showReports: true
        };
      default:
        return {
          showLocations: false,
          showTeams: false,
          showAllUsers: false,
          showReports: false
        };
    }
  }

  /**
   * Get role display name for UI
   */
  static getRoleDisplayName(role: string): string {
    switch (role) {
      case 'AP':
        return 'Authorized Provider';
      case 'IC':
        return 'Certified Instructor';
      case 'IP':
        return 'Provisional Instructor';
      case 'IT':
        return 'Instructor In Training';
      case 'SA':
        return 'System Administrator';
      default:
        return 'Unknown Role';
    }
  }

  /**
   * Get unique locations from user's teams
   */
  static getUniqueLocations(teams: UserDashboardData['teams']) {
    const locationMap = new Map();
    teams.forEach(team => {
      if (!locationMap.has(team.location_id)) {
        locationMap.set(team.location_id, {
          id: team.location_id,
          name: team.location_name,
          teams: []
        });
      }
      locationMap.get(team.location_id).teams.push({
        id: team.team_id,
        name: team.team_name,
        role: team.team_role
      });
    });
    return Array.from(locationMap.values());
  }
}