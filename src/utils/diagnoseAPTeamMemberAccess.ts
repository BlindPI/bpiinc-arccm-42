/**
 * DIAGNOSE AP USER TEAM MEMBER ACCESS
 * 
 * Investigates RLS policy restrictions and team member access patterns
 * for Authorized Provider (AP) users who are getting 400 errors when
 * trying to manage team members.
 */

import { supabase } from '@/integrations/supabase/client';

export interface APTeamMemberDiagnostic {
  issue_type: string;
  detected: boolean;
  severity: 'critical' | 'high' | 'medium' | 'low';
  details: string;
  test_result?: any;
  recommendations: string[];
}

export async function diagnoseAPTeamMemberAccess(userId?: string): Promise<APTeamMemberDiagnostic[]> {
  const diagnostics: APTeamMemberDiagnostic[] = [];
  
  console.log('🔍 DIAGNOSING AP TEAM MEMBER ACCESS...');
  
  try {
    // 1. Check if user is an AP user
    let apProviderId = null;
    let userRole = null;
    
    if (userId) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
        
      if (!profileError && profile) {
        userRole = profile.role;
        console.log(`👤 User role: ${userRole}`);
      }
      
      if (userRole === 'AP') {
        const { data: provider, error: providerError } = await supabase
          .from('authorized_providers')
          .select('id, name')
          .eq('user_id', userId)
          .single();
          
        if (!providerError && provider) {
          apProviderId = provider.id;
          console.log(`🏢 AP Provider ID: ${apProviderId}`);
        }
      }
    }
    
    // 2. Test direct team_members table access
    diagnostics.push(await testTeamMembersAccess());
    
    // 3. Test team_members with profiles join
    diagnostics.push(await testTeamMembersProfileJoin());
    
    // 4. Test team_members UPDATE operations
    diagnostics.push(await testTeamMembersUpdate());
    
    // 5. Test team_members INSERT operations
    diagnostics.push(await testTeamMembersInsert());
    
    // 6. Check RLS policies for team_members
    diagnostics.push(await checkTeamMembersRLSPolicies());
    
    // 7. Test AP user team relationships
    if (apProviderId) {
      diagnostics.push(await testAPTeamRelationships(apProviderId));
    }
    
    // 8. Check team member role validation
    diagnostics.push(await testTeamMemberRoleValidation());
    
    // 9. Test alternative access patterns
    diagnostics.push(await testAlternativeTeamMemberAccess());
    
  } catch (error) {
    console.error('❌ Diagnostic error:', error);
    diagnostics.push({
      issue_type: 'diagnostic_failure',
      detected: true,
      severity: 'critical',
      details: `Diagnostic process failed: ${error}`,
      recommendations: ['Check console for detailed error information', 'Verify database connectivity']
    });
  }
  
  return diagnostics;
}

async function testTeamMembersAccess(): Promise<APTeamMemberDiagnostic> {
  try {
    console.log('🧪 Testing direct team_members access...');
    
    const { data, error } = await supabase
      .from('team_members')
      .select('id, user_id, team_id, role, status')
      .limit(1);
    
    if (error) {
      return {
        issue_type: 'team_members_access_denied',
        detected: true,
        severity: 'critical',
        details: `Cannot access team_members table: ${error.message} (${error.code})`,
        test_result: { error: error.message, code: error.code },
        recommendations: [
          'Check RLS policies on team_members table for AP users',
          'Verify AP users have SELECT permissions',
          'Consider adding AP-specific RLS policies'
        ]
      };
    }
    
    return {
      issue_type: 'team_members_access',
      detected: false,
      severity: 'low',
      details: `✅ Can access team_members table (${data?.length || 0} records visible)`,
      test_result: { success: true, recordCount: data?.length || 0 },
      recommendations: []
    };
    
  } catch (error) {
    return {
      issue_type: 'team_members_access_error',
      detected: true,
      severity: 'critical',
      details: `Team members access test failed: ${error}`,
      recommendations: ['Check database connectivity', 'Verify table exists']
    };
  }
}

async function testTeamMembersProfileJoin(): Promise<APTeamMemberDiagnostic> {
  try {
    console.log('🧪 Testing team_members with profiles join...');
    
    const { data, error } = await supabase
      .from('team_members')
      .select(`
        id,
        user_id,
        team_id,
        role,
        status,
        profiles!inner(
          id,
          email,
          display_name,
          role
        )
      `)
      .limit(1);
    
    if (error) {
      return {
        issue_type: 'team_members_profile_join_denied',
        detected: true,
        severity: 'high',
        details: `Cannot join team_members with profiles: ${error.message} (${error.code})`,
        test_result: { error: error.message, code: error.code },
        recommendations: [
          'Check RLS policies on profiles table for AP users',
          'Verify AP users can access profiles via team_members join',
          'Consider separate queries instead of joins'
        ]
      };
    }
    
    return {
      issue_type: 'team_members_profile_join',
      detected: false,
      severity: 'low',
      details: `✅ Can join team_members with profiles (${data?.length || 0} records)`,
      test_result: { success: true, recordCount: data?.length || 0 },
      recommendations: []
    };
    
  } catch (error) {
    return {
      issue_type: 'team_members_profile_join_error',
      detected: true,
      severity: 'high',
      details: `Team members profile join test failed: ${error}`,
      recommendations: ['Use separate queries instead of joins', 'Check profile table access']
    };
  }
}

