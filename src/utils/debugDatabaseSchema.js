// Simple JavaScript version for browser console debugging
// Run this in the browser console to diagnose database schema issues

async function debugDatabaseSchema() {
  console.log('=== DATABASE SCHEMA DIAGNOSTIC ===');
  
  try {
    // Import supabase client (assuming it's available globally or via import)
    const { supabase } = await import('../integrations/supabase/client.ts');
    
    // Check authorized_providers table structure
    console.log('1. Checking authorized_providers table columns...');
    
    // Try to select from the table to see what columns exist
    const { data: apTest, error: apError } = await supabase
      .from('authorized_providers')
      .select('*')
      .limit(1);

    if (apError) {
      console.error('Error checking authorized_providers:', apError);
    } else {
      console.log('authorized_providers sample data:', apTest);
      if (apTest && apTest.length > 0) {
        console.log('Available columns:', Object.keys(apTest[0]));
      }
    }

    // Check if provider_name column exists
    console.log('2. Testing provider_name column access...');
    const { data: providerNameTest, error: providerNameError } = await supabase
      .from('authorized_providers')
      .select('provider_name')
      .limit(1);

    if (providerNameError) {
      console.error('❌ provider_name column missing:', providerNameError.message);
    } else {
      console.log('✅ provider_name column exists');
    }

    // Check get_ap_user_assignments function
    console.log('3. Testing get_ap_user_assignments function...');
    const { data: apAssignments, error: apAssignmentsError } = await supabase
      .rpc('get_ap_user_assignments', { p_ap_user_id: null });

    if (apAssignmentsError) {
      console.error('❌ get_ap_user_assignments function error:', apAssignmentsError.message);
      console.error('Full error:', apAssignmentsError);
    } else {
      console.log('✅ get_ap_user_assignments function works');
      console.log('Sample data structure:', apAssignments?.[0]);
    }

    // Check assign_ap_user_to_location function
    console.log('4. Testing assign_ap_user_to_location function existence...');
    const { data: functionExists, error: functionError } = await supabase
      .rpc('assign_ap_user_to_location', {
        p_ap_user_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
        p_location_id: '00000000-0000-0000-0000-000000000000',
        p_assignment_role: 'provider',
        p_end_date: null
      })
      .catch((err) => ({ data: null, error: err }));

    if (functionError) {
      console.error('❌ assign_ap_user_to_location function error:', functionError.message);
      console.error('Full error:', functionError);
    } else {
      console.log('✅ assign_ap_user_to_location function exists');
    }

    // Check ap_user_location_assignments table
    console.log('5. Testing ap_user_location_assignments table...');
    const { data: apLocationAssignments, error: apLocationError } = await supabase
      .from('ap_user_location_assignments')
      .select('*')
      .limit(1);

    if (apLocationError) {
      console.error('❌ ap_user_location_assignments table error:', apLocationError.message);
    } else {
      console.log('✅ ap_user_location_assignments table exists');
      if (apLocationAssignments && apLocationAssignments.length > 0) {
        console.log('Sample assignment data:', apLocationAssignments[0]);
      }
    }

  } catch (error) {
    console.error('Diagnostic error:', error);
  }

  console.log('=== END DIAGNOSTIC ===');
}

// Make it available globally
window.debugDatabaseSchema = debugDatabaseSchema;

console.log('Database diagnostic loaded. Run debugDatabaseSchema() in console to test.');