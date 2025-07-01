import { supabase } from '@/integrations/supabase/client';

export async function diagnoseDatabaseTeamIssues() {
  console.log('🔧 TEAM-DIAGNOSTICS: Starting comprehensive team database diagnostics...');
  
  const results = {
    timestamp: new Date().toISOString(),
    adminTeamFunction: null as any,
    enterpriseTeamFunction: null as any,
    directTeamsQuery: null as any,
    statisticsFunction: null as any,
    userContext: null as any,
    errors: [] as string[]
  };

  try {
    // Test user context
    const { data: { user } } = await supabase.auth.getUser();
    results.userContext = {
      userId: user?.id,
      email: user?.email,
      role: user?.user_metadata?.role
    };
    console.log('🔧 TEAM-DIAGNOSTICS: User context:', results.userContext);

    // Test admin team function (get_teams_safe)
    try {
      console.log('🔧 TEAM-DIAGNOSTICS: Testing get_teams_safe function...');
      const { data: adminData, error: adminError } = await supabase.rpc('get_teams_safe' as any, { p_user_id: null });
      results.adminTeamFunction = {
        success: !adminError,
        error: adminError?.message,
        dataCount: Array.isArray(adminData) ? adminData.length : 0,
        sampleData: Array.isArray(adminData) ? adminData.slice(0, 2) : []
      };
      console.log('🔧 TEAM-DIAGNOSTICS: Admin function result:', results.adminTeamFunction);
    } catch (error: any) {
      results.adminTeamFunction = { success: false, error: error.message };
      results.errors.push(`Admin function error: ${error.message}`);
    }

    // Test enterprise team function (get_enhanced_teams_data)
    try {
      console.log('🔧 TEAM-DIAGNOSTICS: Testing get_enhanced_teams_data function...');
      const { data: enterpriseData, error: enterpriseError } = await supabase.rpc('get_enhanced_teams_data' as any);
      results.enterpriseTeamFunction = {
        success: !enterpriseError,
        error: enterpriseError?.message,
        dataCount: Array.isArray(enterpriseData) ? enterpriseData.length : 0,
        sampleData: Array.isArray(enterpriseData) ? enterpriseData.slice(0, 2) : []
      };
      console.log('🔧 TEAM-DIAGNOSTICS: Enterprise function result:', results.enterpriseTeamFunction);
    } catch (error: any) {
      results.enterpriseTeamFunction = { success: false, error: error.message };
      results.errors.push(`Enterprise function error: ${error.message}`);
    }

    // Test direct teams table query
    try {
      console.log('🔧 TEAM-DIAGNOSTICS: Testing direct teams table query...');
      const { data: directData, error: directError } = await supabase
        .from('teams')
        .select('id, name, status, team_type, created_at')
        .limit(5);
      results.directTeamsQuery = {
        success: !directError,
        error: directError?.message,
        dataCount: directData?.length || 0,
        sampleData: directData || []
      };
      console.log('🔧 TEAM-DIAGNOSTICS: Direct query result:', results.directTeamsQuery);
    } catch (error: any) {
      results.directTeamsQuery = { success: false, error: error.message };
      results.errors.push(`Direct query error: ${error.message}`);
    }

    // Test statistics function
    try {
      console.log('🔧 TEAM-DIAGNOSTICS: Testing get_team_statistics_safe function...');
      const { data: statsData, error: statsError } = await supabase.rpc('get_team_statistics_safe' as any);
      results.statisticsFunction = {
        success: !statsError,
        error: statsError?.message,
        data: statsData
      };
      console.log('🔧 TEAM-DIAGNOSTICS: Statistics function result:', results.statisticsFunction);
    } catch (error: any) {
      results.statisticsFunction = { success: false, error: error.message };
      results.errors.push(`Statistics function error: ${error.message}`);
    }

  } catch (error: any) {
    results.errors.push(`General error: ${error.message}`);
    console.error('🔧 TEAM-DIAGNOSTICS: General error:', error);
  }

  console.log('🔧 TEAM-DIAGNOSTICS: Complete diagnostic results:', results);
  return results;
}

export async function testTeamDataConsistency() {
  console.log('🔧 TEAM-CONSISTENCY: Testing data consistency between different methods...');
  
  const results = await diagnoseDatabaseTeamIssues();
  
  const analysis = {
    functionsExist: {
      adminFunction: results.adminTeamFunction?.success || false,
      enterpriseFunction: results.enterpriseTeamFunction?.success || false,
      statisticsFunction: results.statisticsFunction?.success || false
    },
    dataConsistency: {
      adminCount: results.adminTeamFunction?.dataCount || 0,
      enterpriseCount: results.enterpriseTeamFunction?.dataCount || 0,
      directCount: results.directTeamsQuery?.dataCount || 0,
      statisticsCount: results.statisticsFunction?.data?.[0]?.total_teams || 0
    },
    recommendation: ''
  };

  // Analyze the results
  if (!analysis.functionsExist.adminFunction && analysis.functionsExist.enterpriseFunction) {
    analysis.recommendation = 'CRITICAL: Admin function (get_teams_safe) is failing while Enterprise function works. This explains why admin dashboard shows statistics but no teams.';
  } else if (analysis.dataConsistency.statisticsCount > 0 && analysis.dataConsistency.adminCount === 0) {
    analysis.recommendation = 'ISSUE: Statistics show teams exist but admin function returns empty. Likely RLS or permission issue.';
  } else if (analysis.dataConsistency.enterpriseCount > analysis.dataConsistency.adminCount) {
    analysis.recommendation = 'DISCREPANCY: Enterprise function returns more teams than admin function. Different access patterns or RLS policies.';
  } else {
    analysis.recommendation = 'DATA CONSISTENT: All functions return similar counts. Issue may be in UI layer.';
  }

  console.log('🔧 TEAM-CONSISTENCY: Analysis complete:', analysis);
  return { results, analysis };
}