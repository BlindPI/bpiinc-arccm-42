// Simple CRM Diagnostics for Browser Console Testing
// Run this in browser console: window.crmDiagnostics()

window.crmDiagnostics = async function() {
  console.log('🔧 CRM DIAGNOSTICS: Starting simple audit...');
  
  const results = {
    timestamp: new Date().toISOString(),
    tables: {},
    navigation: {},
    auth: {}
  };
  
  // Get supabase client from window
  const supabase = window.supabase || (window.React && window.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED?.ReactCurrentOwner?.current?.memoizedProps?.supabase);
  
  if (!supabase) {
    console.error('🔧 CRM DIAGNOSTICS: Cannot find Supabase client');
    return results;
  }
  
  console.log('🔧 CRM DIAGNOSTICS: Found Supabase client');
  
  // Test CRM tables
  const tables = [
    'crm_leads',
    'crm_opportunities', 
    'crm_activities',
    'crm_tasks',
    'crm_pipeline_stages',
    'crm_contacts',
    'crm_accounts',
    'crm_revenue_records',
    'crm_email_campaigns'
  ];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('id')
        .limit(1);
      
      if (error) {
        console.error(`🔧 CRM DIAGNOSTICS: ${table} ERROR:`, error.message);
        results.tables[table] = { status: 'error', message: error.message };
      } else {
        console.log(`🔧 CRM DIAGNOSTICS: ${table} OK`);
        results.tables[table] = { status: 'ok', count: data?.length || 0 };
      }
    } catch (err) {
      console.error(`🔧 CRM DIAGNOSTICS: ${table} EXCEPTION:`, err);
      results.tables[table] = { status: 'exception', message: err.toString() };
    }
  }
  
  // Test auth
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      results.auth = { status: 'error', message: error.message };
    } else if (user) {
      results.auth = { status: 'authenticated', userId: user.id };
      
      // Get user profile
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          results.auth.role = profile.role;
          console.log('🔧 CRM DIAGNOSTICS: User role:', profile.role);
        }
      } catch (err) {
        console.error('🔧 CRM DIAGNOSTICS: Cannot get profile:', err);
      }
    } else {
      results.auth = { status: 'not_authenticated' };
    }
  } catch (err) {
    results.auth = { status: 'exception', message: err.toString() };
  }
  
  // Test navigation config
  try {
    const { data: configs } = await supabase
      .from('system_configurations')
      .select('*')
      .eq('category', 'navigation');
    
    results.navigation.configCount = configs?.length || 0;
    
    if (configs && configs.length > 0) {
      const masterConfig = configs.find(c => c.key === 'visibility');
      if (masterConfig && results.auth.role) {
        const roleConfig = masterConfig.value?.[results.auth.role];
        if (roleConfig?.CRM) {
          results.navigation.crmEnabled = roleConfig.CRM.enabled;
          results.navigation.crmItems = Object.keys(roleConfig.CRM.items || {});
        }
      }
    }
  } catch (err) {
    console.error('🔧 CRM DIAGNOSTICS: Navigation config error:', err);
    results.navigation.error = err.toString();
  }
  
  console.log('🔧 CRM DIAGNOSTICS: Complete results:', results);
  
  // Summary
  const tableCount = Object.keys(results.tables).length;
  const okTables = Object.values(results.tables).filter(t => t.status === 'ok').length;
  const errorTables = Object.values(results.tables).filter(t => t.status === 'error').length;
  
  console.log(`🔧 CRM DIAGNOSTICS SUMMARY:`);
  console.log(`  Tables: ${okTables}/${tableCount} OK, ${errorTables} errors`);
  console.log(`  Auth: ${results.auth.status} (Role: ${results.auth.role || 'unknown'})`);
  console.log(`  Navigation: ${results.navigation.configCount} configs, CRM enabled: ${results.navigation.crmEnabled}`);
  
  return results;
};

// Auto-run if in browser
if (typeof window !== 'undefined') {
  console.log('🔧 CRM DIAGNOSTICS: Script loaded. Run window.crmDiagnostics() to test.');
}