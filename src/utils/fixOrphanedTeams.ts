/**
 * Fix Orphaned Teams Issue
 * Based on COMPREHENSIVE_PROVIDER_MANAGEMENT_RESTORATION_PLAN.md
 */

import { supabase } from '@/integrations/supabase/client';

export async function fixOrphanedTeams() {
  console.log('🔧 === FIXING ORPHANED TEAMS ===');
  
  try {
    // 1. Identify orphaned teams (as per the plan)
    console.log('1. Identifying orphaned teams...');
    const { data: orphanedTeams, error: orphanError } = await supabase
      .from('teams')
      .select('id, name, provider_id')
      .is('provider_id', null);

    if (orphanError) {
      console.error('❌ Error finding orphaned teams:', orphanError);
      return;
    }

    console.log(`Found ${orphanedTeams?.length || 0} orphaned teams:`, 
      orphanedTeams?.map(t => ({ id: t.id, name: t.name })));

    if (!orphanedTeams || orphanedTeams.length === 0) {
      console.log('✅ No orphaned teams found - teams should show in dropdown');
      return;
    }

    // 2. Find an active provider to assign them to (as per the plan)
    console.log('2. Finding active provider for assignment...');
    const { data: activeProviders, error: providerError } = await supabase
      .from('authorized_providers')
      .select('id, name')
      .eq('status', 'active')
      .limit(1);

    if (providerError) {
      console.error('❌ Error finding active providers:', providerError);
      return;
    }

    if (!activeProviders || activeProviders.length === 0) {
      console.log('❌ No active providers found - need to create providers first');
      return;
    }

    const targetProvider = activeProviders[0];
    console.log(`Using provider: ${targetProvider.name} (${targetProvider.id})`);

    // 3. Fix orphaned records (as per the plan)
    console.log('3. Assigning orphaned teams to active provider...');
    
    for (const team of orphanedTeams) {
      const { error: updateError } = await supabase
        .from('teams')
        .update({ 
          provider_id: targetProvider.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', team.id);

      if (updateError) {
        console.error(`❌ Failed to update team ${team.name}:`, updateError);
      } else {
        console.log(`✅ Fixed team: ${team.name} -> Provider: ${targetProvider.name}`);
      }
    }

    // 4. Verify the fix
    console.log('4. Verifying the fix...');
    const { data: remainingOrphans, error: verifyError } = await supabase
      .from('teams')
      .select('id, name')
      .is('provider_id', null);

    if (verifyError) {
      console.error('❌ Error verifying fix:', verifyError);
    } else {
      console.log(`✅ Remaining orphaned teams: ${remainingOrphans?.length || 0}`);
      
      if (remainingOrphans && remainingOrphans.length === 0) {
        console.log('🎉 SUCCESS: All orphaned teams have been fixed!');
        console.log('Teams should now appear in the dropdown');
      }
    }

  } catch (error) {
    console.error('❌ Fix process error:', error);
  }

  console.log('🔧 === END ORPHANED TEAMS FIX ===');
}

// Export for manual calling
if (typeof window !== 'undefined') {
  (window as any).fixOrphanedTeams = fixOrphanedTeams;
}