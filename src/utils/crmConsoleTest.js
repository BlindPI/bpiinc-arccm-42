// CRM Console Test Script
// Copy and paste this into the browser console to test CRM functionality

console.log('🔍 Starting CRM Console Test...');

// Test function that can be run in browser console
async function testCRMInConsole() {
  try {
    // Import Supabase client (assuming it's available globally or via window)
    const { supabase } = window;
    
    if (!supabase) {
      console.error('❌ Supabase client not found. Make sure you are on the CRM page.');
      return;
    }

    console.log('✅ Supabase client found');

    // Test 1: Check authentication
    console.log('🔍 Test 1: Checking authentication...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ Authentication failed:', authError);
      return;
    }
    
    console.log('✅ User authenticated:', user.id);

    // Test 2: Check user profile
    console.log('🔍 Test 2: Checking user profile...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, display_name')
      .eq('id', user.id)
      .single();
    
    if (profileError) {
      console.error('❌ Profile check failed:', profileError);
      return;
    }
    
    console.log('✅ User profile:', profile);

    // Test 3: Check table access
    console.log('🔍 Test 3: Checking CRM table access...');
    const { data: tableData, error: tableError } = await supabase
      .from('crm_leads')
      .select('id')
      .limit(1);
    
    if (tableError) {
      console.error('❌ Table access failed:', tableError);
      console.error('Error details:', {
        code: tableError.code,
        message: tableError.message,
        details: tableError.details,
        hint: tableError.hint
      });
      return;
    }
    
    console.log('✅ Table access successful');

    // Test 4: Try minimal insert
    console.log('🔍 Test 4: Testing minimal insert...');
    const testEmail = `console-test-${Date.now()}@example.com`;
    
    const { data: insertData, error: insertError } = await supabase
      .from('crm_leads')
      .insert({
        email: testEmail,
        lead_status: 'new',
        lead_source: 'website',
        lead_type: 'individual'
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Insert failed:', insertError);
      console.error('Insert error details:', {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint
      });
      return;
    }

    console.log('✅ Insert successful:', insertData);

    // Test 5: Clean up
    console.log('🔍 Test 5: Cleaning up...');
    const { error: deleteError } = await supabase
      .from('crm_leads')
      .delete()
      .eq('id', insertData.id);

    if (deleteError) {
      console.warn('⚠️ Cleanup failed:', deleteError);
    } else {
      console.log('✅ Cleanup successful');
    }

    console.log('🎉 All CRM tests passed!');
    return { success: true, message: 'All tests passed' };

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return { success: false, error: error.message };
  }
}

// Test the exact CRMService.createLead method
async function testCRMServiceInConsole() {
  try {
    console.log('🔍 Testing CRMService.createLead method...');
    
    // This assumes CRMService is available in the global scope
    if (typeof CRMService === 'undefined') {
      console.error('❌ CRMService not found. Make sure you are on the CRM page.');
      return;
    }

    const testLead = {
      first_name: 'Console',
      last_name: 'Test',
      email: `crm-service-test-${Date.now()}@example.com`,
      phone: '+1-555-0123',
      company: 'Test Company',
      title: 'Test Manager',
      status: 'new',
      source: 'website',
      score: 50,
      notes: 'Console test lead'
    };

    console.log('Calling CRMService.createLead with:', testLead);
    
    const result = await CRMService.createLead(testLead);
    
    console.log('✅ CRMService.createLead successful:', result);
    
    // Clean up
    await CRMService.deleteLead(result.id);
    console.log('✅ Cleanup successful');
    
    return { success: true, result };
    
  } catch (error) {
    console.error('❌ CRMService test failed:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    return { success: false, error };
  }
}

// Make functions available globally
window.testCRMInConsole = testCRMInConsole;
window.testCRMServiceInConsole = testCRMServiceInConsole;

console.log('📋 CRM Console Test Functions Available:');
console.log('- testCRMInConsole() - Tests direct Supabase access');
console.log('- testCRMServiceInConsole() - Tests CRMService methods');
console.log('');
console.log('💡 Usage: Run testCRMInConsole() or testCRMServiceInConsole() in the console');