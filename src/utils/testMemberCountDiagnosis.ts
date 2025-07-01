/**
 * TEST SCRIPT: Member Count Diagnosis Validation
 * 
 * Run this to validate the double counting diagnosis with actual data
 */

import { diagnoseMemberCountDiscrepancy, logMemberCountDiagnosticResults } from './diagnoseMemberCount';

async function runMemberCountDiagnosticTest() {
  console.log('🚀 STARTING MEMBER COUNT DIAGNOSTIC TEST...\n');
  
  try {
    // Test with the current user's provider ID (we'll need to get this dynamically)
    // For now, let's run a general test to find providers with discrepancies
    
    console.log('🔍 Step 1: Running diagnostic on providers with team assignments...');
    
    // We'll test with a sample provider ID - in a real scenario, this would be 
    // the current AP user's provider ID from the screenshots
    const testProviderId = 'sample-provider-id'; // This would be replaced with actual ID
    
    console.log(`🔍 Testing provider: ${testProviderId}`);
    
    const diagnostics = await diagnoseMemberCountDiscrepancy(testProviderId);
    
    await logMemberCountDiagnosticResults(diagnostics);
    
    // Analyze results
    const criticalIssues = diagnostics.filter(d => d.detected && d.severity === 'critical');
    const doubleCountingIssues = diagnostics.filter(d => d.detected && d.issue_type === 'double_counting');
    
    console.log('\n📊 DIAGNOSTIC SUMMARY:');
    console.log(`   Total findings: ${diagnostics.length}`);
    console.log(`   Critical issues: ${criticalIssues.length}`);
    console.log(`   Double counting issues: ${doubleCountingIssues.length}`);
    
    if (doubleCountingIssues.length > 0) {
      console.log('\n✅ DIAGNOSIS CONFIRMED: Double counting detected!');
      const issue = doubleCountingIssues[0];
      console.log(`   Dashboard shows: ${issue.actual_dashboard_count} members`);
      console.log(`   Correct count: ${issue.expected_count} members`);
      console.log(`   Overlapping teams: ${issue.debugging_details.overlapping_teams.length}`);
      console.log(`   Primary location count: ${issue.debugging_details.primary_location_member_count}`);
      console.log(`   Assigned teams count: ${issue.debugging_details.assigned_teams_member_count}`);
      
      return {
        diagnosed: true,
        issue: issue,
        fix_needed: true
      };
    } else {
      console.log('\n❓ No double counting detected - may need to investigate other causes');
      return {
        diagnosed: false,
        issue: null,
        fix_needed: false
      };
    }
    
  } catch (error) {
    console.error('🚨 DIAGNOSTIC TEST FAILED:', error);
    return {
      diagnosed: false,
      issue: null,
      fix_needed: false,
      error: error
    };
  }
}

// Export for use in other scripts
export { runMemberCountDiagnosticTest };

// Auto-run if called directly
if (require.main === module) {
  runMemberCountDiagnosticTest()
    .then(result => {
      console.log('\n🎯 DIAGNOSTIC TEST COMPLETE:', result);
      process.exit(result.diagnosed ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 DIAGNOSTIC TEST CRASHED:', error);
      process.exit(1);
    });
}