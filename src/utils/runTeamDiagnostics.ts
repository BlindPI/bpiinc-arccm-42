// Simple script to run team diagnostics and validate fixes
// This can be imported and called from the browser console

import { logTeamDiagnostics } from './teamDatabaseDiagnostics';

// Export a function that can be called from the browser console
export async function runDiagnostics() {
  console.log('🚀 Starting Team Management Diagnostics...');
  console.log('📋 This will test database connectivity, RLS policies, and query functionality');
  
  try {
    const results = await logTeamDiagnostics();
    
    console.log('\n🎯 DIAGNOSIS COMPLETE');
    console.log('📊 Check the console output above for detailed results');
    
    const failedTests = results.filter(r => r.status === 'FAIL');
    if (failedTests.length === 0) {
      console.log('✅ All tests passed! The team management system should be working correctly.');
    } else {
      console.log(`❌ ${failedTests.length} tests failed. These issues need to be addressed:`);
      failedTests.forEach(test => {
        console.log(`   • ${test.test}: ${test.message}`);
      });
    }
    
    return results;
  } catch (error) {
    console.error('🚨 Failed to run diagnostics:', error);
    return [];
  }
}

// Auto-run diagnostics when this module is imported (for testing)
if (typeof window !== 'undefined') {
  // Make it available globally for console access
  (window as any).runTeamDiagnostics = runDiagnostics;
  console.log('🔧 Team diagnostics available: Call runTeamDiagnostics() in the console');
}