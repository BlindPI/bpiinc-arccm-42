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
   * Get user's dashboard data - handles AP users with provider assignments
   */
  static async getUserDashboardData(userId: string): Promise<UserDashboardData> {
    console.log('🔧 =================== SimpleDashboardService START ===================');
    console.log('🔧 Input userId:', userId);
    
    try {
      // Step 1: Get user profile
      console.log('🔧 STEP 1: Getting user profile...');
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, role, display_name')
        .eq('id', userId)
        .single();

      if (profileError || !profile) {
        console.error('🔧 Profile fetch FAILED:', profileError);
        throw new Error(`Failed to get user profile: ${profileError?.message}`);
      }

      console.log('🔧 Profile SUCCESS:', profile);
      let teamMemberships: any[] = [];

      // Step 2: Get user's teams - AP users can have BOTH provider assignments AND team memberships
      if (profile.role === 'AP') {
        // For AP users: First get their provider_id from authorized_providers
        console.log('🔧 AP USER: Getting provider_id for user:', userId);
        
        const { data: userProvider, error: userProviderError } = await supabase
          .from('authorized_providers')
          .select('id, name, status')
          .eq('user_id', userId)
          .maybeSingle();

        console.log('🔧 Provider query result:', { userProvider, userProviderError });

        if (userProviderError || !userProvider) {
          console.error('🔧 Failed to get provider_id for AP user:', userProviderError);
          // Fallback to direct user_id lookup
          console.log('🔧 Fallback: Using user_id as provider_id');
        }

        const actualProviderId = userProvider?.id || userId;
        console.log('🔧 AP USER: Using provider_id:', actualProviderId);
      
      // AP USER: Get teams via provider_team_assignments (same approach as working AvailabilityCalendar)
      console.log('🔧 AP USER: Getting teams via provider_team_assignments for provider_id:', actualProviderId);
      
      // Get teams directly assigned to this provider via provider_team_assignments
      const { data: assignedTeams, error: assignmentError } = await supabase
        .from('provider_team_assignments')
        .select(`
          team_id,
          provider_id,
          status,
          teams (
            id,
            name,
            location_id,
            status
          )
        `)
        .eq('provider_id', actualProviderId)
        .eq('status', 'active');

      if (assignmentError) {
        console.error('🔧 Provider team assignments query FAILED:', assignmentError);
        throw new Error(`Failed to get provider team assignments: ${assignmentError.message}`);
      }

      console.log('🔧 Provider team assignments query SUCCESS:', assignedTeams);
      
      // Convert provider team assignments to managed teams
      const assignmentBasedTeams = (assignedTeams || [])
        .filter(assignment => assignment.teams?.status === 'active')
        .map(assignment => ({
          team_id: assignment.team_id,
          role: 'provider',
          relationship_type: 'manager'
        }));

      console.log('🔧 Assignment-based teams:', assignmentBasedTeams);

      // Second: Teams they are MEMBERS of (fallback)
      console.log('🔧 AP USER: Also checking team_members as fallback');
      const { data: regularMemberships, error: teamError } = await supabase
        .from('team_members')
        .select('team_id, role')
        .eq('user_id', userId)
        .eq('status', 'active');

      if (teamError) {
        console.error('🔧 Team members query FAILED:', teamError);
        throw new Error(`Failed to get team memberships: ${teamError.message}`);
      }

      console.log('🔧 Team members query SUCCESS:', regularMemberships);

      // Convert assignment-based teams to managed teams
      const managedTeams = assignmentBasedTeams;

      const memberTeams = (regularMemberships || []).map(membership => ({
        team_id: membership.team_id,
        role: membership.role,
        relationship_type: 'member'
      }));

      console.log('🔧 Managed teams:', managedTeams);
      console.log('🔧 Member teams:', memberTeams);

      // Merge and deduplicate (prioritize manager role if both exist)
      const teamMap = new Map();
      
      // Add managed teams first (higher priority)
      managedTeams.forEach(team => {
        teamMap.set(team.team_id, team);
      });
      
      // Add member teams only if not already managing
      memberTeams.forEach(team => {
        if (!teamMap.has(team.team_id)) {
          teamMap.set(team.team_id, team);
        }
      });

      teamMemberships = Array.from(teamMap.values());
      console.log('🔧 AP User - Final combined teams:', teamMemberships);
    } else {
      // For non-AP users: Get teams they are MEMBERS of
      const { data: regularMemberships, error: teamError } = await supabase
        .from('team_members')
        .select('team_id, role')
        .eq('user_id', userId)
        .eq('status', 'active');

      if (teamError) {
        throw new Error(`Failed to get team memberships: ${teamError.message}`);
      }

      teamMemberships = (regularMemberships || []).map(membership => ({
        team_id: membership.team_id,
        role: membership.role,
        relationship_type: 'member'
      }));
      console.log('🔧 Non-AP User - Team Memberships:', { userId, memberships: teamMemberships });
    }

    if (!teamMemberships || teamMemberships.length === 0) {
      console.log('🔧 No teams found for user:', { userId, role: profile.role });
      return {
        user_id: profile.id,
        user_role: profile.role,
        display_name: profile.display_name,
        teams: []
      };
    }

    // Step 3: Get team details for each team (remove status filter to bypass RLS)
    const teamIds = teamMemberships.map(tm => tm.team_id);
    console.log('🔧 STEP 3: Querying teams without RLS restrictions for teamIds:', teamIds);
    
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('id, name, location_id, status')
      .in('id', teamIds);

    console.log('🔧 STEP 3 RESULT: Raw teams query result:', teams);
    
    if (teamsError) {
      console.error('🔧 Teams query error:', teamsError);
      throw new Error(`Failed to get teams: ${teamsError.message}`);
    }

    // Filter active teams after getting data
    const activeTeams = (teams || []).filter(t => t.status === 'active');
    console.log('🔧 STEP 3 FILTERED: Active teams:', activeTeams);

    // Step 4: Get location details for each team (remove status filter to bypass RLS)
    const locationIds = activeTeams.map(t => t.location_id).filter(Boolean);
    console.log('🔧 STEP 4: Querying locations without RLS restrictions for locationIds:', locationIds);
    
    const { data: locations, error: locationsError } = await supabase
      .from('locations')
      .select('id, name, status')
      .in('id', locationIds);

    console.log('🔧 STEP 4 RESULT: Raw locations query result:', locations);
    
    if (locationsError) {
      console.error('🔧 Locations query error:', locationsError);
      throw new Error(`Failed to get locations: ${locationsError.message}`);
    }

    // Filter active locations after getting data
    const activeLocations = (locations || []).filter(l => l.status === 'ACTIVE');
    console.log('🔧 STEP 4 FILTERED: Active locations:', activeLocations);

    // Step 5: Get certificate counts by location from certificates
    const { data: certificates, error: certificatesError } = await supabase
      .from('certificates')
      .select('id, location_id')
      .in('location_id', locationIds);

    if (certificatesError) {
      console.warn('Failed to get certificate counts:', certificatesError.message);
    }

    // Count certificates by location
    const certificateCountsByLocation = (certificates || []).reduce((acc, cert) => {
      acc[cert.location_id] = (acc[cert.location_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Step 6: Join the data in JavaScript
    console.log('🔧 STEP 6: Starting join logic');
    console.log('🔧 teamMemberships:', teamMemberships);
    console.log('🔧 teams query result:', teams);
    console.log('🔧 locations query result:', locations);
    
    const teamsWithDetails = teamMemberships
      .map(membership => {
        console.log('🔧 Processing membership:', membership);
        const team = teams?.find(t => t.id === membership.team_id);
        console.log('🔧 Found team for', membership.team_id, ':', team);
        
        if (!team) {
          console.log('🔧 PROBLEM: No team found for team_id:', membership.team_id);
          console.log('🔧 Available teams:', teams?.map(t => ({ id: t.id, name: t.name })));
          return null;
        }
        
        const location = locations?.find(l => l.id === team.location_id);
        console.log('🔧 Found location for', team.location_id, ':', location);
        
        if (!location) {
          console.log('🔧 PROBLEM: No location found for location_id:', team.location_id);
          console.log('🔧 Available locations:', locations?.map(l => ({ id: l.id, name: l.name })));
          return null;
        }
        
        const result = {
          team_id: team.id,
          team_name: team.name,
          team_role: membership.role,
          location_id: team.location_id,
          location_name: location.name,
          certificate_count: certificateCountsByLocation[team.location_id] || 0
        };
        console.log('🔧 Successfully created team result:', result);
        return result;
      })
      .filter(Boolean) as UserDashboardData['teams'];

    console.log('🔧 FINAL teamsWithDetails:', teamsWithDetails);

    return {
      user_id: profile.id,
      user_role: profile.role,
      display_name: profile.display_name,
      teams: teamsWithDetails
    };
    } catch (error) {
      console.error('🔧 SimpleDashboardService FATAL ERROR:', error);
      throw error;
    }
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

  /**
   * Get team members and their roster submissions
   */
  static async getTeamMembers(teamId: string) {
    try {
      // Get team member user IDs
      const { data: teamMembers, error: teamError } = await supabase
        .from('team_members')
        .select('user_id, role, team_position')
        .eq('team_id', teamId)
        .eq('status', 'active');

      if (teamError) {
        throw new Error(`Failed to get team members: ${teamError.message}`);
      }

      if (!teamMembers || teamMembers.length === 0) {
        return [];
      }

      // Get profile details for team members using a join to avoid RLS issues
      const userIds = teamMembers.map(tm => tm.user_id);
      
      // Try to get profiles with a join approach to bypass RLS limitations
      const { data: teamMembersWithProfiles, error: joinError } = await supabase
        .from('team_members')
        .select(`
          user_id,
          role,
          team_position,
          profiles!inner (
            id,
            display_name,
            email,
            phone,
            job_title
          )
        `)
        .eq('team_id', teamId)
        .eq('status', 'active');

      if (joinError) {
        console.warn('Join approach failed, trying direct profile fetch:', joinError);
        
        // Fallback: Try direct profile fetch
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('id, display_name, email, phone, job_title')
          .in('id', userIds);

        if (profileError) {
          console.error('Direct profile fetch also failed:', profileError);
          // Don't throw error, just use empty profiles to show Unknown
          var fallbackProfiles = [];
        } else {
          var fallbackProfiles = profiles;
        }
        
        // Use original teamMembers with fetched profiles
        var finalTeamMembers = teamMembers;
        var finalProfiles = fallbackProfiles;
      } else {
        // Use the joined data
        var finalTeamMembers = teamMembersWithProfiles || [];
        var finalProfiles = (teamMembersWithProfiles || []).map(tm => tm.profiles).filter(Boolean);
      }

      // Get roster submissions created by these team members
      const { data: rosters, error: rosterError } = await supabase
        .from('rosters')
        .select('id, name, created_by, created_at, status, certificate_count, course_id')
        .in('created_by', userIds)
        .order('created_at', { ascending: false });

      if (rosterError) {
        console.warn('Failed to get roster submissions:', rosterError.message);
      }

      // Group rosters by user
      const rostersByUser = (rosters || []).reduce((acc, roster) => {
        if (!acc[roster.created_by]) {
          acc[roster.created_by] = [];
        }
        acc[roster.created_by].push(roster);
        return acc;
      }, {} as Record<string, any[]>);

      // Join all data
      return finalTeamMembers.map(member => {
        let profile;
        
        if (member.profiles) {
          // From joined data
          profile = member.profiles;
        } else {
          // From separate profile fetch
          profile = finalProfiles?.find(p => p.id === member.user_id);
        }
        
        const userRosters = rostersByUser[member.user_id] || [];
        
        return {
          user_id: member.user_id,
          display_name: profile?.display_name || `User ${member.user_id.substring(0, 8)}`,
          email: profile?.email || '',
          phone: profile?.phone || '',
          job_title: profile?.job_title || '',
          team_role: member.role,
          team_position: member.team_position || '',
          roster_submissions: userRosters.length,
          recent_rosters: userRosters.slice(0, 3) // Show last 3 rosters
        };
      });
    } catch (error) {
      console.error('Error getting team members:', error);
      return [];
    }
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
