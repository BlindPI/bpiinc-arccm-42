import { CampaignDiagnostics } from './campaignDiagnostics';

export async function runCampaignDiagnosticsTest() {
  console.log('🚀 Starting Campaign Management Diagnostics Test...');
  
  try {
    const results = await CampaignDiagnostics.runFullDiagnostics();
    
    console.log('📋 Diagnostic Results Summary:');
    console.log('- Database Tables:', results.database?.tablesExist);
    console.log('- Data Counts:', results.database?.dataCounts);
    console.log('- Service Layer:', results.services?.error ? 'FAILED' : 'SUCCESS');
    console.log('- Recommendations:', results.recommendations);
    
    return results;
  } catch (error) {
    console.error('❌ Diagnostics test failed:', error);
    return { error };
  }
}

// Auto-run diagnostics in development
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  // Run diagnostics after a short delay to allow app to initialize
  setTimeout(() => {
    runCampaignDiagnosticsTest();
  }, 3000);
}