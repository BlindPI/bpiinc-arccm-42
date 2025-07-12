import { supabase } from '@/integrations/supabase/client';

export interface ProviderCertificateDebugInfo {
  providerInfo: any;
  locationInfo: any;
  teamAssignments: any[];
  teamMembers: any[];
  certificates: any[];
  certificateCount: number;
  teamDashboardCertificates: any[];
  teamDashboardCount: number;
  issues: string[];
}

export async function debugProviderCertificateVisibility(
  providerName: string = 'Kevin Geem'
): Promise<ProviderCertificateDebugInfo> {
  const issues: string[] = [];
  
  try {
    console.log(`🔍 Debugging certificate visibility for provider: ${providerName}`);
    
    // 1. Find the provider/AP user
    const { data: providerInfo, error: providerError } = await supabase
      .from('authorized_providers')
      .select(`
        *,
        profiles!authorized_providers_user_id_fkey(
          id,
          display_name,
          email,
          role
        ),
        locations!authorized_providers_primary_location_id_fkey(
          id,
          name,
          city,
          state
        )
      `)
      .or(`name.ilike.%${providerName}%, profiles.display_name.ilike.%${providerName}%`)
      .single();

    if (providerError || !providerInfo) {
      issues.push(`❌ Provider "${providerName}" not found in authorized_providers table`);
      
      // Check if user exists in profiles
      const { data: profileCheck } = await supabase
        .from('profiles')
        .select('*')
        .ilike('display_name', `%${providerName}%`);
      
      if (profileCheck && profileCheck.length > 0) {
        issues.push(`ℹ️ User found in profiles but not as authorized provider: ${JSON.stringify(profileCheck[0])}`);
      }
      
      return {
        providerInfo: null,
        locationInfo: null,
        teamAssignments: [],
        teamMembers: [],
        certificates: [],
        certificateCount: 0,
        teamDashboardCertificates: [],
        teamDashboardCount: 0,
        issues
      };
    }

    console.log(`✅ Found provider:`, providerInfo);

    // 2. Check location assignment
    const locationInfo = providerInfo.locations;
    if (!locationInfo) {
      issues.push(`❌ Provider has no primary location assigned`);
    } else {
      console.log(`✅ Provider assigned to location:`, locationInfo);
    }

    // 3. Check team assignments
    const { data: teamAssignments, error: teamAssignError } = await supabase
      .from('provider_team_assignments')
      .select(`
        *,
        teams!provider_team_assignments_team_id_fkey(
          id,
          name,
          location_id,
          status,
          locations!teams_location_id_fkey(name, city, state)
        )
      `)
      .eq('provider_id', providerInfo.id)
      .eq('status', 'active');

    if (teamAssignError) {
      issues.push(`❌ Error fetching team assignments: ${teamAssignError.message}`);
    }

    console.log(`📋 Team assignments found:`, teamAssignments?.length || 0);

    // 4. Check team members for assigned teams
    let teamMembers: any[] = [];
    if (teamAssignments && teamAssignments.length > 0) {
      const teamIds = teamAssignments.map((ta: any) => ta.teams?.id).filter(Boolean);
      
      const { data: members, error: membersError } = await supabase
        .from('team_members')
        .select(`
          *,
          profiles!team_members_user_id_fkey(display_name, email),
          teams!team_members_team_id_fkey(name, location_id)
        `)
        .in('team_id', teamIds)
        .eq('status', 'active');

      if (membersError) {
        issues.push(`❌ Error fetching team members: ${membersError.message}`);
      } else {
        teamMembers = members || [];
        console.log(`👥 Team members found:`, teamMembers.length);
      }
    }

    // 5. Check certificates using provider management logic
    let certificates: any[] = [];
    let certificateCount = 0;
    
    if (teamAssignments && teamAssignments.length > 0) {
      // Get certificates for teams assigned to this provider
      const teamIds = teamAssignments.map((ta: any) => ta.teams?.id).filter(Boolean);
      const locationIds = teamAssignments.map((ta: any) => ta.teams?.location_id).filter(Boolean);
      
      if (locationIds.length > 0) {
        const { data: providerCerts, error: certsError } = await supabase
          .from('certificates')
          .select(`
            *,
            profiles!certificates_user_id_fkey(display_name, email),
            locations!certificates_location_id_fkey(name, city, state),
            teams!certificates_team_id_fkey(name)
          `)
          .in('location_id', locationIds);

        if (certsError) {
          issues.push(`❌ Error fetching provider certificates: ${certsError.message}`);
        } else {
          certificates = providerCerts || [];
          certificateCount = certificates.length;
          console.log(`📜 Provider certificates found:`, certificateCount);
        }
      }
    }

    // 6. Check team dashboard certificate logic for comparison
    let teamDashboardCertificates: any[] = [];
    let teamDashboardCount = 0;
    
    if (teamAssignments && teamAssignments.length > 0) {
      const teamIds = teamAssignments.map((ta: any) => ta.teams?.id).filter(Boolean);
      
      if (teamIds.length > 0) {
        // Use the same logic as team dashboard
        const { data: teamCerts, error: teamCertsError } = await supabase
          .from('certificates')
          .select('id, recipient_name, course_name, status, location_id');

        if (teamCertsError) {
          issues.push(`❌ Error fetching team dashboard certificates: ${teamCertsError.message}`);
        } else {
          teamDashboardCertificates = teamCerts || [];
          teamDashboardCount = teamDashboardCertificates.length;
          console.log(`📊 Team dashboard certificates found:`, teamDashboardCount);
        }
      }
    }

    // 7. Compare certificate counts and identify discrepancies
    if (certificateCount !== teamDashboardCount) {
      issues.push(`⚠️ Certificate count mismatch: Provider view shows ${certificateCount}, Team dashboard shows ${teamDashboardCount}`);
    }

    if (certificateCount === 0 && teamDashboardCount > 0) {
      issues.push(`🔍 Provider management is using location-based filtering, but certificates are linked to teams`);
    }

    if (teamAssignments?.length === 0) {
      issues.push(`❌ No active team assignments found for provider`);
    }

    if (locationInfo && teamAssignments?.length > 0) {
      const hasMatchingLocation = teamAssignments.some((ta: any) =>
        ta.teams?.location_id === locationInfo.id
      );
      if (!hasMatchingLocation) {
        issues.push(`⚠️ Provider location (${locationInfo.name}) doesn't match any assigned team locations`);
      }
    }

    return {
      providerInfo,
      locationInfo,
      teamAssignments: teamAssignments || [],
      teamMembers,
      certificates,
      certificateCount,
      teamDashboardCertificates,
      teamDashboardCount,
      issues
    };

  } catch (error) {
    console.error('Error in debugProviderCertificateVisibility:', error);
    issues.push(`❌ Unexpected error: ${error.message}`);
    
    return {
      providerInfo: null,
      locationInfo: null,
      teamAssignments: [],
      teamMembers: [],
      certificates: [],
      certificateCount: 0,
      teamDashboardCertificates: [],
      teamDashboardCount: 0,
      issues
    };
  }
}

