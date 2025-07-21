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
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        role,
        display_name,
        team_members!inner(
          team_id,
          role,
          teams!inner(
            id,
            name,
            location_id,
            locations!inner(
              id,
              name
            )
          )
        )
      `)
      .eq('id', userId)
      .eq('team_members.status', 'active')
      .eq('team_members.teams.status', 'active')
      .eq('team_members.teams.locations.status', 'ACTIVE')
      .single();

    if (error || !data) {
      throw new Error(`Failed to get user dashboard data: ${error?.message}`);
    }

    return {
      user_id: data.id,
      user_role: data.role,
      display_name: data.display_name,
      teams: data.team_members?.map((tm: any) => ({
        team_id: tm.teams.id,
        team_name: tm.teams.name,
        team_role: tm.role,
        location_id: tm.teams.location_id,
        location_name: tm.teams.locations.name
      })) || []
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