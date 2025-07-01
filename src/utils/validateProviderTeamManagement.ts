import { supabase } from '@/integrations/supabase/client';

export async function validateProviderTeamManagement() {
  console.log('🔍 Validating Provider Team Management Setup...\n');
  
  // Test 1: Check if ap_user_location_assignments table exists
  console.log('1. Testing ap_user_location_assignments table...');
  try {
    const { data, error } = await supabase
      .from('ap_user_location_assignments' as any)
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ ap_user_location_assignments table does NOT exist');
      console.log('   Error:', error.message);
    } else {
      console.log('✅ ap_user_location_assignments table exists');
      console.log('   Records found:', data?.length || 0);
    }
  } catch (err: any) {
    console.log('❌ ap_user_location_assignments table access failed');
    console.log('   Error:', err.message);
  }

  // Test 2: Check if get_ap_user_assignments function exists
  console.log('\n2. Testing get_ap_user_assignments function...');
  try {
    const { data, error } = await supabase
      .rpc('get_ap_user_assignments', { p_ap_user_id: null });
    
    if (error) {
      console.log('❌ get_ap_user_assignments function does NOT exist');
      console.log('   Error:', error.message);
    } else {
      console.log('✅ get_ap_user_assignments function exists');
      console.log('   Records returned:', data?.length || 0);
    }
  } catch (err: any) {
    console.log('❌ get_ap_user_assignments function call failed');
    console.log('   Error:', err.message);
  }

  // Test 3: Check if provider_team_assignments table exists and has data
  console.log('\n3. Testing provider_team_assignments table...');
  try {
    const { data, error } = await supabase
      .from('provider_team_assignments')
      .select('*')
      .limit(5);
    
    if (error) {
      console.log('❌ provider_team_assignments table access failed');
      console.log('   Error:', error.message);
    } else {
      console.log('✅ provider_team_assignments table exists');
      console.log('   Records found:', data?.length || 0);
    }
  } catch (err: any) {
    console.log('❌ provider_team_assignments table error');
    console.log('   Error:', err.message);
  }

  // Test 4: Check if we have AP users
  console.log('\n4. Testing AP users availability...');
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, email, role')
      .eq('role', 'AP')
      .eq('status', 'ACTIVE');
    
    if (error) {
      console.log('❌ Failed to fetch AP users');
      console.log('   Error:', error.message);
    } else {
      console.log('✅ AP users query successful');
      console.log('   AP users found:', data?.length || 0);
      if (data && data.length > 0) {
        console.log('   Sample AP user:', data[0].display_name, '(' + data[0].email + ')');
      }
    }
  } catch (err: any) {
    console.log('❌ AP users query error');
    console.log('   Error:', err.message);
  }

  // Test 5: Check if we have teams
  console.log('\n5. Testing teams availability...');
  try {
    const { data, error } = await supabase
      .from('teams')
      .select('id, name, status, location_id')
      .eq('status', 'active');
    
    if (error) {
      console.log('❌ Failed to fetch teams');
      console.log('   Error:', error.message);
    } else {
      console.log('✅ Teams query successful');
      console.log('   Active teams found:', data?.length || 0);
      if (data && data.length > 0) {
        console.log('   Sample team:', data[0].name);
      }
    }
  } catch (err: any) {
    console.log('❌ Teams query error');
    console.log('   Error:', err.message);
  }

  // Test 6: Check if assign_provider_to_team function exists
  console.log('\n6. Testing assign_provider_to_team function...');
  try {
    // Just test if function exists by calling with invalid params
    const { data, error } = await supabase
      .rpc('assign_provider_to_team', {
        p_provider_id: '00000000-0000-0000-0000-000000000000',
        p_team_id: '00000000-0000-0000-0000-000000000000',
        p_assignment_role: 'test',
        p_oversight_level: 'test'
      });
    
    if (error && error.message.includes('does not exist')) {
      console.log('❌ assign_provider_to_team function does NOT exist');
    } else {
      console.log('✅ assign_provider_to_team function exists');
      console.log('   (Expected validation error for test params)');
    }
  } catch (err: any) {
    if (err.message.includes('does not exist')) {
      console.log('❌ assign_provider_to_team function does NOT exist');
    } else {
      console.log('✅ assign_provider_to_team function exists');
      console.log('   (Expected validation error for test params)');
    }
  }

  console.log('\n📊 Validation Complete!');
  console.log('\n🔧 DIAGNOSIS:');
  console.log('If you see ❌ for tables/functions, the database migration needs to be applied.');
  console.log('If you see ✅ but 0 records, you need sample data.');
  console.log('\n💡 NEXT STEPS:');
  console.log('1. Apply the database migration: npx supabase db push');
  console.log('2. Check the browser console for any runtime errors');
  console.log('3. Verify the Provider Team Management components load correctly');
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  (window as any).validateProviderTeamManagement = validateProviderTeamManagement;
}