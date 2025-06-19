import { supabase } from '@/integrations/supabase/client';

/**
 * Debug utility to trace relationships between AP users, locations, teams, and certificates
 */
export async function debugDashboardRelationships(userId: string) {
  const results: any = {
    user: null,
    userRole: null,
    apLocationAssignments: [],
    teamMemberships: [],
    teams: [],
    locations: [],
    certificates: [],
    errors: []
  };

  try {
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, display_name, email, role')
      .eq('id', userId)
      .single();

    if (profileError) {
      results.errors.push(`Profile error: ${profileError.message}`);
    } else {
      results.user = profile;
      results.userRole = profile.role;
    }

    // If AP user, get location assignments
    if (profile?.role === 'AP') {
      const { data: assignments, error: assignmentsError } = await supabase
        .from('ap_user_location_assignments')
        .select(`
          id,
          ap_user_id,
          location_id,
          status,
          created_at,
          updated_at
        `)
        .eq('ap_user_id', userId);

      if (assignmentsError) {
        results.errors.push(`AP location assignments error: ${assignmentsError.message}`);
      } else {
        results.apLocationAssignments = assignments || [];

        // Get location details for each assignment
        if (assignments && assignments.length > 0) {
          const locationIds = assignments.map(a => a.location_id);
          
          const { data: locations, error: locationsError } = await supabase
            .from('locations')
            .select('*')
            .in('id', locationIds);

          if (locationsError) {
            results.errors.push(`Locations error: ${locationsError.message}`);
          } else {
            results.locations = locations || [];
          }

          // Get certificates for these locations
          const { data: certificates, error: certsError } = await supabase
            .from('certificates')
            .select('id, course_name, created_at, recipient_name, location_id, user_id')
            .in('location_id', locationIds)
            .limit(10);

          if (certsError) {
            results.errors.push(`Certificates error: ${certsError.message}`);
          } else {
            results.certificates = certificates || [];
          }
        }
      }
    }

    // Get team memberships
    const { data: memberships, error: membershipsError } = await supabase
      .from('team_members')
      .select('team_id, role, status')
      .eq('user_id', userId);

    if (membershipsError) {
      results.errors.push(`Team memberships error: ${membershipsError.message}`);
    } else {
      results.teamMemberships = memberships || [];

      // Get team details for each membership
      if (memberships && memberships.length > 0) {
        const teamIds = memberships.map(m => m.team_id);
        
        const { data: teams, error: teamsError } = await supabase
          .from('teams')
          .select(`
            id,
            name,
            location_id,
            provider_id,
            status
          `)
          .in('id', teamIds);

        if (teamsError) {
          results.errors.push(`Teams error: ${teamsError.message}`);
        } else {
          results.teams = teams || [];
          
          // Get location details for these teams
          if (teams && teams.length > 0) {
            const locationIds = teams.map(t => t.location_id).filter(Boolean);
            
            if (locationIds.length > 0) {
              const { data: locations, error: locationsError } = await supabase
                .from('locations')
                .select('*')
                .in('id', locationIds);

              if (locationsError) {
                results.errors.push(`Team locations error: ${locationsError.message}`);
              } else {
                // Merge with existing locations
                const existingLocationIds = results.locations.map((l: any) => l.id);
                const newLocations = (locations || []).filter((l: any) => !existingLocationIds.includes(l.id));
                results.locations = [...results.locations, ...newLocations];
              }
            }
          }
        }
      }
    }

    // Check for inconsistencies
    results.inconsistencies = [];
    
    // Check if AP user has location assignments
    if (profile?.role === 'AP' && results.apLocationAssignments.length === 0) {
      results.inconsistencies.push('AP user has no location assignments');
    }
    
    // Check if team has a valid location
    results.teams.forEach((team: any) => {
      if (!team.location_id) {
        results.inconsistencies.push(`Team ${team.id} has no location_id`);
      } else {
        const locationExists = results.locations.some((l: any) => l.id === team.location_id);
        if (!locationExists) {
          results.inconsistencies.push(`Team ${team.id} has invalid location_id: ${team.location_id}`);
        }
      }
    });

    return results;
  } catch (error: any) {
    console.error('Error in debugDashboardRelationships:', error);
    return {
      ...results,
      errors: [...results.errors, `General error: ${error.message}`]
    };
  }
}

/**
 * Debug utility to check certificate associations
 */
export async function debugCertificateAssociations(locationId: string) {
  try {
    // Get certificates for this location
    const { data: certificates, error: certsError } = await supabase
      .from('certificates')
      .select(`
        id,
        course_name,
        created_at,
        recipient_name,
        location_id,
        user_id,
        issued_by
      `)
      .eq('location_id', locationId)
      .limit(20);
      
    if (certsError) {
      return { error: certsError.message };
    }
    
    // Get location details
    const { data: location, error: locationError } = await supabase
      .from('locations')
      .select('*')
      .eq('id', locationId)
      .single();
      
    if (locationError) {
      return { error: locationError.message, certificates };
    }
    
    // Get teams for this location
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('id, name, status')
      .eq('location_id', locationId);
      
    if (teamsError) {
      return { error: teamsError.message, certificates, location };
    }
    
    return {
      certificates,
      location,
      teams,
      certificateCount: certificates?.length || 0
    };
  } catch (error: any) {
    console.error('Error in debugCertificateAssociations:', error);
    return { error: error.message };
  }
}

/**
 * Debug utility to check AP user assignments
 */
export async function debugAPUserAssignments(apUserId: string) {
  try {
    // Get AP user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, display_name, email, role')
      .eq('id', apUserId)
      .single();
      
    if (profileError) {
      return { error: profileError.message };
    }
    
    if (profile.role !== 'AP') {
      return { error: 'User is not an AP user', profile };
    }
    
    // Get location assignments
    const { data: assignments, error: assignmentsError } = await supabase
      .from('ap_user_location_assignments')
      .select(`
        id,
        ap_user_id,
        location_id,
        status,
        created_at,
        updated_at,
        locations (
          id,
          name,
          city,
          state,
          address
        )
      `)
      .eq('ap_user_id', apUserId);
      
    if (assignmentsError) {
      return { error: assignmentsError.message, profile };
    }
    
    // Check if AP user is also a provider
    const { data: provider, error: providerError } = await supabase
      .from('authorized_providers')
      .select('*')
      .eq('user_id', apUserId)
      .single();
      
    // This error is expected if the user is not a provider
    const isProvider = !providerError && provider;
    
    return {
      profile,
      assignments,
      isProvider,
      provider: isProvider ? provider : null,
      assignmentCount: assignments?.length || 0
    };
  } catch (error: any) {
    console.error('Error in debugAPUserAssignments:', error);
    return { error: error.message };
  }
}