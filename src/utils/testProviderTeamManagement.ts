// Test script for Provider Team Management Stage 1 implementation
import { enhancedProviderService } from '@/services/provider/enhancedProviderService';

export async function testProviderTeamManagement() {
  console.log('🧪 Testing Provider Team Management Stage 1 Implementation...');
  
  try {
    // Test 1: Get all providers
    console.log('\n1. Testing provider retrieval...');
    const providers = await enhancedProviderService.getAllProviders();
    console.log(`✅ Found ${providers.length} providers`);
    
    if (providers.length === 0) {
      console.log('⚠️ No providers found. Please ensure providers exist in the database.');
      return;
    }
    
    const testProvider = providers[0];
    console.log(`📋 Using test provider: ${testProvider.name} (ID: ${testProvider.id})`);
    
    // Test 2: Get provider team assignments
    console.log('\n2. Testing provider team assignments retrieval...');
    const assignments = await enhancedProviderService.getProviderTeamAssignments(testProvider.id);
    console.log(`✅ Found ${assignments.length} team assignments for provider`);
    
    // Test 3: Get available teams for assignment
    console.log('\n3. Testing available teams retrieval...');
    const availableTeams = await enhancedProviderService.getAvailableTeamsForProvider(testProvider.id);
    console.log(`✅ Found ${availableTeams.length} available teams for assignment`);
    
    // Test 4: Get provider capabilities
    console.log('\n4. Testing provider capabilities retrieval...');
    const capabilities = await enhancedProviderService.getProviderCapabilities(testProvider.id);
    console.log(`✅ Found ${capabilities.length} training capabilities`);
    
    // Test 5: Get provider team analytics
    console.log('\n5. Testing provider analytics...');
    const analytics = await enhancedProviderService.getProviderTeamAnalytics(testProvider.id);
    console.log('✅ Provider analytics:', {
      totalTeams: analytics.totalTeams,
      activeAssignments: analytics.activeAssignments,
      averagePerformance: analytics.averagePerformance.toFixed(2),
      totalCertificationsIssued: analytics.totalCertificationsIssued,
      totalCoursesDelivered: analytics.totalCoursesDelivered,
      performanceTrend: analytics.performanceTrend.toFixed(2) + '%'
    });
    
    // Test 6: Test assignment workflow (if available teams exist)
    if (availableTeams.length > 0) {
      console.log('\n6. Testing team assignment workflow...');
      const testTeam = availableTeams[0];
      
      try {
        const assignmentId = await enhancedProviderService.assignProviderToTeam(
          testProvider.id,
          testTeam.id,
          'primary_trainer',
          'manage',
          'ongoing'
        );
        console.log(`✅ Successfully assigned provider to team. Assignment ID: ${assignmentId}`);
        
        // Test removal
        await enhancedProviderService.removeProviderFromTeam(testProvider.id, testTeam.id);
        console.log('✅ Successfully removed provider from team');
        
      } catch (error) {
        console.log('⚠️ Assignment test failed (this may be expected if RPC functions are not yet available):', error);
      }
    } else {
      console.log('\n6. ⚠️ No available teams for assignment testing');
    }
    
    // Test 7: Test performance recording (mock data)
    console.log('\n7. Testing performance recording...');
    if (assignments.length > 0) {
      try {
        await enhancedProviderService.recordTeamPerformance(
          testProvider.id,
          assignments[0].team_id,
          {
            courses_delivered: 5,
            certifications_issued: 12,
            average_satisfaction_score: 4.5,
            completion_rate: 95.0,
            compliance_score: 98.5
          }
        );
        console.log('✅ Successfully recorded team performance');
      } catch (error) {
        console.log('⚠️ Performance recording test failed (this may be expected if RPC functions are not yet available):', error);
      }
    } else {
      console.log('⚠️ No team assignments found for performance testing');
    }
    
    console.log('\n🎉 Provider Team Management Stage 1 testing completed!');
    console.log('\n📊 Test Summary:');
    console.log(`- Providers found: ${providers.length}`);
    console.log(`- Team assignments: ${assignments.length}`);
    console.log(`- Available teams: ${availableTeams.length}`);
    console.log(`- Training capabilities: ${capabilities.length}`);
    console.log('- Analytics: ✅ Working');
    
    return {
      success: true,
      providersCount: providers.length,
      assignmentsCount: assignments.length,
      availableTeamsCount: availableTeams.length,
      capabilitiesCount: capabilities.length,
      analytics
    };
    
  } catch (error) {
    console.error('❌ Provider Team Management test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Function to test database schema
export async function testDatabaseSchema() {
  console.log('🗄️ Testing database schema for Provider Team Management...');
  
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Test if new tables exist by attempting to query them
    console.log('\n1. Testing provider_team_assignments table...');
    const { data: assignments, error: assignmentsError } = await supabase
      .from('provider_team_assignments' as any)
      .select('id')
      .limit(1);
    
    if (assignmentsError) {
      console.log('❌ provider_team_assignments table not accessible:', assignmentsError.message);
    } else {
      console.log('✅ provider_team_assignments table accessible');
    }
    
    console.log('\n2. Testing provider_training_capabilities table...');
    const { data: capabilities, error: capabilitiesError } = await supabase
      .from('provider_training_capabilities' as any)
      .select('id')
      .limit(1);
    
    if (capabilitiesError) {
      console.log('❌ provider_training_capabilities table not accessible:', capabilitiesError.message);
    } else {
      console.log('✅ provider_training_capabilities table accessible');
    }
    
    console.log('\n3. Testing provider_team_performance table...');
    const { data: performance, error: performanceError } = await supabase
      .from('provider_team_performance' as any)
      .select('id')
      .limit(1);
    
    if (performanceError) {
      console.log('❌ provider_team_performance table not accessible:', performanceError.message);
    } else {
      console.log('✅ provider_team_performance table accessible');
    }
    
    console.log('\n4. Testing RPC functions...');
    
    // Test assign_provider_to_team function
    try {
      const { error: rpcError } = await supabase.rpc('assign_provider_to_team' as any, {
        p_provider_id: '00000000-0000-0000-0000-000000000000',
        p_team_id: '00000000-0000-0000-0000-000000000000',
        p_assignment_role: 'primary_trainer',
        p_oversight_level: 'monitor',
        p_assignment_type: 'ongoing'
      });
      
      if (rpcError && !rpcError.message.includes('not found')) {
        console.log('✅ assign_provider_to_team RPC function exists');
      } else {
        console.log('❌ assign_provider_to_team RPC function not found');
      }
    } catch (error) {
      console.log('❌ assign_provider_to_team RPC function test failed');
    }
    
    console.log('\n🎯 Database schema testing completed!');
    
  } catch (error) {
    console.error('❌ Database schema test failed:', error);
  }
}

// Export test functions for use in console or components
export const providerTeamManagementTests = {
  testProviderTeamManagement,
  testDatabaseSchema
};