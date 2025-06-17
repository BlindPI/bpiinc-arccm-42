import { supabase } from '@/integrations/supabase/client';

export async function debugDatabaseSchema() {
  console.log('=== DATABASE SCHEMA DIAGNOSTIC ===');
  
  try {
    // Check authorized_providers table structure
    console.log('1. Checking authorized_providers table columns...');
    const { data: apColumns, error: apError } = await supabase
      .rpc('get_table_columns', { table_name: 'authorized_providers' })
      .catch(() => {
        // Fallback: Try to select from the table to see what columns exist
        return supabase
          .from('authorized_providers')
          .select('*')
          .limit(1);
      });

    if (apError) {
      console.error('Error checking authorized_providers:', apError);
    } else {
      console.log('authorized_providers columns:', apColumns);
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
    }

  } catch (error) {
    console.error('Diagnostic error:', error);
  }

  console.log('=== END DIAGNOSTIC ===');
}

// Auto-run diagnostic
debugDatabaseSchema();