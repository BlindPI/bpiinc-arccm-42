/**
 * SIMPLE TEST for Clean AP Team Service
 * Tests basic functionality after nuclear cleanup
 */

import { CleanAPTeamService } from '@/services/clean/CleanAPTeamService';

export async function testCleanAPService() {
  console.log('🧪 Testing Clean AP Team Service...');
  
  try {
    // Test 1: Get system health
    console.log('📊 Test 1: System Health');
    const health = await CleanAPTeamService.getSystemHealth();
    console.log('Health:', health);
    
    // Test 2: Get available AP users
    console.log('👥 Test 2: Available AP Users');
    const apUsers = await CleanAPTeamService.getAvailableAPUsers();
    console.log('AP Users:', apUsers);
    
    // Test 3: Get available locations
    console.log('📍 Test 3: Available Locations');
    const locations = await CleanAPTeamService.getAvailableLocations();
    console.log('Locations:', locations);
    
    // Test 4: Try to assign first AP user to first location
    if (apUsers.length > 0 && locations.length > 0) {
      console.log('🎯 Test 4: Assign AP User to Location');
      const result = await CleanAPTeamService.assignAPUserToLocation(
        apUsers[0].id,
        locations[0].id
      );
      console.log('Assignment Result:', result);
      
      // Test 5: Try to create a team
      console.log('🏗️ Test 5: Create Team');
      const teamResult = await CleanAPTeamService.createTeamWithAPUser({
        name: 'Test Team',
        description: 'Test team created by diagnostic',
        locationId: locations[0].id,
        apUserId: apUsers[0].id
      });
      console.log('Team Creation Result:', teamResult);
    } else {
      console.log('⚠️ Skipping assignment test - no AP users or locations available');
    }
    
    console.log('✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Browser console integration
if (typeof window !== 'undefined') {
  (window as any).testCleanAPService = testCleanAPService;
  console.log('🧪 Run testCleanAPService() in browser console to test');
}