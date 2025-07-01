import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugComplianceSystem() {
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
    const { data: metrics, error: metricsError } = await supabase
      .from('compliance_metrics')
      .select('*')
      .eq('is_active', true);

    if (metricsError) {
      console.error('❌ Error fetching metrics:', metricsError);
      if (metricsError.message?.includes('relation') && metricsError.message?.includes('does not exist')) {
        console.log('🚨 DIAGNOSIS: compliance_metrics table does not exist');
        console.log('💡 SOLUTION: Run the compliance migration');
      }
    } else {
      console.log('✅ Compliance metrics count:', metrics?.length || 0);
      console.log('📊 Sample metrics:', metrics?.slice(0, 3).map(m => ({ name: m.name, category: m.category })));
    }

    // 3. Check current user's role and permissions
    console.log('\n3. Checking current user...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('❌ Error getting user:', userError);
    } else if (user) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, role, display_name')
        .eq('id', user.id)
        .single();
      
      if (profileError) {
        console.error('❌ Error getting profile:', profileError);
      } else {
        console.log('✅ Current user:', profile);
        
        // 4. Check user's compliance records
        console.log('\n4. Checking user compliance records...');
        const { data: records, error: recordsError } = await supabase
          .from('user_compliance_records')
          .select('*')
          .eq('user_id', user.id);

        if (recordsError) {
          console.error('❌ Error fetching compliance records:', recordsError);
        } else {
          console.log('📋 User compliance records count:', records?.length || 0);
        }

        // 5. Check compliance actions
        console.log('\n5. Checking compliance actions...');
        const { data: actions, error: actionsError } = await supabase
          .from('compliance_actions')
          .select('*')
          .eq('user_id', user.id);

        if (actionsError) {
          console.error('❌ Error fetching compliance actions:', actionsError);
        } else {
          console.log('⚡ Compliance actions count:', actions?.length || 0);
        }
      }
    } else {
      console.log('❌ No authenticated user found');
    }

  } catch (error) {
    console.error('❌ Error during compliance system debug:', error);
  }

  console.log('\n================================');
  console.log('🔍 COMPLIANCE DEBUG COMPLETE');
}

// Run the debug
debugComplianceSystem();