/**
 * DEEP DIAGNOSTIC FOR AP TEAM MEMBER ACCESS ISSUES
 * 
 * This diagnostic investigates why the RLS policies and safe functions
 * are still not working after the migration was applied.
 */

import { supabase } from '@/integrations/supabase/client';

export async function diagnoseAPTeamRelationshipDeep(userId?: string, teamId?: string) {
  console.log('🔍 DEEP DIAGNOSTIC: AP Team Member Access Issues');
  console.log('====================================================');
  
  if (!userId) {
    console.error('❌ No user ID provided for diagnostic');
    return;
  }
  
  try {
    // 1. Get user profile and role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (profileError) {
      console.error('❌ Cannot get user profile:', profileError);
      return;
    }
    
    console.log('👤 USER PROFILE:');
    console.log(`   ID: ${profile.id}`);
    console.log(`   Role: ${profile.role}`);
    console.log(`   Email: ${profile.email}`);
    console.log('');
    
    // 2. Get provider record
    const { data: provider, error: providerError } = await supabase
      .from('authorized_providers')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (providerError) {
      console.error('❌ Cannot get provider record:', providerError);
      console.error('🔧 ISSUE: User is not linked to an authorized_providers record');
      return;
    }
    
    console.log('🏢 PROVIDER RECORD:');
    console.log(`   ID: ${provider.id}`);
    console.log(`   Name: ${provider.name}`);
    console.log(`   Status: ${provider.status}`);
    console.log(`   User ID: ${provider.user_id}`);
    console.log('');
    
    // 3. Get all team assignments for this provider
    const { data: assignments, error: assignError } = await supabase
      .from('provider_team_assignments')
      .select('*')
      .eq('provider_id', provider.id);
    
    if (assignError) {
      console.error('❌ Cannot get team assignments:', assignError);
      return;
    }
    
    console.log('📋 TEAM ASSIGNMENTS:');
    console.log(`   Total assignments: ${assignments?.length || 0}`);
    
    if (assignments && assignments.length > 0) {
      assignments.forEach((assignment, index) => {
        console.log(`   ${index + 1}. Team: ${assignment.team_id}`);
        console.log(`      Role: ${assignment.assignment_role}`);
        console.log(`      Status: ${assignment.status}`);
        console.log(`      Created: ${assignment.created_at}`);
        console.log('');
      });
    } else {
      console.error('🚨 CRITICAL ISSUE: No team assignments found for provider');
      console.error('🔧 SOLUTION: Provider needs to be assigned to teams');
      return;
    }
    
    // 4. If specific team provided, check that assignment
    if (teamId) {
      const teamAssignment = assignments?.find(a => a.team_id === teamId);
      
      console.log('🎯 SPECIFIC TEAM CHECK:');
      console.log(`   Team ID: ${teamId}`);
      
      if (teamAssignment) {
        console.log(`   ✅ Assignment found:`);
        console.log(`      Role: ${teamAssignment.assignment_role}`);
        console.log(`      Status: ${teamAssignment.status}`);
        
        // Check if role allows management
        const canManage = teamAssignment.status === 'active' && 
                         (teamAssignment.assignment_role === 'primary' || 
                          teamAssignment.assignment_role === 'supervisor');
        
        console.log(`   Management allowed: ${canManage ? '✅ YES' : '❌ NO'}`);
        
        if (!canManage) {
          console.error('🚨 ISSUE: Assignment role/status does not allow team management');
          console.error(`🔧 CURRENT: role=${teamAssignment.assignment_role}, status=${teamAssignment.status}`);
          console.error('🔧 NEEDED: role=primary/supervisor AND status=active');
        }
      } else {
        console.error('🚨 CRITICAL: Provider not assigned to this specific team');
        console.error('🔧 SOLUTION: Assign provider to this team with proper role');
      }
      console.log('');
    }
    
    // 5. Test the RLS policy condition manually
    console.log('🧪 TESTING RLS POLICY CONDITION:');
    
    try {
      const { data: policyTest, error: policyError } = await supabase
        .from('provider_team_assignments')
        .select(`
          team_id,
          assignment_role,
          status,
          authorized_providers!inner (
            user_id
          )
        `)
        .eq('authorized_providers.user_id', userId)
        .eq('status', 'active')
        .in('assignment_role', ['primary', 'supervisor']);
      
      if (policyError) {
        console.error('❌ RLS policy test failed:', policyError);
      } else {
        console.log(`✅ RLS policy would allow access to ${policyTest?.length || 0} teams`);
        if (policyTest && policyTest.length > 0) {
          policyTest.forEach((result, index) => {
            console.log(`   ${index + 1}. Team: ${result.team_id} (${result.assignment_role})`);
          });
        }
      }
    } catch (error) {
      console.error('❌ RLS policy test error:', error);
    }
    
    console.log('');
    
    // 6. Test the safe function directly
    if (teamId) {
      console.log('🧪 TESTING SAFE FUNCTION ACCESS:');
      
      // Test with a dummy member ID to see if function exists
      try {
        const { error: functionError } = await supabase.rpc('update_team_member_role_safe' as any, {
          p_member_id: '00000000-0000-0000-0000-000000000000',
          p_new_role: 'member'
        });
        
        if (functionError) {
          if (functionError.message.includes('function') && functionError.message.includes('does not exist')) {
            console.error('🚨 CRITICAL: Safe function does not exist in database');
            console.error('🔧 SOLUTION: Re-apply the migration or check function creation');
          } else if (functionError.message.includes('Team member not found')) {
            console.log('✅ Safe function exists and is accessible');
          } else if (functionError.message.includes('Insufficient permissions')) {
            console.error('🚨 ISSUE: Function exists but authorization logic is failing');
            console.error('🔧 CHECK: Provider-team assignment relationships');
          } else {
            console.error('❌ Unexpected function error:', functionError.message);
          }
        } else {
          console.log('✅ Safe function accessible');
        }
      } catch (error) {
        console.error('❌ Function test error:', error);
      }
    }
    
    // 7. Check if migration was actually applied
    console.log('🧪 CHECKING MIGRATION STATUS:');
    
    try {
      // Try to call the function to see if it exists
      const { error: migrationCheck } = await supabase.rpc('get_team_member_count' as any, {
        p_team_id: '00000000-0000-0000-0000-000000000000'
      });
      
      if (migrationCheck && migrationCheck.message && migrationCheck.message.includes('function') && migrationCheck.message.includes('does not exist')) {
        console.error('🚨 CRITICAL: Migration functions not found in database');
        console.error('🔧 SOLUTION: Re-run the migration file');
      } else {
        console.log('✅ Migration functions appear to be applied');
      }
    } catch (error) {
      console.error('❌ Migration check error:', error);
    }
    
    console.log('');
    console.log('📋 DIAGNOSTIC COMPLETE');
    console.log('====================================================');
    
  } catch (error) {
    console.error('❌ Deep diagnostic failed:', error);
  }
}

// Helper function to run the diagnostic with current context
export async function runAPTeamDiagnostic() {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.error('❌ No authenticated user found');
    return;
  }
  
  // Try to get current team ID from URL or context
  const currentPath = window.location.pathname;
  const teamIdMatch = currentPath.match(/team\/([a-f0-9-]+)/);
  const teamId = teamIdMatch ? teamIdMatch[1] : undefined;
  
  await diagnoseAPTeamRelationshipDeep(user.id, teamId);
}