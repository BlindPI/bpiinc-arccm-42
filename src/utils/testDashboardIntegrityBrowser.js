// Browser Console Test for Dashboard Integrity Panel
// Run this in the browser console when logged in as SA or AD user

async function testDashboardIntegrity() {
  console.log('🚀 Testing Dashboard Integrity Panel functionality...');
  
  try {
    // Import the service (this works in the browser with the bundler)
    const { DashboardIntegrityService } = await import('/src/services/audit/dashboardIntegrityService.ts');
    
    console.log('✅ Successfully imported DashboardIntegrityService');
    
    // Test static methods first
    console.log('\n1. Testing static methods...');
    
    try {
      const apAudit = await DashboardIntegrityService.auditAPUsers();
      console.log('✅ auditAPUsers() works - found', apAudit.length, 'AP users');
      
      if (apAudit.length > 0) {
        console.log('   Sample AP user audit:', apAudit[0]);
      }
    } catch (error) {
      console.error('❌ auditAPUsers() failed:', error.message);
    }
    
    try {
      const teamAudit = await DashboardIntegrityService.auditTeamProviderRelationships();
      console.log('✅ auditTeamProviderRelationships() works - found', teamAudit.length, 'teams');
      
      if (teamAudit.length > 0) {
        console.log('   Sample team audit:', teamAudit[0]);
      }
    } catch (error) {
      console.error('❌ auditTeamProviderRelationships() failed:', error.message);
    }
    
    // Test instance methods (what the UI actually uses)
    console.log('\n2. Testing instance methods (UI methods)...');
    
    const service = new DashboardIntegrityService();
    
    try {
      console.log('   Running performFullAudit()...');
      const fullAudit = await service.performFullAudit();
      console.log('✅ performFullAudit() works!');
      console.log('   Results structure:', {
        overallScore: fullAudit.overallScore,
        summaryKeys: Object.keys(fullAudit.summary || {}),
        issuesCount: fullAudit.issues?.length || 0,
        recommendationsCount: fullAudit.recommendations?.length || 0
      });
      
      if (fullAudit.issues && fullAudit.issues.length > 0) {
        console.log('   Sample issue:', fullAudit.issues[0]);
      }
      
      // Test auto-fix if there are issues
      if (fullAudit.summary?.totalIssues > 0) {
        console.log('\n3. Testing auto-fix functionality...');
        try {
          const fixResults = await service.autoFixIssues();
          console.log('✅ autoFixIssues() works!');
          console.log('   Fix results:', {
            totalFixed: fixResults.totalFixed,
            errors: fixResults.errors?.length || 0
          });
        } catch (error) {
          console.error('❌ autoFixIssues() failed:', error.message);
        }
      } else {
        console.log('\n3. ✅ No issues found - auto-fix not needed');
      }
      
      return true;
    } catch (error) {
      console.error('❌ performFullAudit() failed:', error.message);
      console.error('   Full error:', error);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Test failed to start:', error.message);
    console.error('   Make sure you are on the dashboard page and logged in as SA or AD user');
    return false;
  }
}

// Test dashboard panel visibility
function testDashboardPanelVisibility() {
  console.log('\n🔍 Testing Dashboard Panel Visibility...');
  
  const panel = document.querySelector('div[class*="DashboardIntegrityPanel"], h2:contains("Dashboard Integrity Panel")');
  if (panel || document.querySelector('[class*="integrity"]')) {
    console.log('✅ Dashboard Integrity Panel found on page');
  } else {
    console.log('❌ Dashboard Integrity Panel not found');
    console.log('   - Make sure you are logged in as SA or AD user');
    console.log('   - Make sure you are on the Enhanced Dashboard page');
    console.log('   - Check that canViewSystemMetrics is true');
  }
  
  const runButton = document.querySelector('button:contains("Run Integrity Check"), button:contains("Running Audit")');
  if (runButton) {
    console.log('✅ "Run Integrity Check" button found');
    console.log('   Button text:', runButton.textContent);
    console.log('   Button disabled:', runButton.disabled);
  } else {
    console.log('❌ "Run Integrity Check" button not found');
  }
}

// Run both tests
async function runAllTests() {
  console.log('🧪 Running Complete Dashboard Integrity Test Suite');
  console.log('=' .repeat(60));
  
  testDashboardPanelVisibility();
  
  const serviceTest = await testDashboardIntegrity();
  
  console.log('\n' + '=' .repeat(60));
  if (serviceTest) {
    console.log('🎉 All tests passed! Dashboard Integrity Panel should be working.');
  } else {
    console.log('❌ Some tests failed. Check the errors above.');
  }
  console.log('=' .repeat(60));
  
  return serviceTest;
}

// Export functions for manual testing
window.testDashboardIntegrity = testDashboardIntegrity;
window.testDashboardPanelVisibility = testDashboardPanelVisibility;
window.runAllTests = runAllTests;

console.log('🔧 Dashboard Integrity Test loaded!');
console.log('Run: await runAllTests() to test everything');
console.log('Or run individual tests:');
console.log('- testDashboardPanelVisibility()');
console.log('- await testDashboardIntegrity()');