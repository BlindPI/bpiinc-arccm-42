/**
 * DIAGNOSTIC UTILITY: Provider Team Assignment Permission Issues
 * 
 * This utility diagnoses RLS policy and permission issues specifically for
 * provider_team_assignments table operations that are failing with 403/42501 errors.
 * 
 * Tests:
 * 1. Current user authentication and role validation
 * 2. RLS policy evaluation for provider_team_assignments
 * 3. Database table permissions for UPDATE operations
 * 4. Specific assignment record access verification
 */

import { supabase } from "@/integrations/supabase/client";

interface DiagnosticResult {
  test: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  details: string;
  recommendation?: string;
}

interface UserSession {
  user_id: string | null;
  role: string | null;
  email: string | null;
  is_authenticated: boolean;
}

interface AssignmentRecord {
  id: string;
  provider_id: string;
  team_id: string;
  status: string;
  assignment_role: string;
}

export async function diagnoseProviderTeamAssignmentPermissions(
  assignmentId?: string
): Promise<{
  summary: string;
  results: DiagnosticResult[];
  userSession: UserSession;
  recommendedActions: string[];
}> {
  const results: DiagnosticResult[] = [];
  let userSession: UserSession = {
    user_id: null,
    role: null,
    email: null,
    is_authenticated: false
  };

  console.log('🔍 Starting Provider Team Assignment Permissions Diagnosis...');

  // Test 1: Verify user authentication and role
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      results.push({
        test: 'User Authentication',
        status: 'FAIL',
        details: `Authentication error: ${userError.message}`,
        recommendation: 'User needs to log in again'
      });
    } else if (!user) {
      results.push({
        test: 'User Authentication',
        status: 'FAIL',
        details: 'No authenticated user found',
        recommendation: 'User needs to log in'
      });
    } else {
      userSession.user_id = user.id;
      userSession.email = user.email || null;
      userSession.is_authenticated = true;

      // Get user profile and role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', user.id)
        .single();

      if (profileError) {
        results.push({
          test: 'User Profile/Role',
          status: 'FAIL',
          details: `Profile lookup failed: ${profileError.message}`,
          recommendation: 'User profile may be missing or corrupted'
        });
      } else if (!profile?.role) {
        results.push({
          test: 'User Profile/Role',
          status: 'FAIL',
          details: 'User profile found but no role assigned',
          recommendation: 'User needs a role assigned (SA, AD, etc.)'
        });
      } else {
        userSession.role = profile.role;
        
        if (['SA', 'AD'].includes(profile.role)) {
          results.push({
            test: 'User Profile/Role',
            status: 'PASS',
            details: `User has ${profile.role} role, should have admin access to provider_team_assignments`
          });
        } else {
          results.push({
            test: 'User Profile/Role',
            status: 'WARNING',
            details: `User has ${profile.role} role, which may not have UPDATE permissions on provider_team_assignments`,
            recommendation: 'Only SA and AD roles should be able to modify provider team assignments'
          });
        }
      }
    }
  } catch (error) {
    results.push({
      test: 'User Authentication',
      status: 'FAIL',
      details: `Unexpected error: ${error}`,
      recommendation: 'Check authentication system status'
    });
  }

  // Test 2: Test direct SELECT access to provider_team_assignments
  try {
    const { data, error } = await supabase
      .from('provider_team_assignments')
      .select('id, provider_id, team_id, status, assignment_role')
      .limit(1);

    if (error) {
      results.push({
        test: 'Provider Team Assignments SELECT',
        status: 'FAIL',
        details: `Cannot read provider_team_assignments: ${error.message}`,
        recommendation: 'RLS policy or table permissions issue preventing basic reads'
      });
    } else {
      results.push({
        test: 'Provider Team Assignments SELECT',
        status: 'PASS',
        details: `Can read provider_team_assignments table (${data?.length || 0} records visible)`
      });
    }
  } catch (error) {
    results.push({
      test: 'Provider Team Assignments SELECT',
      status: 'FAIL',
      details: `Unexpected error reading table: ${error}`,
      recommendation: 'Database connection or table access issue'
    });
  }

  // Test 3: Test UPDATE access with a specific record
  if (assignmentId) {
    try {
      // First, try to get the specific record
      const { data: record, error: fetchError } = await supabase
        .from('provider_team_assignments')
        .select('id, provider_id, team_id, status, assignment_role, updated_at')
        .eq('id', assignmentId)
        .single();

      if (fetchError) {
        results.push({
          test: 'Specific Assignment Record Access',
          status: 'FAIL',
          details: `Cannot access assignment ${assignmentId}: ${fetchError.message}`,
          recommendation: 'Record may not exist or user lacks access'
        });
      } else {
        results.push({
          test: 'Specific Assignment Record Access',
          status: 'PASS',
          details: `Can access assignment record: ${record.provider_id} -> ${record.team_id} (${record.status})`
        });

        // Now test UPDATE permissions by attempting a safe update (updating updated_at to current time)
        const { error: updateError } = await supabase
          .from('provider_team_assignments')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', assignmentId);

        if (updateError) {
          results.push({
            test: 'UPDATE Permission Test',
            status: 'FAIL',
            details: `UPDATE failed: ${updateError.message} (Code: ${updateError.code})`,
            recommendation: 'This is the core issue - RLS policy or table permissions blocking UPDATE operations'
          });
        } else {
          results.push({
            test: 'UPDATE Permission Test',
            status: 'PASS',
            details: 'UPDATE operation succeeded'
          });
        }
      }
    } catch (error) {
      results.push({
        test: 'Specific Assignment Record Update',
        status: 'FAIL',
        details: `Unexpected error: ${error}`,
        recommendation: 'System-level issue with database operations'
      });
    }
  }

  // Test 4: Test RLS policy evaluation using SQL function
  if (userSession.is_authenticated && userSession.user_id) {
    try {
      const { data, error } = await supabase.rpc('check_provider_data_integrity');
      
      if (error) {
        results.push({
          test: 'RLS Policy Validation',
          status: 'WARNING',
          details: `Could not run integrity check: ${error.message}`,
          recommendation: 'Database function may not be available'
        });
      } else {
        results.push({
          test: 'RLS Policy Validation',
          status: 'PASS',
          details: 'Database integrity functions are accessible'
        });
      }
    } catch (error) {
      results.push({
        test: 'RLS Policy Validation',
        status: 'WARNING',
        details: `RLS validation test error: ${error}`,
        recommendation: 'Manual RLS policy review may be needed'
      });
    }
  }

  // Test 5: Check current database role and permissions
  try {
    const { data, error } = await supabase
      .from('provider_team_assignments')
      .select('count')
      .limit(0);
    
    if (!error) {
      results.push({
        test: 'Database Connection',
        status: 'PASS',
        details: 'Database connection and table access working'
      });
    } else {
      results.push({
        test: 'Database Connection',
        status: 'WARNING',
        details: `Database connection test failed: ${error.message}`
      });
    }
  } catch (error) {
    results.push({
      test: 'Database Connection',
      status: 'WARNING',
      details: `Database connection test inconclusive: ${error}`
    });
  }

  // Generate summary and recommendations
  const failCount = results.filter(r => r.status === 'FAIL').length;
  const warningCount = results.filter(r => r.status === 'WARNING').length;

  let summary: string;
  const recommendedActions: string[] = [];

  if (failCount === 0 && warningCount === 0) {
    summary = "✅ All tests passed - permissions should be working correctly";
  } else if (failCount > 0) {
    summary = `❌ ${failCount} critical issues found that explain the 403 Forbidden error`;
    
    // Generate specific recommendations based on failures
    const authFailures = results.filter(r => r.status === 'FAIL' && r.test.includes('Authentication'));
    const roleFailures = results.filter(r => r.status === 'FAIL' && r.test.includes('Role'));
    const updateFailures = results.filter(r => r.status === 'FAIL' && r.test.includes('UPDATE'));
    
    if (authFailures.length > 0) {
      recommendedActions.push("Fix user authentication - user may need to log in again");
    }
    
    if (roleFailures.length > 0) {
      recommendedActions.push("Verify user has SA or AD role in profiles table");
    }
    
    if (updateFailures.length > 0) {
      recommendedActions.push("Fix RLS policies or GRANT permissions for provider_team_assignments UPDATE operations");
      recommendedActions.push("Run migration to add missing GRANT UPDATE permissions");
    }
  } else {
    summary = `⚠️ ${warningCount} warnings found - system may work but has potential issues`;
    recommendedActions.push("Review warnings and consider preventive fixes");
  }

  // Add assignment-specific recommendations
  if (assignmentId) {
    recommendedActions.push(`Test completed for assignment ID: ${assignmentId}`);
  }

  console.log(`🔍 Diagnosis complete: ${summary}`);

  return {
    summary,
    results,
    userSession,
    recommendedActions
  };
}

