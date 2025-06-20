import { DashboardIntegrityService } from '@/services/audit/dashboardIntegrityService';
import { supabase } from '@/integrations/supabase/client';

export async function testDashboardIntegrityService() {
  console.log('🔍 Testing Dashboard Integrity Service...');
  
  try {
    // Test 1: Check user authentication and role
    console.log('\n1. Testing User Authentication & Role...');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('❌ User not authenticated');
      return false;
    }
    console.log('✅ User authenticated:', user.id);
    
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, display_name, email')
      .eq('id', user.id)
      .single();
    
    if (profileError) {
      console.error('❌ Failed to get user profile:', profileError);
      return false;
    }
    
    console.log('✅ User profile:', { role: profile.role, name: profile.display_name });
    
    if (!['SA', 'AD'].includes(profile.role)) {
      console.warn('⚠️ User role is not SA or AD - Dashboard Integrity Panel may not be visible');
    }
    
    // Test 2: Check database tables exist
    console.log('\n2. Testing Database Tables...');
    
    // Check profiles table
    const { data: profilesTest, error: profilesError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (profilesError) {
      console.error('❌ Profiles table error:', profilesError);
      return false;
    }
    console.log('✅ Profiles table accessible');
    
    // Check ap_user_location_assignments table
    const { data: assignmentsTest, error: assignmentsError } = await supabase
      .from('ap_user_location_assignments')
      .select('id')
      .limit(1);
    
    if (assignmentsError) {
      console.error('❌ ap_user_location_assignments table error:', assignmentsError);
      console.log('This table may not exist - checking...');
    } else {
      console.log('✅ ap_user_location_assignments table accessible');
    }
    
    // Check teams table
    const { data: teamsTest, error: teamsError } = await supabase
      .from('teams')
      .select('id')
      .limit(1);
    
    if (teamsError) {
      console.error('❌ Teams table error:', teamsError);
      return false;
    }
    console.log('✅ Teams table accessible');
    
    // Check team_members table
    const { data: membersTest, error: membersError } = await supabase
      .from('team_members')
      .select('id')
      .limit(1);
    
    if (membersError) {
      console.error('❌ Team members table error:', membersError);
      return false;
    }
    console.log('✅ Team members table accessible');
    
    // Test 3: Test static methods
    console.log('\n3. Testing Static Service Methods...');
    
    try {
      const apAudit = await DashboardIntegrityService.auditAPUsers();
      console.log('✅ auditAPUsers() works - found', apAudit.length, 'AP users');
    } catch (error) {
      console.error('❌ auditAPUsers() failed:', error);
    }
    
    try {
      const teamAudit = await DashboardIntegrityService.auditTeamProviderRelationships();
      console.log('✅ auditTeamProviderRelationships() works - found', teamAudit.length, 'teams');
    } catch (error) {
      console.error('❌ auditTeamProviderRelationships() failed:', error);
    }
    
    // Test 4: Test instance methods (what the UI uses)
    console.log('\n4. Testing Instance Service Methods...');
    
    const service = new DashboardIntegrityService();
    
    try {
      const fullAudit = await service.performFullAudit();
      console.log('✅ performFullAudit() works');
      console.log('   - Overall Score:', fullAudit.overallScore + '%');
      console.log('   - Total Issues:', fullAudit.summary.totalIssues);
      console.log('   - Issues found:', fullAudit.issues.length);
      console.log('   - Recommendations:', fullAudit.recommendations.length);
      
      // Show sample issues if any
      if (fullAudit.issues.length > 0) {
        console.log('   - Sample issues:');
        fullAudit.issues.slice(0, 3).forEach((issue, index) => {
          console.log(`     ${index + 1}. [${issue.severity}] ${issue.description}`);
        });
      }
      
      return true;
    } catch (error) {
      console.error('❌ performFullAudit() failed:', error);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    return false;
  }
}

// Test specific database queries that the service uses
export async function testDatabaseQueries() {
  console.log('\n🔍 Testing Specific Database Queries...');
  
  try {
    // Query 1: Get AP users (this is what the service does)
    console.log('\n1. Testing AP Users Query...');
    const { data: apUsers, error: apUsersError } = await supabase
      .from('profiles')
      .select('id, display_name, email, role')
      .eq('role', 'AP');
    
    if (apUsersError) {
      console.error('❌ AP Users query failed:', apUsersError);
    } else {
      console.log('✅ Found', apUsers.length, 'AP users');
    }
    
    // Query 2: Test location assignments query
    console.log('\n2. Testing Location Assignments Query...');
    if (apUsers && apUsers.length > 0) {
      const testUserId = apUsers[0].id;
      const { data: locationAssignments, error: assignError } = await supabase
        .from('ap_user_location_assignments')
        .select(`
          id, location_id, status, assignment_role,
          locations(id, name, city, state)
        `)
        .eq('ap_user_id', testUserId)
        .eq('status', 'active');
      
      if (assignError) {
        console.error('❌ Location assignments query failed:', assignError);
        console.log('   This might be the main issue - table may not exist or have wrong structure');
      } else {
        console.log('✅ Location assignments query works - found', locationAssignments?.length || 0, 'assignments');
      }
    }
    
    // Query 3: Test teams query
    console.log('\n3. Testing Teams Query...');
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select(`
        id, name, status, provider_id, location_id,
        locations(id, name),
        authorized_providers(id, name, status)
      `);
    
    if (teamsError) {
      console.error('❌ Teams query failed:', teamsError);
    } else {
      console.log('✅ Teams query works - found', teams?.length || 0, 'teams');
      
      // Check if teams have proper relationships
      const teamsWithProvider = teams?.filter(t => t.provider_id) || [];
      const teamsWithLocation = teams?.filter(t => t.location_id) || [];
      console.log('   - Teams with provider:', teamsWithProvider.length);
      console.log('   - Teams with location:', teamsWithLocation.length);
    }
    
  } catch (error) {
    console.error('❌ Database queries test failed:', error);
  }
}

// Run both tests
export async function runFullDashboardIntegrityTest() {
  console.log('🚀 Starting Full Dashboard Integrity Test Suite...');
  
  const serviceTest = await testDashboardIntegrityService();
  await testDatabaseQueries();
  
  if (serviceTest) {
    console.log('\n✅ Dashboard Integrity Service is working correctly!');
    console.log('   The "Run Integrity Check" button should now work.');
  } else {
    console.log('\n❌ Dashboard Integrity Service has issues that need to be fixed.');
  }
  
  return serviceTest;
}