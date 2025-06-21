import { supabase } from '@/integrations/supabase/client';
import { ComplianceService } from '@/services/compliance/complianceService';

export async function debugComplianceSystem() {
  console.log('🔍 DEBUGGING COMPLIANCE SYSTEM');
  console.log('================================');

  try {
    // 1. Check if compliance tables exist
    console.log('1. Checking if compliance tables exist...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .like('table_name', '%compliance%');

    if (tablesError) {
      console.error('❌ Error checking tables:', tablesError);
    } else {
      console.log('✅ Compliance tables found:', tables?.map(t => t.table_name));
    }

    // 2. Check if compliance metrics exist
    console.log('\n2. Checking compliance metrics...');
    const metrics = await ComplianceService.getComplianceMetrics();
    console.log('✅ Compliance metrics count:', metrics.length);
    console.log('📊 Sample metrics:', metrics.slice(0, 3).map(m => ({ name: m.name, category: m.category })));

    // 3. Check current user's role and permissions
    console.log('\n3. Checking current user...');
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, role, display_name')
        .eq('id', user.id)
        .single();
      
      console.log('✅ Current user:', profile);
      
      // 4. Check user's compliance records
      console.log('\n4. Checking user compliance records...');
      const records = await ComplianceService.getUserComplianceRecords(user.id);
      console.log('📋 User compliance records count:', records.length);
      
      // 5. Check user compliance summary
      console.log('\n5. Checking user compliance summary...');
      const summary = await ComplianceService.getUserComplianceSummary(user.id);
      console.log('📈 Compliance summary:', summary);

      // 6. Check compliance actions
      console.log('\n6. Checking compliance actions...');
      const actions = await ComplianceService.getUserComplianceActions(user.id);
      console.log('⚡ Compliance actions count:', actions.length);

      // 7. Test provider compliance functions
      console.log('\n7. Testing provider compliance functions...');
      const providerScore = await ComplianceService.getProviderComplianceScore(user.id);
      console.log('🏢 Provider compliance score:', providerScore);
      
      const breakdown = await ComplianceService.getProviderComplianceBreakdown(user.id);
      console.log('📊 Provider compliance breakdown:', {
        requirements: breakdown.requirements.length,
        actions: breakdown.actions.length
      });
    } else {
      console.log('❌ No authenticated user found');
    }

  } catch (error) {
    console.error('❌ Error during compliance system debug:', error);
    
    // Check if it's a table not found error
    if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
      console.log('🚨 DIAGNOSIS: Compliance tables do not exist in database');
      console.log('💡 SOLUTION: Run the compliance migration');
    }
  }

  console.log('\n================================');
  console.log('🔍 COMPLIANCE DEBUG COMPLETE');
}

// Auto-run debug when imported in development
if (import.meta.env.DEV) {
  debugComplianceSystem();
}