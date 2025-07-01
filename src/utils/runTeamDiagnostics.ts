// Simple script to run team diagnostics and validate fixes
// This can be imported and called from the browser console

import { diagnoseDatabaseTeamIssues, testTeamDataConsistency } from './teamDatabaseDiagnostics';

// Export a function that can be called from the browser console
export async function runDiagnostics() {
  console.log('🚀 Starting Team Management Diagnostics...');
  console.log('📋 This will test database connectivity, RLS policies, and query functionality');
  
  try {
    const diagnosticResult = await testTeamDataConsistency();
    
    console.log('\n🎯 DIAGNOSIS COMPLETE');
    console.log('📊 Check the console output above for detailed results');
    console.log('🔍 RECOMMENDATION:', diagnosticResult.analysis.recommendation);
    
    // Check for critical issues
    const hasIssues = diagnosticResult.results.errors.length > 0 ||
                     !diagnosticResult.analysis.functionsExist.adminFunction;
    
    if (!hasIssues) {
      console.log('✅ All tests passed! The team management system should be working correctly.');
    } else {
      console.log('❌ Issues detected that need to be addressed:');
      if (diagnosticResult.results.errors.length > 0) {
        diagnosticResult.results.errors.forEach(error => {
          console.log(`   • ${error}`);
        });
      }
      if (!diagnosticResult.analysis.functionsExist.adminFunction) {
        console.log('   • Admin team function is not working properly');
      }
    }
    
    return diagnosticResult;
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