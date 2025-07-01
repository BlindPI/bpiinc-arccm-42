// DIAGNOSTIC: Check current RLS policies on profiles table
// This will help confirm the source of infinite recursion

export const diagnoseProfilePolicies = async () => {
  console.log('🔍 DIAGNOSING PROFILE POLICIES...');
  
  try {
    // Get all current policies on profiles table
    const { data: policies, error } = await supabase
      .rpc('execute_sql', {
        sql: `
          SELECT 
            schemaname,
            tablename,
            policyname,
            permissive,
            roles,
            cmd,
            qual,
            with_check
          FROM pg_policies 
          WHERE tablename = 'profiles' 
          ORDER BY policyname;
        `
      });

    if (error) {
      console.error('❌ Error fetching policies:', error);
      return;
    }

    console.log('📋 CURRENT PROFILES POLICIES:');
    console.log('Total policies found:', policies?.length || 0);
    
    policies?.forEach((policy: any, index: number) => {
      console.log(`\n${index + 1}. Policy: ${policy.policyname}`);
      console.log(`   Command: ${policy.cmd}`);
      console.log(`   Condition: ${policy.qual || 'N/A'}`);
      console.log(`   With Check: ${policy.with_check || 'N/A'}`);
    });

    // Check for potential circular references
    const circularPolicies = policies?.filter((policy: any) => 
      policy.qual?.includes('profiles.') || 
      policy.with_check?.includes('profiles.')
    );

    if (circularPolicies?.length > 0) {
      console.log('\n⚠️ POTENTIAL CIRCULAR REFERENCES DETECTED:');
      circularPolicies.forEach((policy: any) => {
        console.log(`- ${policy.policyname}: References profiles table in condition`);
      });
    }

    // Check RLS status
    const { data: rlsStatus } = await supabase
      .rpc('execute_sql', {
        sql: `
          SELECT 
            schemaname,
            tablename,
            rowsecurity as rls_enabled
          FROM pg_tables 
          LEFT JOIN pg_class ON pg_class.relname = pg_tables.tablename
          WHERE tablename = 'profiles';
        `
      });

    console.log('\n🔒 RLS STATUS:', rlsStatus?.[0]?.rls_enabled ? 'ENABLED' : 'DISABLED');

    return {
      totalPolicies: policies?.length || 0,
      policies: policies || [],
      circularPolicies: circularPolicies || [],
      rlsEnabled: rlsStatus?.[0]?.rls_enabled || false
    };

  } catch (error) {
    console.error('❌ Diagnostic failed:', error);
    throw error;
  }
};

// Add to window for console access
if (typeof window !== 'undefined') {
  (window as any).diagnoseProfilePolicies = diagnoseProfilePolicies;
}