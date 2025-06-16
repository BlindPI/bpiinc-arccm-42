// Team Database Diagnostics - Debug the current database issues
// This script will help identify and validate the root causes of the team management errors

import { supabase } from '@/integrations/supabase/client';

interface DiagnosticResult {
  test: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  message: string;
  details?: any;
}

export async function runTeamDatabaseDiagnostics(): Promise<DiagnosticResult[]> {
  const results: DiagnosticResult[] = [];

  console.log('🔍 Starting Team Database Diagnostics...');

  // Test 1: Check if providers table exists and has data
  try {
    const { data: providers, error: providersError } = await supabase
      .from('providers')
      .select('id, name, provider_type, status')
      .limit(5);

    if (providersError) {
      results.push({
        test: 'Providers Table Access',
        status: 'FAIL',
        message: `Cannot access providers table: ${providersError.message}`,
        details: providersError
      });
    } else {
      results.push({
        test: 'Providers Table Access',
        status: 'PASS',
        message: `Providers table accessible with ${providers?.length || 0} records`,
        details: providers
      });
    }
  } catch (error) {
    results.push({
      test: 'Providers Table Access',
      status: 'FAIL',
      message: `Exception accessing providers: ${error}`,
      details: error
    });
  }

  // Test 2: Check teams table structure and foreign key relationship
  try {
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('id, name, provider_id, status, team_type, performance_score')
      .limit(5);

    if (teamsError) {
      results.push({
        test: 'Teams Table Basic Access',
        status: 'FAIL',
        message: `Cannot access teams table: ${teamsError.message}`,
        details: teamsError
      });
    } else {
      results.push({
        test: 'Teams Table Basic Access',
        status: 'PASS',
        message: `Teams table accessible with ${teams?.length || 0} records`,
        details: teams
      });
    }
  } catch (error) {
    results.push({
      test: 'Teams Table Basic Access',
      status: 'FAIL',
      message: `Exception accessing teams: ${error}`,
      details: error
    });
  }

  // Test 3: Test the problematic teams-providers join query
  try {
    const { data: teamsWithProviders, error: joinError } = await supabase
      .from('teams')
      .select(`
        id,
        name,
        provider_id,
        provider:providers(id, name, provider_type, status)
      `)
      .limit(3);

    if (joinError) {
      results.push({
        test: 'Teams-Providers Join Query',
        status: 'FAIL',
        message: `Teams-providers join failed: ${joinError.message}`,
        details: joinError
      });
    } else {
      results.push({
        test: 'Teams-Providers Join Query',
        status: 'PASS',
        message: `Teams-providers join successful with ${teamsWithProviders?.length || 0} records`,
        details: teamsWithProviders
      });
    }
  } catch (error) {
    results.push({
      test: 'Teams-Providers Join Query',
      status: 'FAIL',
      message: `Exception in teams-providers join: ${error}`,
      details: error
    });
  }

  // Test 4: Test team_members table access (check for RLS recursion)
  try {
    const { data: members, error: membersError } = await supabase
      .from('team_members')
      .select('id, team_id, user_id, role, status')
      .limit(5);

    if (membersError) {
      results.push({
        test: 'Team Members Table Access',
        status: 'FAIL',
        message: `Cannot access team_members: ${membersError.message}`,
        details: membersError
      });
    } else {
      results.push({
        test: 'Team Members Table Access',
        status: 'PASS',
        message: `Team members accessible with ${members?.length || 0} records`,
        details: members
      });
    }
  } catch (error) {
    results.push({
      test: 'Team Members Table Access',
      status: 'FAIL',
      message: `Exception accessing team_members: ${error}`,
      details: error
    });
  }

  // Test 5: Test the complex admin query that's failing
  try {
    const { data: adminTeams, error: adminError } = await supabase
      .from('teams')
      .select(`
        *,
        location:locations(id, name, address, city, state),
        provider:providers(id, name, provider_type, status),
        team_members!inner(count)
      `)
      .limit(3);

    if (adminError) {
      results.push({
        test: 'Admin Teams Complex Query',
        status: 'FAIL',
        message: `Admin teams query failed: ${adminError.message}`,
        details: adminError
      });
    } else {
      results.push({
        test: 'Admin Teams Complex Query',
        status: 'PASS',
        message: `Admin teams query successful with ${adminTeams?.length || 0} records`,
        details: adminTeams
      });
    }
  } catch (error) {
    results.push({
      test: 'Admin Teams Complex Query',
      status: 'FAIL',
      message: `Exception in admin teams query: ${error}`,
      details: error
    });
  }

  // Test 6: Test team statistics query
  try {
    const { data: teamStats, error: statsError } = await supabase
      .from('teams')
      .select('status, team_type, performance_score')
      .limit(10);

    if (statsError) {
      results.push({
        test: 'Team Statistics Query',
        status: 'FAIL',
        message: `Team statistics query failed: ${statsError.message}`,
        details: statsError
      });
    } else {
      results.push({
        test: 'Team Statistics Query',
        status: 'PASS',
        message: `Team statistics query successful with ${teamStats?.length || 0} records`,
        details: teamStats
      });
    }
  } catch (error) {
    results.push({
      test: 'Team Statistics Query',
      status: 'FAIL',
      message: `Exception in team statistics query: ${error}`,
      details: error
    });
  }

  // Test 7: Test the new RLS-safe functions
  try {
    const { data: userMemberships, error: membershipError } = await supabase
      .rpc('fetch_user_team_memberships', { 
        p_user_id: (await supabase.auth.getUser()).data.user?.id 
      });

    if (membershipError) {
      results.push({
        test: 'RLS-Safe User Memberships Function',
        status: 'FAIL',
        message: `User memberships function failed: ${membershipError.message}`,
        details: membershipError
      });
    } else {
      results.push({
        test: 'RLS-Safe User Memberships Function',
        status: 'PASS',
        message: `User memberships function successful with ${userMemberships?.length || 0} records`,
        details: userMemberships
      });
    }
  } catch (error) {
    results.push({
      test: 'RLS-Safe User Memberships Function',
      status: 'FAIL',
      message: `Exception in user memberships function: ${error}`,
      details: error
    });
  }

  // Test 8: Check current user profile and permissions
  try {
    const { data: user } = await supabase.auth.getUser();
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, display_name, email')
      .eq('id', user.user?.id)
      .single();

    if (profileError) {
      results.push({
        test: 'Current User Profile',
        status: 'FAIL',
        message: `Cannot access user profile: ${profileError.message}`,
        details: profileError
      });
    } else {
      results.push({
        test: 'Current User Profile',
        status: 'PASS',
        message: `User profile accessible - Role: ${profile?.role}`,
        details: profile
      });
    }
  } catch (error) {
    results.push({
      test: 'Current User Profile',
      status: 'FAIL',
      message: `Exception accessing user profile: ${error}`,
      details: error
    });
  }

  console.log('🔍 Team Database Diagnostics Complete');
  console.table(results.map(r => ({ 
    Test: r.test, 
    Status: r.status, 
    Message: r.message 
  })));

  return results;
}

// Helper function to run diagnostics and log results
export async function logTeamDiagnostics() {
  try {
    const results = await runTeamDatabaseDiagnostics();
    
    const failedTests = results.filter(r => r.status === 'FAIL');
    const passedTests = results.filter(r => r.status === 'PASS');
    const warningTests = results.filter(r => r.status === 'WARNING');

    console.log(`\n📊 DIAGNOSTIC SUMMARY:`);
    console.log(`✅ Passed: ${passedTests.length}`);
    console.log(`❌ Failed: ${failedTests.length}`);
    console.log(`⚠️  Warnings: ${warningTests.length}`);

    if (failedTests.length > 0) {
      console.log(`\n🚨 FAILED TESTS:`);
      failedTests.forEach(test => {
        console.log(`❌ ${test.test}: ${test.message}`);
        if (test.details) {
          console.log(`   Details:`, test.details);
        }
      });
    }

    return results;
  } catch (error) {
    console.error('🚨 Error running team diagnostics:', error);
    return [];
  }
}