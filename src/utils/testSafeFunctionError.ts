/**
 * TEST SAFE FUNCTION ERROR DETAILS
 * 
 * This utility captures the exact error details from the safe function
 * to understand why it's returning 400 despite correct authorization.
 */

import { supabase } from '@/integrations/supabase/client';

export async function testSafeFunctionError(teamId: string, memberId?: string) {
  console.log('🧪 TESTING SAFE FUNCTION ERROR DETAILS');
  console.log('======================================');
  
  try {
    // SKIP FAKE ID TEST - only test with real member IDs
    console.log('🔍 SKIPPING FAKE ID TEST - Testing with REAL members only');
    console.log('');
    
    // Test the authorization query directly
    console.log('🧪 TESTING AUTHORIZATION QUERY DIRECTLY:');
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // Test the exact query from the function
      const { data: authTest, error: authError } = await supabase
        .from('provider_team_assignments')
        .select(`
          team_id,
          assignment_role,
          status,
          authorized_providers!inner (
            user_id
          )
        `)
        .eq('authorized_providers.user_id', user.id)
        .eq('team_id', teamId)
        .eq('status', 'active')
        .in('assignment_role', ['primary', 'supervisor']);
      
      if (authError) {
        console.error('❌ Authorization query failed:', authError);
      } else {
        console.log(`✅ Authorization query returned ${authTest?.length || 0} results`);
        if (authTest && authTest.length > 0) {
          console.log('   Details:', authTest[0]);
        } else {
          console.error('🚨 CRITICAL: Authorization query returns empty - this is the issue!');
        }
      }
    }
    
    // Test if we can get a real team member ID
    console.log('');
    console.log('🧪 GETTING REAL TEAM MEMBER FOR TESTING:');
    
    const { data: realMembers, error: memberError } = await supabase
      .from('team_members')
      .select('id, user_id, role')
      .eq('team_id', teamId)
      .eq('status', 'active')
      .limit(1);
    
    if (memberError) {
      console.error('❌ Cannot get real team members:', memberError);
    } else if (realMembers && realMembers.length > 0) {
      const realMember = realMembers[0];
      console.log(`✅ Found real team member: ${realMember.id}`);
      console.log(`   Current role: ${realMember.role}`);
      
      // Test with real member ID
      console.log('');
      console.log('🧪 TESTING WITH REAL MEMBER ID:');
      
      const { data: realTest, error: realError } = await supabase.rpc('update_team_member_role_safe' as any, {
        p_member_id: realMember.id,
        p_new_role: realMember.role // Same role to avoid actual change
      });
      
      if (realError) {
        console.error('❌ REAL MEMBER TEST FAILED:');
        console.error(`   Message: ${realError.message}`);
        console.error(`   This is the actual error preventing role changes!`);
      } else {
        console.log('✅ Real member test succeeded - role changes should work!');
      }
    }
    
    console.log('');
    console.log('📋 SAFE FUNCTION ERROR TEST COMPLETE');
    console.log('======================================');
    
  } catch (error) {
    console.error('❌ Test function error:', error);
  }
}