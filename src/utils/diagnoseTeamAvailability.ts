/**
 * Diagnostic Tool for Team Availability Issues
 * Checks why teams aren't showing up in dropdowns
 */

import { supabase } from '@/integrations/supabase/client';

export async function diagnoseTeamAvailability() {
  console.log('🔍 === DIAGNOSING TEAM AVAILABILITY ISSUES ===');
  
  try {
    // 1. Check all teams in database
    console.log('1. Checking all teams in database...');
    const { data: allTeams, error: allTeamsError } = await supabase
      .from('teams')
      .select('*');

    if (allTeamsError) {
      console.error('❌ Error fetching all teams:', allTeamsError);
      return;
    }

    console.log(`✅ Found ${allTeams?.length || 0} total teams`);
    console.log('Sample team structure:', allTeams?.[0]);

    // 2. Check teams by status
    const activeTeams = allTeams?.filter(t => t.status === 'active') || [];
    const inactiveTeams = allTeams?.filter(t => t.status !== 'active') || [];
    
    console.log(`📊 Teams by status:
      - Active: ${activeTeams.length}
      - Inactive: ${inactiveTeams.length}`);

    // 3. Check provider_id relationships (the key issue from the plan)
    const teamsWithProvider = allTeams?.filter(t => t.provider_id !== null) || [];
    const orphanedTeams = allTeams?.filter(t => t.provider_id === null) || [];
    
    console.log(`📊 Teams by provider relationship:
      - With provider_id: ${teamsWithProvider.length}
      - Orphaned (NULL provider_id): ${orphanedTeams.length}`);

    if (orphanedTeams.length > 0) {
      console.log('🚨 ORPHANED TEAMS FOUND:', orphanedTeams.map(t => ({
        id: t.id,
        name: t.name,
        provider_id: t.provider_id
      })));
    }

    // 4. Check available providers
    console.log('4. Checking available providers...');
    const { data: providers, error: providersError } = await supabase
      .from('authorized_providers')
      .select('id, name, status');

    if (providersError) {
      console.error('❌ Error fetching providers:', providersError);
    } else {
      const activeProviders = providers?.filter(p => p.status === 'active') || [];
      console.log(`✅ Found ${activeProviders.length} active providers`);
    }

    // 5. Check provider team assignments
    console.log('5. Checking provider team assignments...');
    const { data: assignments, error: assignmentsError } = await supabase
      .from('provider_team_assignments')
      .select('*');

    if (assignmentsError) {
      console.error('❌ Error fetching assignments:', assignmentsError);
    } else {
      console.log(`✅ Found ${assignments?.length || 0} team assignments`);
    }

    // 6. Test the actual getAvailableTeams query logic
    console.log('6. Testing team availability logic...');
    
    if (providers && providers.length > 0) {
      const testProviderId = providers[0].id;
      console.log(`Testing with provider ID: ${testProviderId}`);

      // Simulate the getAvailableTeams logic
      const assignedTeamIds = assignments
        ?.filter(a => a.provider_id === testProviderId && a.status === 'active')
        ?.map(a => a.team_id) || [];
      
      console.log(`Provider ${testProviderId} is assigned to ${assignedTeamIds.length} teams`);
      
      const availableForAssignment = activeTeams.filter(team => 
        !assignedTeamIds.includes(team.id)
      );
      
      console.log(`Available teams for assignment: ${availableForAssignment.length}`);
      console.log('Available team names:', availableForAssignment.map(t => t.name));
    }

  } catch (error) {
    console.error('❌ Diagnostic error:', error);
  }

  console.log('🔍 === END TEAM AVAILABILITY DIAGNOSIS ===');
}

// Export for manual calling
if (typeof window !== 'undefined') {
  (window as any).diagnoseTeamAvailability = diagnoseTeamAvailability;
}