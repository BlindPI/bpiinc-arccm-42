import { supabase } from '@/integrations/supabase/client';

/**
 * DEBUG AP USER TEAM QUERY ISSUE
 * 
 * Provider Management shows teams exist, but AP dashboard finds 0.
 * Let's trace exactly what's happening with the database queries.
 */

export async function debugAPUserTeamQuery(userId: string) {
  console.log('🔍 DEBUGGING AP USER TEAM QUERY ISSUE');
  console.log('='.repeat(60));
  console.log(`User ID: ${userId}`);
  
  try {
    // Step 1: Get provider record
    console.log('\n1. GETTING PROVIDER RECORD...');
    const { data: providerRecord, error: providerError } = await supabase
      .from('authorized_providers')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
      
    if (providerError) {
      console.error('❌ Provider query error:', providerError);
      return;
    }
    
    if (!providerRecord) {
      console.log('❌ No provider record found');
      return;
    }
    
    console.log('✅ Provider found:', {
      id: providerRecord.id,
      name: providerRecord.name,
      primary_location_id: providerRecord.primary_location_id
    });
    
    // Step 2: Check if primary location exists
    if (providerRecord.primary_location_id) {
      console.log('\n2. CHECKING PRIMARY LOCATION...');
      const { data: location, error: locationError } = await supabase
        .from('locations')
        .select('*')
        .eq('id', providerRecord.primary_location_id)
        .single();
        
      if (locationError) {
        console.error('❌ Location query error:', locationError);
      } else {
        console.log('✅ Primary location found:', location.name);
      }
    }
    
    // Step 3: Look for teams at this location
    if (providerRecord.primary_location_id) {
      console.log('\n3. SEARCHING FOR TEAMS AT PRIMARY LOCATION...');
      const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select('*')
        .eq('location_id', providerRecord.primary_location_id);
        
      if (teamsError) {
        console.error('❌ Teams query error:', teamsError);
      } else {
        console.log(`✅ Found ${teams?.length || 0} teams at location:`);
        teams?.forEach(team => {
          console.log(`   - ${team.name} (status: ${team.status}, id: ${team.id})`);
        });
      }
      
      // Step 3b: Check ACTIVE teams only
      console.log('\n3b. SEARCHING FOR ACTIVE TEAMS ONLY...');
      const { data: activeTeams, error: activeTeamsError } = await supabase
        .from('teams')
        .select('*')
        .eq('location_id', providerRecord.primary_location_id)
        .eq('status', 'active');
        
      if (activeTeamsError) {
        console.error('❌ Active teams query error:', activeTeamsError);
      } else {
        console.log(`✅ Found ${activeTeams?.length || 0} ACTIVE teams at location:`);
        activeTeams?.forEach(team => {
          console.log(`   - ${team.name} (status: ${team.status}, id: ${team.id})`);
        });
      }
    }
    
    // Step 4: Check provider team assignments table
    console.log('\n4. CHECKING PROVIDER TEAM ASSIGNMENTS...');
    const { data: assignments, error: assignmentsError } = await supabase
      .from('provider_team_assignments')
      .select('*')
      .eq('provider_id', providerRecord.id);
      
    if (assignmentsError) {
      console.error('❌ Team assignments query error:', assignmentsError);
    } else {
      console.log(`✅ Found ${assignments?.length || 0} team assignments:`);
      assignments?.forEach(assignment => {
        console.log(`   - Team ID: ${assignment.team_id}, Status: ${assignment.status}, Role: ${assignment.assignment_role}`);
      });
      
      // CRITICAL: Check if assigned teams actually exist in teams table
      if (assignments && assignments.length > 0) {
        console.log('\n4b. CHECKING IF ASSIGNED TEAMS EXIST IN TEAMS TABLE...');
        for (const assignment of assignments) {
          const { data: teamExists, error: teamExistsError } = await supabase
            .from('teams')
            .select('id, name, status')
            .eq('id', assignment.team_id)
            .maybeSingle();
            
          if (teamExistsError) {
            console.error(`❌ Error checking team ${assignment.team_id}:`, teamExistsError);
          } else if (!teamExists) {
            console.error(`❌ CRITICAL: Team ${assignment.team_id} DOES NOT EXIST in teams table!`);
          } else {
            console.log(`✅ Team ${assignment.team_id} exists: ${teamExists.name} (status: ${teamExists.status})`);
          }
        }
        
        // Test the join query that's failing
        console.log('\n4c. TESTING JOIN QUERY (what the app uses)...');
        const { data: joinResults, error: joinError } = await supabase
          .from('provider_team_assignments')
          .select(`
            *,
            teams!inner(
              id,
              name,
              status
            )
          `)
          .eq('provider_id', providerRecord.id)
          .eq('status', 'active');
          
        if (joinError) {
          console.error('❌ JOIN QUERY FAILED:', joinError);
        } else {
          console.log(`✅ JOIN QUERY SUCCESS: Found ${joinResults?.length || 0} results`);
          joinResults?.forEach(result => {
            console.log(`   - Assignment ID: ${result.id}, Team: ${result.teams.name}`);
          });
        }
      }
    }
    
    // Step 5: Check all teams table to see what exists
    console.log('\n5. CHECKING ALL TEAMS IN DATABASE...');
    const { data: allTeams, error: allTeamsError } = await supabase
      .from('teams')
      .select('id, name, status, location_id')
      .limit(10);
      
    if (allTeamsError) {
      console.error('❌ All teams query error:', allTeamsError);
    } else {
      console.log(`✅ Sample teams in database (first 10):`);
      allTeams?.forEach(team => {
        console.log(`   - ${team.name} (location_id: ${team.location_id}, status: ${team.status})`);
      });
    }
    
    // Step 6: Search for teams with similar names
    console.log('\n6. SEARCHING FOR TEAMS WITH SIMILAR NAMES...');
    const { data: similarTeams, error: similarError } = await supabase
      .from('teams')
      .select('*')
      .ilike('name', '%Barrie%');
      
    if (similarError) {
      console.error('❌ Similar teams query error:', similarError);
    } else {
      console.log(`✅ Found ${similarTeams?.length || 0} teams with 'Barrie' in name:`);
      similarTeams?.forEach(team => {
        console.log(`   - ${team.name} (location_id: ${team.location_id}, status: ${team.status})`);
      });
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('🔍 DIAGNOSIS SUMMARY:');
    console.log(`Provider: ${providerRecord.name}`);
    console.log(`Primary Location ID: ${providerRecord.primary_location_id}`);
    console.log('Check the teams query results above to see why 0 teams are being returned');
    
  } catch (error) {
    console.error('🚨 Debug query failed:', error);
  }
}