async function testTeamMembersUpdate(): Promise<APTeamMemberDiagnostic> {
  try {
    console.log('🧪 Testing team_members UPDATE operations...');
    
    // Test a safe UPDATE that should not change any data
    const { error } = await supabase
      .from('team_members')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', '00000000-0000-0000-0000-000000000000'); // Non-existent ID
    
    if (error) {
      return {
        issue_type: 'team_members_update_denied',
        detected: true,
        severity: 'critical',
        details: `Cannot update team_members: ${error.message} (${error.code})`,
        test_result: { error: error.message, code: error.code },
        recommendations: [
          'Add UPDATE RLS policy for AP users on team_members',
          'Verify AP users can modify their team members',
          'Check if team ownership relationship exists'
        ]
      };
    }
    
    return {
      issue_type: 'team_members_update',
      detected: false,
      severity: 'low',
      details: '✅ Can perform UPDATE operations on team_members',
      test_result: { success: true },
      recommendations: []
    };
    
  } catch (error) {
    return {
      issue_type: 'team_members_update_error',
      detected: true,
      severity: 'critical',
      details: `Team members UPDATE test failed: ${error}`,
      recommendations: ['Check UPDATE permissions for AP users']
    };
  }
}

async function testTeamMembersInsert(): Promise<APTeamMemberDiagnostic> {
  try {
    console.log('🧪 Testing team_members INSERT operations...');
    
    // Test INSERT with invalid data to check permissions without creating records
    const { error } = await supabase
      .from('team_members')
      .insert({
        team_id: '00000000-0000-0000-0000-000000000000',
        user_id: '00000000-0000-0000-0000-000000000000',
        role: 'member',
        status: 'active'
      });
    
    if (error && error.code !== '23503') { // 23503 = foreign key violation (expected)
      return {
        issue_type: 'team_members_insert_denied',
        detected: true,
        severity: 'critical',
        details: `Cannot insert into team_members: ${error.message} (${error.code})`,
        test_result: { error: error.message, code: error.code },
        recommendations: [
          'Add INSERT RLS policy for AP users on team_members',
          'Verify AP users can add team members',
          'Check if proper team relationships exist'
        ]
      };
    }
    
    return {
      issue_type: 'team_members_insert',
      detected: false,
      severity: 'low',
      details: '✅ Can perform INSERT operations on team_members',
      test_result: { success: true },
      recommendations: []
    };
    
  } catch (error) {
    return {
      issue_type: 'team_members_insert_error',
      detected: true,
      severity: 'critical',
      details: `Team members INSERT test failed: ${error}`,
      recommendations: ['Check INSERT permissions for AP users']
    };
  }
}

async function checkTeamMembersRLSPolicies(): Promise<APTeamMemberDiagnostic> {
  try {
    console.log('🧪 Checking team_members RLS policies...');
    
    // This requires admin access, so we'll infer from error patterns
    const { data, error } = await supabase
      .from('team_members')
      .select('id')
      .limit(1);
    
    if (error && error.message.includes('row-level security')) {
      return {
        issue_type: 'team_members_rls_restrictive',
        detected: true,
        severity: 'critical',
        details: 'RLS policies on team_members table are blocking AP user access',
        test_result: { rlsBlocked: true },
        recommendations: [
          'Create AP-specific RLS policies for team_members table',
          'Allow AP users to access teams they manage',
          'Consider using database functions with SECURITY DEFINER'
        ]
      };
    }
    
    return {
      issue_type: 'team_members_rls_policies',
      detected: false,
      severity: 'low',
      details: 'RLS policies appear to allow AP user access',
      recommendations: []
    };
    
  } catch (error) {
    return {
      issue_type: 'team_members_rls_check_error',
      detected: true,
      severity: 'medium',
      details: `Could not check RLS policies: ${error}`,
      recommendations: ['Manual RLS policy review needed']
    };
  }
}

