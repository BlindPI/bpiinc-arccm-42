import { supabase } from '@/integrations/supabase/client';

export async function runSimpleTeamDiagnostics() {
  console.log('🔧 SIMPLE-DIAGNOSTICS: Starting team diagnostics...');
  
  const results = {
    timestamp: new Date().toISOString(),
    tests: [] as any[]
  };

  // Test 1: Direct teams table query
  try {
    console.log('🔧 Test 1: Direct teams table query...');
    const { data, error } = await supabase
      .from('teams')
      .select('id, name, status, team_type')
      .limit(10);
    
    results.tests.push({
      test: 'direct_teams_query',
      success: !error,
      error: error?.message,
      count: data?.length || 0,
      sample: data?.slice(0, 2) || []
    });
    console.log('✅ Direct query result:', { success: !error, count: data?.length || 0 });
  } catch (err: any) {
    results.tests.push({
      test: 'direct_teams_query',
      success: false,
      error: err.message,
      count: 0
    });
    console.log('❌ Direct query failed:', err.message);
  }

  // Test 2: Try get_teams_safe function
  try {
    console.log('🔧 Test 2: get_teams_safe function...');
    const { data, error } = await supabase.rpc('get_teams_safe' as any);
    
    results.tests.push({
      test: 'get_teams_safe',
      success: !error,
      error: error?.message,
      count: Array.isArray(data) ? data.length : 0,
      sample: Array.isArray(data) ? data.slice(0, 2) : data
    });
    console.log('✅ get_teams_safe result:', { success: !error, count: Array.isArray(data) ? data.length : 0 });
  } catch (err: any) {
    results.tests.push({
      test: 'get_teams_safe',
      success: false,
      error: err.message,
      count: 0
    });
    console.log('❌ get_teams_safe failed:', err.message);
  }

  // Test 3: Try get_enhanced_teams_data function
  try {
    console.log('🔧 Test 3: get_enhanced_teams_data function...');
    const { data, error } = await supabase.rpc('get_enhanced_teams_data' as any);
    
    results.tests.push({
      test: 'get_enhanced_teams_data',
      success: !error,
      error: error?.message,
      count: Array.isArray(data) ? data.length : 0,
      sample: Array.isArray(data) ? data.slice(0, 2) : data
    });
    console.log('✅ get_enhanced_teams_data result:', { success: !error, count: Array.isArray(data) ? data.length : 0 });
  } catch (err: any) {
    results.tests.push({
      test: 'get_enhanced_teams_data',
      success: false,
      error: err.message,
      count: 0
    });
    console.log('❌ get_enhanced_teams_data failed:', err.message);
  }

  // Test 4: Try get_team_statistics_safe function
  try {
    console.log('🔧 Test 4: get_team_statistics_safe function...');
    const { data, error } = await supabase.rpc('get_team_statistics_safe' as any);
    
    results.tests.push({
      test: 'get_team_statistics_safe',
      success: !error,
      error: error?.message,
      data: data
    });
    console.log('✅ get_team_statistics_safe result:', { success: !error, data });
  } catch (err: any) {
    results.tests.push({
      test: 'get_team_statistics_safe',
      success: false,
      error: err.message
    });
    console.log('❌ get_team_statistics_safe failed:', err.message);
  }

  // Analysis
  const directQuery = results.tests.find(t => t.test === 'direct_teams_query');
  const adminFunction = results.tests.find(t => t.test === 'get_teams_safe');
  const enterpriseFunction = results.tests.find(t => t.test === 'get_enhanced_teams_data');
  const statsFunction = results.tests.find(t => t.test === 'get_team_statistics_safe');

  const analysis = {
    summary: {
      directQueryWorks: directQuery?.success || false,
      adminFunctionWorks: adminFunction?.success || false,
      enterpriseFunctionWorks: enterpriseFunction?.success || false,
      statsFunctionWorks: statsFunction?.success || false
    },
    counts: {
      directCount: directQuery?.count || 0,
      adminCount: adminFunction?.count || 0,
      enterpriseCount: enterpriseFunction?.count || 0,
      statsTotal: statsFunction?.data?.[0]?.total_teams || 0
    },
    diagnosis: ''
  };

  // Generate diagnosis
  if (analysis.summary.directQueryWorks && !analysis.summary.adminFunctionWorks) {
    analysis.diagnosis = 'CONFIRMED: Teams exist in database but get_teams_safe function is failing. This explains the admin dashboard issue.';
  } else if (analysis.summary.enterpriseFunctionWorks && !analysis.summary.adminFunctionWorks) {
    analysis.diagnosis = 'CONFIRMED: Enterprise function works but admin function fails. Different database functions have different success rates.';
  } else if (analysis.counts.statsTotal > 0 && analysis.counts.adminCount === 0) {
    analysis.diagnosis = 'CONFIRMED: Statistics show teams exist but admin function returns empty. RLS or permission issue.';
  } else {
    analysis.diagnosis = 'UNCLEAR: Need more investigation to determine root cause.';
  }

  console.log('🔧 DIAGNOSTICS COMPLETE:', { results, analysis });
  return { results, analysis };
}