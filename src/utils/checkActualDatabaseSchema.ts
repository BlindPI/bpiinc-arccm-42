import { supabase } from '@/integrations/supabase/client';

export async function checkActualDatabaseSchema() {
  console.log('=== CHECKING ACTUAL DATABASE SCHEMA ===');
  
  try {
    // Check if certificates table exists
    console.log('1. Checking certificates table...');
    const { data: certificatesData, error: certificatesError } = await supabase
      .from('certificates')
      .select('*')
      .limit(1);

    if (certificatesError) {
      console.error('❌ certificates table error:', certificatesError.message);
    } else {
      console.log('✅ certificates table exists');
      if (certificatesData && certificatesData.length > 0) {
        console.log('certificates columns:', Object.keys(certificatesData[0]));
      }
    }

    // Check if courses table exists
    console.log('2. Checking courses table...');
    const { data: coursesData, error: coursesError } = await supabase
      .from('courses')
      .select('*')
      .limit(1);

    if (coursesError) {
      console.error('❌ courses table error:', coursesError.message);
    } else {
      console.log('✅ courses table exists');
      if (coursesData && coursesData.length > 0) {
        console.log('courses columns:', Object.keys(coursesData[0]));
      }
    }

    // Check team_members table structure
    console.log('3. Checking team_members table...');
    const { data: teamMembersData, error: teamMembersError } = await supabase
      .from('team_members')
      .select('*')
      .limit(1);

    if (teamMembersError) {
      console.error('❌ team_members table error:', teamMembersError.message);
    } else {
      console.log('✅ team_members table exists');
      if (teamMembersData && teamMembersData.length > 0) {
        console.log('team_members columns:', Object.keys(teamMembersData[0]));
      }
    }

    // Check teams table structure
    console.log('4. Checking teams table...');
    const { data: teamsData, error: teamsError } = await supabase
      .from('teams')
      .select('*')
      .limit(1);

    if (teamsError) {
      console.error('❌ teams table error:', teamsError.message);
    } else {
      console.log('✅ teams table exists');
      if (teamsData && teamsData.length > 0) {
        console.log('teams columns:', Object.keys(teamsData[0]));
      }
    }

    // Check authorized_providers table structure
    console.log('5. Checking authorized_providers table...');
    const { data: apData, error: apError } = await supabase
      .from('authorized_providers')
      .select('*')
      .limit(1);

    if (apError) {
      console.error('❌ authorized_providers table error:', apError.message);
    } else {
      console.log('✅ authorized_providers table exists');
      if (apData && apData.length > 0) {
        console.log('authorized_providers columns:', Object.keys(apData[0]));
      }
    }

    // Test the problematic functions
    console.log('6. Testing get_provider_location_kpis function...');
    // Get a real provider ID from the database instead of using hardcoded integer
    const { data: providers } = await supabase
      .from('authorized_providers')
      .select('id')
      .limit(1);
    
    if (!providers || providers.length === 0) {
      console.log('No providers found in database - skipping KPI test');
      return;
    }
    
    const providerId = providers[0].id;
    console.log('Testing with provider ID:', providerId);
    
    const { data: kpisData, error: kpisError } = await supabase
      .rpc('get_provider_location_kpis', { p_provider_id: providerId });

    if (kpisError) {
      console.error('❌ get_provider_location_kpis error:', kpisError);
    } else {
      console.log('✅ get_provider_location_kpis works:', kpisData);
    }

    console.log('7. Testing get_provider_location_teams function...');
    const { data: teamsKpiData, error: teamsKpiError } = await supabase
      .rpc('get_provider_location_teams', { p_provider_id: providerId });

    if (teamsKpiError) {
      console.error('❌ get_provider_location_teams error:', teamsKpiError);
    } else {
      console.log('✅ get_provider_location_teams works:', teamsKpiData);
    }

  } catch (error) {
    console.error('Schema check error:', error);
  }

  console.log('=== END SCHEMA CHECK ===');
}

// Auto-run
checkActualDatabaseSchema();