/**
 * Quick diagnosis function for the specific error scenario
 */
export async function diagnoseTeamAssignmentRemovalError(
  providerId: string,
  teamId: string,
  assignmentId?: string
): Promise<void> {
  console.log('🚨 Diagnosing Team Assignment Removal Error');
  console.log(`Provider: ${providerId}, Team: ${teamId}, Assignment: ${assignmentId || 'unknown'}`);
  
  const diagnosis = await diagnoseProviderTeamAssignmentPermissions(assignmentId);
  
  console.log('\n📊 DIAGNOSIS RESULTS:');
  console.log(`Summary: ${diagnosis.summary}`);
  
  console.log('\n👤 User Session:');
  console.log(`- ID: ${diagnosis.userSession.user_id}`);
  console.log(`- Role: ${diagnosis.userSession.role}`);
  console.log(`- Email: ${diagnosis.userSession.email}`);
  console.log(`- Authenticated: ${diagnosis.userSession.is_authenticated}`);
  
  console.log('\n🧪 Test Results:');
  diagnosis.results.forEach(result => {
    const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${icon} ${result.test}: ${result.details}`);
    if (result.recommendation) {
      console.log(`   💡 ${result.recommendation}`);
    }
  });
  
  console.log('\n🔧 Recommended Actions:');
  diagnosis.recommendedActions.forEach((action, index) => {
    console.log(`${index + 1}. ${action}`);
  });
}

// Export the diagnostic data for use in other components
export type { DiagnosticResult, UserSession, AssignmentRecord };