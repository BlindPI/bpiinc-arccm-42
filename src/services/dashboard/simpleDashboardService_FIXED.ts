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
    console.log('🔧 =================== SimpleDashboardService FIXED START ===================');
    console.log('🔧 Input userId:', userId);
    
    try {
      // Step 1: Get user profile using simple direct query (avoid RLS recursion)
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
   * FIXED: Get team members using RPC functions when available, fallback to direct queries
   */
  static async getTeamMembers(teamId: string) {
    try {
      console.log('🔧 TEAM_MEMBERS: Starting FIXED getTeamMembers for teamId:', teamId);
      
      // **TRY RPC FUNCTION FIRST** (bypasses RLS completely)
      try {
        console.log('🔧 TEAM_MEMBERS: Attempting RPC function approach...');
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_team_member_profiles', {
          p_team_id: teamId
        });

        if (!rpcError && rpcData && rpcData.length > 0) {
          console.log('🔧 TEAM_MEMBERS: RPC function SUCCESS, got', rpcData.length, 'members');
          
          // Get roster counts using RPC function
          const membersWithRosters = await Promise.all(
            rpcData.map(async (member: any) => {
              // Get user's location for filtering (AP users)
              const currentUser = await supabase.auth.getUser();
              let locationFilter = null;
              
              if (currentUser.data.user) {
                const { data: userProfile } = await supabase
                  .from('profiles')
                  .select('role')
                  .eq('id', currentUser.data.user.id)
                  .single();

                if (userProfile?.role === 'AP') {
                  // Get AP user's location using RPC
                  const { data: locationId } = await supabase.rpc('get_ap_user_location', {
                    p_user_id: currentUser.data.user.id
                  });
                  locationFilter = locationId;
                }
              }

              // Get user rosters using RPC function
              const { data: userRosters } = await supabase.rpc('get_user_rosters', {
                p_user_id: member.user_id,
                p_location_id: locationFilter
              });

              return {
                user_id: member.user_id,
                display_name: member.display_name || `User ${member.user_id.substring(0, 8)}`,
                email: member.email || '',
                phone: member.phone || '',
                job_title: member.job_title || '',
                team_role: member.team_role,
                team_position: member.team_position || '',
                roster_submissions: userRosters?.length || 0,
                recent_rosters: userRosters?.slice(0, 3) || []
              };
            })
          );

          console.log('🔧 TEAM_MEMBERS: RPC approach complete with roster counts');
          return membersWithRosters;
        } else {
          console.log('🔧 TEAM_MEMBERS: RPC function failed or empty, falling back to direct query');
        }
      } catch (rpcError) {
        console.log('🔧 TEAM_MEMBERS: RPC function not available, using fallback approach');
      }

      // **FALLBACK: Direct query approach** (original working code)
      console.log('🔧 TEAM_MEMBERS: Using fallback direct query approach...');
      
      // First get team members using simple query (SafeTeamService pattern)
      const { data: teamMembers, error: teamError } = await supabase
        .from('team_members')
        .select('user_id, role, team_position, status, created_at')
        .eq('team_id', teamId);

      console.log('🔧 TEAM_MEMBERS: Raw team members query result:', { teamMembers, teamError });

      if (teamError) {
        console.error('🔧 TEAM_MEMBERS: Error fetching team members:', teamError);
        throw new Error(`Failed to get team members: ${teamError.message}`);
      }

      if (!teamMembers || teamMembers.length === 0) {
        console.log('🔧 TEAM_MEMBERS: No team members found for team:', teamId);
        return [];
      }

      // Filter active members
      const activeMembers = teamMembers.filter(tm => tm.status === 'active');
      console.log('🔧 TEAM_MEMBERS: Active members count:', activeMembers.length);

      if (activeMembers.length === 0) {
        console.log('🔧 TEAM_MEMBERS: No active members found');
        return [];
      }

      const userIds = activeMembers.map(tm => tm.user_id);
      console.log('🔧 TEAM_MEMBERS: User IDs to fetch profiles for:', userIds);

      // Get profiles separately to avoid RLS issues (SafeTeamService pattern)
      const membersWithProfiles = await Promise.all(
        activeMembers.map(async (member) => {
          console.log('🔧 TEAM_MEMBERS: Fetching profile for user:', member.user_id);
          
          // **TRY DIRECT QUERY**: Bypass potential RLS issues with a simpler approach
          let profile = null;
          
          try {
            // First try a simple profiles query
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('id, display_name, email, phone, job_title, role')
              .eq('id', member.user_id)
              .maybeSingle(); // Use maybeSingle to avoid throwing on no results

            if (profileError) {
              console.error('🔧 TEAM_MEMBERS: Profile query error:', profileError);
            } else if (profileData) {
              profile = profileData;
              console.log('🔧 TEAM_MEMBERS: Profile found:', {
                id: profile.id,
                display_name: profile.display_name,
                email: profile.email
              });
            } else {
              console.warn('🔧 TEAM_MEMBERS: No profile found for user:', member.user_id);
            }
          } catch (error) {
            console.error('🔧 TEAM_MEMBERS: Profile fetch exception:', error);
          }

          return {
            ...member,
            joined_at: member.created_at || new Date().toISOString(),
            profile: profile || null
          };
        })
      );

      console.log('🔧 TEAM_MEMBERS: Members with profiles:', membersWithProfiles.length);

      // **FIXED: Get rosters with location-based filtering for AP users**
      console.log('🔧 TEAM_MEMBERS: Getting rosters with location filtering...');
      
      // Determine if we need location-based filtering (for AP users)
      const currentUser = await supabase.auth.getUser();
      let locationFilter = null;
      
      if (currentUser.data.user) {
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', currentUser.data.user.id)
          .single();

        if (userProfile?.role === 'AP') {
          // Get AP user's location for filtering
          const { data: apProvider } = await supabase
            .from('authorized_providers')
            .select('primary_location_id')
            .eq('user_id', currentUser.data.user.id)
            .single();

          if (apProvider?.primary_location_id) {
            locationFilter = apProvider.primary_location_id;
            console.log('🔧 TEAM_MEMBERS: AP user - will filter rosters by location:', locationFilter);
          }
        }
      }

      // **TRY RPC FUNCTION FOR ROSTERS FIRST**
      let rosters = [];
      if (locationFilter) {
        try {
          const { data: locationRosters } = await supabase.rpc('get_location_rosters', {
            p_location_id: locationFilter
          });
          
          if (locationRosters) {
            // Filter to only rosters created by team members
            rosters = locationRosters.filter((roster: any) => userIds.includes(roster.created_by));
            console.log('🔧 TEAM_MEMBERS: Used RPC function for location rosters, found:', rosters.length);
          }
        } catch (rpcError) {
          console.log('🔧 TEAM_MEMBERS: RPC roster function failed, using direct query');
        }
      }

      // Fallback to direct roster query if RPC failed or no location filter
      if (rosters.length === 0) {
        let rosterQuery = supabase
          .from('rosters')
          .select('id, name, created_by, created_at, status, certificate_count, course_id, location_id')
          .in('created_by', userIds)
          .eq('status', 'ACTIVE');

        // Apply location filter for AP users
        if (locationFilter) {
          rosterQuery = rosterQuery.eq('location_id', locationFilter);
          console.log('🔧 TEAM_MEMBERS: Applied location filter to rosters query');
        }

        rosterQuery = rosterQuery.order('created_at', { ascending: false });

        const { data: directRosters, error: rosterError } = await rosterQuery;

        if (rosterError) {
          console.warn('🔧 TEAM_MEMBERS: Failed to get roster submissions:', rosterError.message);
        } else {
          rosters = directRosters || [];
          console.log('🔧 TEAM_MEMBERS: Direct roster query found:', rosters.length);
        }
      }

      // Group rosters by user
      const rostersByUser = rosters.reduce((acc: any, roster: any) => {
        if (!acc[roster.created_by]) {
          acc[roster.created_by] = [];
        }
        acc[roster.created_by].push(roster);
        return acc;
      }, {} as Record<string, any[]>);

      console.log('🔧 TEAM_MEMBERS: Rosters grouped by user:', Object.keys(rostersByUser).length, 'users have rosters');

      // Format final result
      const result = membersWithProfiles.map(member => {
        const profile = member.profile;
        const userRosters = rostersByUser[member.user_id] || [];
        
        // Enhanced display name logic with better fallbacks
        let displayName = profile?.display_name;
        if (!displayName || displayName.trim() === '') {
          // Try email first part if no display name
          if (profile?.email) {
            displayName = profile.email.split('@')[0];
          } else {
            // Last resort: truncated user ID
            displayName = `User ${member.user_id.substring(0, 8)}`;
          }
        }

        const formattedMember = {
          user_id: member.user_id,
          display_name: displayName,
          email: profile?.email || '',
          phone: profile?.phone || '',
          job_title: profile?.job_title || '',
          team_role: member.role,
          team_position: member.team_position || '',
          roster_submissions: userRosters.length,
          recent_rosters: userRosters.slice(0, 3) // Show last 3 rosters
        };

        console.log('🔧 TEAM_MEMBERS: Formatted member:', formattedMember.display_name, 'Rosters:', formattedMember.roster_submissions);
        return formattedMember;
      });

      console.log('🔧 TEAM_MEMBERS: Final result count:', result.length);
      return result;
    } catch (error) {
      console.error('🔧 TEAM_MEMBERS: Fatal error getting team members:', error);
      return [];
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