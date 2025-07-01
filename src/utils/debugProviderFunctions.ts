import { supabase } from '@/integrations/supabase/client';

export async function debugProviderFunctions() {
  console.log('🔍 Debugging Provider Location Functions...');
  
  try {
    // Check what functions exist in the database
    const { data: functions, error: funcError } = await supabase
      .from('pg_proc')
      .select(`
        proname,
        proargtypes,
        pronargs,
        proargnames,
        proargmodes
      `)
      .ilike('proname', '%provider_location%');

    if (funcError) {
      console.error('❌ Error querying pg_proc:', funcError);
    } else {
      console.log('📋 Found functions:', functions);
    }

    // Test calling the functions with different parameter types
    console.log('\n🧪 Testing function calls...');
    
    // Test with integer parameter
    try {
      console.log('Testing get_provider_location_kpis with INTEGER parameter...');
      const { data: kpisInt, error: kpisIntError } = await supabase.rpc('get_provider_location_kpis', {
        p_provider_id: 1
      });
      console.log('✅ INTEGER call successful:', { data: kpisInt, error: kpisIntError });
    } catch (error) {
      console.log('❌ INTEGER call failed:', error);
    }

    // Test with string parameter (should fail)
    try {
      console.log('Testing get_provider_location_kpis with STRING parameter...');
      const { data: kpisStr, error: kpisStrError } = await supabase.rpc('get_provider_location_kpis', {
        p_provider_id: '1'
      });
      console.log('✅ STRING call result:', { data: kpisStr, error: kpisStrError });
    } catch (error) {
      console.log('❌ STRING call failed:', error);
    }

    // Test teams function
    try {
      console.log('Testing get_provider_location_teams with INTEGER parameter...');
      const { data: teamsInt, error: teamsIntError } = await supabase.rpc('get_provider_location_teams', {
        p_provider_id: 1
      });
      console.log('✅ Teams INTEGER call result:', { data: teamsInt, error: teamsIntError });
    } catch (error) {
      console.log('❌ Teams INTEGER call failed:', error);
    }

    // Check if there are multiple function definitions
    console.log('\n🔍 Checking for function overloads...');
    const { data: overloads, error: overloadError } = await supabase
      .rpc('sql', {
        query: `
          SELECT 
            p.proname,
            p.pronargs,
            pg_get_function_arguments(p.oid) as arguments,
            pg_get_function_result(p.oid) as return_type
          FROM pg_proc p
          WHERE p.proname IN ('get_provider_location_kpis', 'get_provider_location_teams')
          ORDER BY p.proname, p.pronargs;
        `
      });

    if (overloadError) {
      console.error('❌ Error checking overloads:', overloadError);
    } else {
      console.log('📊 Function overloads found:', overloads);
    }

  } catch (error) {
    console.error('💥 Debug script error:', error);
  }
}

// Auto-run when imported
debugProviderFunctions();