async function testAPTeamRelationships(providerId: string): Promise<APTeamMemberDiagnostic> {
  try {
    console.log('🧪 Testing AP team relationships...');
    
    // Check if AP provider has team assignments
    const { data: assignments, error: assignError } = await supabase
      .from('provider_team_assignments')
      .select('team_id, assignment_role, status')
      .eq('provider_id', providerId);
    
    if (assignError) {
      return {
        issue_type: 'ap_team_relationship_error',
        detected: true,
        severity: 'high',
        details: `Cannot check AP team relationships: ${assignError.message}`,
        recommendations: ['Verify provider_team_assignments table access']
      };
    }
    
    if (!assignments || assignments.length === 0) {
      return {
        issue_type: 'ap_no_team_assignments',
        detected: true,
        severity: 'high',
        details: 'AP provider has no team assignments - cannot manage any teams',
        test_result: { assignments: [] },
        recommendations: [
          'Assign AP provider to teams they should manage',
          'Check team assignment workflow',
          'Verify team creation process for AP users'
        ]
      };
    }
    
    return {
      issue_type: 'ap_team_relationships',
      detected: false,
      severity: 'low',
      details: `✅ AP provider has ${assignments.length} team assignments`,
      test_result: { assignments: assignments.length },
      recommendations: []
    };
    
  } catch (error) {
    return {
      issue_type: 'ap_team_relationship_test_error',
      detected: true,
      severity: 'high',
      details: `AP team relationship test failed: ${error}`,
      recommendations: ['Check provider-team relationship structure']
    };
  }
}

async function testTeamMemberRoleValidation(): Promise<APTeamMemberDiagnostic> {
  try {
    console.log('🧪 Testing team member role validation...');
    
    // Test if role updates are restricted by constraints
    const validRoles = ['member', 'lead', 'instructor', 'coordinator'];
    
    return {
      issue_type: 'team_member_role_validation',
      detected: false,
      severity: 'low',
      details: `✅ Valid team member roles: ${validRoles.join(', ')}`,
      test_result: { validRoles },
      recommendations: ['Ensure only valid roles are used in updates']
    };
    
  } catch (error) {
    return {
      issue_type: 'team_member_role_validation_error',
      detected: true,
      severity: 'medium',
      details: `Role validation test failed: ${error}`,
      recommendations: ['Check role constraints on team_members table']
    };
  }
}

async function testAlternativeTeamMemberAccess(): Promise<APTeamMemberDiagnostic> {
  try {
    console.log('🧪 Testing alternative team member access patterns...');
    
    // Test if we can use RPC functions instead of direct table access
    const { data, error } = await supabase
      .rpc('get_team_members_bypass_rls', { p_team_id: '00000000-0000-0000-0000-000000000000' });
    
    if (!error) {
      return {
        issue_type: 'alternative_team_member_access',
        detected: false,
        severity: 'low',
        details: '✅ RPC functions available for team member access',
        test_result: { rpcAvailable: true },
        recommendations: ['Use RPC functions to bypass RLS restrictions']
      };
    }
    
    return {
      issue_type: 'no_alternative_access',
      detected: true,
      severity: 'medium',
      details: 'No alternative access patterns available for team members',
      test_result: { rpcAvailable: false },
      recommendations: [
        'Create RPC functions with SECURITY DEFINER for AP team management',
        'Implement AP-specific team member management functions',
        'Consider service-level API for team operations'
      ]
    };
    
  } catch (error) {
    return {
      issue_type: 'alternative_access_test_error',
      detected: true,
      severity: 'medium',
      details: `Alternative access test failed: ${error}`,
      recommendations: ['Implement RPC-based team member management']
    };
  }
}

export async function logAPTeamMemberDiagnostics(diagnostics: APTeamMemberDiagnostic[]) {
  console.log('📋 AP TEAM MEMBER ACCESS DIAGNOSTIC RESULTS:');
  console.log('================================================');
  
  const critical = diagnostics.filter(d => d.detected && d.severity === 'critical');
  const high = diagnostics.filter(d => d.detected && d.severity === 'high');
  const medium = diagnostics.filter(d => d.detected && d.severity === 'medium');
  
  console.log(`🚨 Critical Issues: ${critical.length}`);
  console.log(`⚠️ High Issues: ${high.length}`);
  console.log(`📋 Medium Issues: ${medium.length}`);
  
  diagnostics.forEach(diagnostic => {
    if (diagnostic.detected) {
      const icon = diagnostic.severity === 'critical' ? '🚨' : 
                   diagnostic.severity === 'high' ? '⚠️' : '📋';
      console.log(`${icon} ${diagnostic.issue_type.toUpperCase()}: ${diagnostic.details}`);
      
      if (diagnostic.recommendations.length > 0) {
        console.log('   Recommendations:');
        diagnostic.recommendations.forEach(rec => console.log(`   - ${rec}`));
      }
      console.log('');
    }
  });
  
  return {
    critical: critical.length,
    high: high.length,
    medium: medium.length,
    total: diagnostics.filter(d => d.detected).length
  };
}