export async function runProviderCertificateDebug() {
  console.log('🚀 Starting Provider Certificate Debug...');
  
  const debugInfo = await debugProviderCertificateVisibility('Kevin Geem');
  
  console.log('\n📊 DEBUG RESULTS:');
  console.log('================');
  
  console.log('\n👤 Provider Info:');
  if (debugInfo.providerInfo) {
    console.log(`- Name: ${debugInfo.providerInfo.name}`);
    console.log(`- User: ${debugInfo.providerInfo.profiles?.display_name} (${debugInfo.providerInfo.profiles?.email})`);
    console.log(`- Status: ${debugInfo.providerInfo.status}`);
    console.log(`- Primary Location: ${debugInfo.locationInfo?.name || 'None'}`);
  } else {
    console.log('- Provider not found');
  }
  
  console.log('\n🏢 Location Info:');
  if (debugInfo.locationInfo) {
    console.log(`- Location: ${debugInfo.locationInfo.name}`);
    console.log(`- City: ${debugInfo.locationInfo.city}, ${debugInfo.locationInfo.state}`);
  } else {
    console.log('- No location assigned');
  }
  
  console.log('\n👥 Team Assignments:');
  console.log(`- Count: ${debugInfo.teamAssignments.length}`);
  debugInfo.teamAssignments.forEach((assignment, index) => {
    console.log(`  ${index + 1}. ${assignment.teams?.name} (${assignment.assignment_role})`);
    console.log(`     Location: ${assignment.teams?.locations?.name || 'Unknown'}`);
    console.log(`     Status: ${assignment.status}`);
  });
  
  console.log('\n📜 Certificate Counts:');
  console.log(`- Provider Management View: ${debugInfo.certificateCount}`);
  console.log(`- Team Dashboard View: ${debugInfo.teamDashboardCount}`);
  
  console.log('\n⚠️ Issues Found:');
  if (debugInfo.issues.length === 0) {
    console.log('- No issues detected');
  } else {
    debugInfo.issues.forEach((issue, index) => {
      console.log(`  ${index + 1}. ${issue}`);
    });
  }
  
  console.log('\n🔧 Recommendations:');
  if (debugInfo.issues.length > 0) {
    if (debugInfo.issues.some(i => i.includes('No active team assignments'))) {
      console.log('- Create team assignment for Kevin Geem to "Barrie First Aid and CPR" team');
    }
    if (debugInfo.issues.some(i => i.includes('Certificate count mismatch'))) {
      console.log('- Update provider certificate query to use team-based filtering instead of location-based');
    }
    if (debugInfo.issues.some(i => i.includes('location-based filtering'))) {
      console.log('- Modify provider service to query certificates by team_id instead of location_id');
    }
  }
  
  return debugInfo;
}