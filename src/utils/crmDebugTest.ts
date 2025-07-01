import { supabase } from '@/integrations/supabase/client';

export async function testCRMLeadInsert() {
  console.log('🔍 Testing CRM Lead Insert...');
  
  try {
    // Test 1: Check if table exists and is accessible
    console.log('Test 1: Checking table access...');
    const { data: tableCheck, error: tableError } = await supabase
      .from('crm_leads')
      .select('id')
      .limit(1);
    
    if (tableError) {
      console.error('❌ Table access failed:', tableError);
      return { success: false, error: 'Table access failed', details: tableError };
    }
    console.log('✅ Table access successful');

    // Test 2: Check current user
    console.log('Test 2: Checking current user...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('❌ User check failed:', userError);
      return { success: false, error: 'User authentication failed', details: userError };
    }
    console.log('✅ User authenticated:', user.id);

    // Test 3: Check user profile and role
    console.log('Test 3: Checking user profile...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, display_name')
      .eq('id', user.id)
      .single();
    
    if (profileError) {
      console.error('❌ Profile check failed:', profileError);
      return { success: false, error: 'Profile access failed', details: profileError };
    }
    console.log('✅ User profile found:', profile);

    // Test 4: Try minimal insert with only required fields
    console.log('Test 4: Testing minimal insert...');
    const minimalLead = {
      email: `test-${Date.now()}@example.com`, // Required field
      lead_status: 'new',
      lead_source: 'website',
      lead_type: 'individual' // Required field
    };

    const { data: insertData, error: insertError } = await supabase
      .from('crm_leads')
      .insert(minimalLead)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Minimal insert failed:', insertError);
      return { 
        success: false, 
        error: 'Insert failed', 
        details: insertError,
        errorCode: insertError.code,
        errorMessage: insertError.message
      };
    }

    console.log('✅ Minimal insert successful:', insertData);

    // Test 5: Clean up - delete the test record
    console.log('Test 5: Cleaning up test record...');
    const { error: deleteError } = await supabase
      .from('crm_leads')
      .delete()
      .eq('id', insertData.id);

    if (deleteError) {
      console.warn('⚠️ Cleanup failed (test record may remain):', deleteError);
    } else {
      console.log('✅ Cleanup successful');
    }

    return { 
      success: true, 
      message: 'All CRM tests passed',
      testRecord: insertData
    };

  } catch (error) {
    console.error('❌ Unexpected error during CRM test:', error);
    return { 
      success: false, 
      error: 'Unexpected error', 
      details: error 
    };
  }
}

export async function testCRMFullInsert() {
  console.log('🔍 Testing CRM Full Lead Insert (matching frontend service)...');
  
  try {
    const fullLead = {
      first_name: 'Test',
      last_name: 'User',
      email: `test-full-${Date.now()}@example.com`,
      phone: '+1-555-0123',
      company_name: 'Test Company',
      job_title: 'Test Manager',
      lead_status: 'new',
      lead_source: 'website',
      lead_score: 50,
      assigned_to: null, // Will be null initially
      qualification_notes: 'Test lead for debugging',
      lead_type: 'individual',
      created_by: null // Handle this explicitly
    };

    console.log('Attempting full insert with data:', fullLead);

    const { data, error } = await supabase
      .from('crm_leads')
      .insert(fullLead)
      .select()
      .single();

    if (error) {
      console.error('❌ Full insert failed:', error);
      return { 
        success: false, 
        error: 'Full insert failed', 
        details: error,
        errorCode: error.code,
        errorMessage: error.message,
        insertData: fullLead
      };
    }

    console.log('✅ Full insert successful:', data);

    // Clean up
    await supabase.from('crm_leads').delete().eq('id', data.id);

    return { 
      success: true, 
      message: 'Full CRM insert test passed',
      testRecord: data
    };

  } catch (error) {
    console.error('❌ Unexpected error during full CRM test:', error);
    return { 
      success: false, 
      error: 'Unexpected error in full test', 
      details: error 
    };
  }
}

// Function to run both tests and return comprehensive results
export async function runAllCRMTests() {
  console.log('🚀 Running comprehensive CRM tests...');
  
  const results = {
    minimalTest: await testCRMLeadInsert(),
    fullTest: await testCRMFullInsert(),
    timestamp: new Date().toISOString()
  };

  console.log('📊 CRM Test Results:', results);
  return results;
}