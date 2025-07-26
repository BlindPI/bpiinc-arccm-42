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
    certificate_count: number;
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
   * SIMPLE FIX: Get team members using working SQL patterns 
   * Direct profile queries work fine - use those exactly
   */
  static async getTeamMembers(teamId: string) {
    try {
      console.log('🔧 RLS_BYPASS: Starting getTeamMembers for teamId:', teamId);
      
      // **EMERGENCY FIX: Use RLS-bypassing function that we know works!**
      const { data: teamMembersWithProfiles, error: rpcError } = await supabase
        .rpc('get_team_member_profiles_bypass_rls', { p_team_id: teamId });

      if (rpcError) {
        console.error('🔧 RLS_BYPASS: RPC function error:', rpcError);
        throw new Error(`Failed to get team members: ${rpcError.message}`);
      }

      if (!teamMembersWithProfiles || teamMembersWithProfiles.length === 0) {
        console.log('🔧 RLS_BYPASS: No team members found for team:', teamId);
        return [];
      }

      console.log('🔧 RLS_BYPASS: Found', teamMembersWithProfiles.length, 'team members with profiles');
      console.log('🔧 RLS_BYPASS: Names found:', teamMembersWithProfiles.map(m => m.display_name));

      // Get roster counts for each member
      const result = await Promise.all(
        teamMembersWithProfiles.map(async (member) => {
          console.log('🔧 RLS_BYPASS: Processing member:', member.display_name);

          // Get roster count for this user with location filtering
          const currentUser = await supabase.auth.getUser();
          let rosterCount = 0;
          
          if (currentUser.data.user) {
            // Check if current user is AP and needs location filtering
            const { data: userProfile } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', currentUser.data.user.id)
              .single();

            let rosterQuery = supabase
              .from('rosters')
              .select('id', { count: 'exact' })
              .eq('created_by', member.user_id);

            // Apply location filter for AP users
            if (userProfile?.role === 'AP') {
              const { data: apProvider } = await supabase
                .from('authorized_providers')
                .select('primary_location_id')
                .eq('user_id', currentUser.data.user.id)
                .single();

              if (apProvider?.primary_location_id) {
                rosterQuery = rosterQuery.eq('location_id', apProvider.primary_location_id);
                console.log('🔧 RLS_BYPASS: Applied location filter for AP user');
              }
            }

            const { count } = await rosterQuery;
            rosterCount = count || 0;
          }

          return {
            user_id: member.user_id,
            display_name: member.display_name,
            email: member.email,
            phone: member.phone,
            job_title: member.job_title,
            team_role: member.team_role,
            team_position: member.team_position,
            roster_submissions: rosterCount,
            recent_rosters: [] // TODO: Keep empty for now - can be added later if needed
          };
        })
      );

      console.log('🔧 RLS_BYPASS: Final result:', result.map(r => `${r.display_name} (${r.roster_submissions} rosters)`));
      return result;
    } catch (error) {
      console.error('🔧 RLS_BYPASS: Fatal error getting team members:', error);
      return [];
    }
  }

  /**
   * Get user's dashboard data - keep existing working logic
   */
  static async getUserDashboardData(userId: string): Promise<UserDashboardData> {
    console.log('🔧 SIMPLE_FIX: Getting dashboard data for user:', userId);
    
    try {
      // Get user profile - use simple direct query that works
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, role, display_name')
        .eq('id', userId)
        .single();

      if (profileError || !profile) {
        console.error('🔧 SIMPLE_FIX: Profile fetch FAILED:', profileError);
        throw new Error(`Failed to get user profile: ${profileError?.message}`);
      }

      console.log('🔧 SIMPLE_FIX: Profile SUCCESS:', profile);
      let teamMemberships: any[] = [];

      // Get user's teams based on role
      if (profile.role === 'AP') {
        // AP users: Get teams via provider assignments
        const { data: userProvider } = await supabase
          .from('authorized_providers')
          .select('id, name, status')
          .eq('user_id', userId)
          .maybeSingle();

        const actualProviderId = userProvider?.id || userId;
        
        const { data: assignedTeams } = await supabase
          .from('provider_team_assignments')
          .select(`
            team_id,
            teams (
              id,
              name,
              location_id,
              status
            )
          `)
          .eq('provider_id', actualProviderId)
          .eq('status', 'active');

        teamMemberships = (assignedTeams || [])
          .filter(assignment => assignment.teams?.status === 'active')
          .map(assignment => ({
            team_id: assignment.team_id,
            role: 'provider',
            relationship_type: 'manager'
          }));
      } else {
        // Other roles: Get teams they are members of
        const { data: regularMemberships } = await supabase
          .from('team_members')
          .select('team_id, role')
          .eq('user_id', userId)
          .eq('status', 'active');

        teamMemberships = (regularMemberships || []).map(membership => ({
          team_id: membership.team_id,
          role: membership.role,
          relationship_type: 'member'
        }));
      }

      if (!teamMemberships || teamMemberships.length === 0) {
        return {
          user_id: profile.id,
          user_role: profile.role,
          display_name: profile.display_name,
          teams: []
        };
      }

      // Get team and location details
      const teamIds = teamMemberships.map(tm => tm.team_id);
      
      const { data: teams } = await supabase
        .from('teams')
        .select('id, name, location_id, status')
        .in('id', teamIds);

      const activeTeams = (teams || []).filter(t => t.status === 'active');
      const locationIds = activeTeams.map(t => t.location_id).filter(Boolean);
      
      const { data: locations } = await supabase
        .from('locations')
        .select('id, name, status')
        .in('id', locationIds);

      const activeLocations = (locations || []).filter(l => l.status === 'ACTIVE');

      // Get certificate counts
      const { data: certificates } = await supabase
        .from('certificates')
        .select('id, location_id')
        .in('location_id', locationIds);

      const certificateCountsByLocation = (certificates || []).reduce((acc, cert) => {
        acc[cert.location_id] = (acc[cert.location_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Join the data
      const teamsWithDetails = teamMemberships
        .map(membership => {
          const team = teams?.find(t => t.id === membership.team_id);
          if (!team) return null;
          
          const location = locations?.find(l => l.id === team.location_id);
          if (!location) return null;
          
          return {
            team_id: team.id,
            team_name: team.name,
            team_role: membership.role,
            location_id: team.location_id,
            location_name: location.name,
            certificate_count: certificateCountsByLocation[team.location_id] || 0
          };
        })
        .filter(Boolean) as UserDashboardData['teams'];

      return {
        user_id: profile.id,
        user_role: profile.role,
        display_name: profile.display_name,
        teams: teamsWithDetails
      };
    } catch (error) {
      console.error('🔧 SIMPLE_FIX: Fatal error:', error);
      throw error;
    }
  }

  /**
   * Simple role-based dashboard content
   */
  static getDashboardConfig(userRole: string): DashboardConfig {
    switch (userRole) {
      case 'AP':
        return {
          showLocations: true,
          showTeams: true,
          showAllUsers: false,
          showReports: true
        };
      case 'IC':
        return {
          showLocations: false,
          showTeams: true,
          showAllUsers: false,
          showReports: false
        };
      case 'IP':
        return {
          showLocations: false,
          showTeams: true,
          showAllUsers: false,
          showReports: false
        };
      case 'IT':
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

  /**
   * Get certificate requests for a specific location
   */
  static async getLocationCertificates(locationId: string) {
    try {
      const { data: certificates, error } = await supabase
        .from('certificates')
        .select('id, recipient_name, course_name, status, created_at')
        .eq('location_id', locationId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to get certificates: ${error.message}`);
      }

      return certificates || [];
    } catch (error) {
      console.error('Error getting location certificates:', error);
      return [];
    }
  }
}
