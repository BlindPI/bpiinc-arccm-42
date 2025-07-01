// Simple JavaScript file to run email diagnostics from browser console
// This can be run in the browser console when the app is loaded

console.log('🚀 Email Service Diagnostics - Loading...');

// Import the diagnostics functions
import('./testEmailServiceDiagnostics.js').then(({ runEmailDiagnostics, testCertificateEmail }) => {
  console.log('✅ Email diagnostics loaded successfully!');
  console.log('');
  console.log('Available commands:');
  console.log('- runEmailDiagnostics() - Run comprehensive email service diagnostics');
  console.log('- testCertificateEmail(certificateId, optionalTestEmail) - Test specific certificate');
  console.log('');
  console.log('Example usage:');
  console.log('  runEmailDiagnostics()');
  console.log('  testCertificateEmail("cert-id-here", "test@example.com")');
  console.log('');
  
  // Make functions globally available
  window.runEmailDiagnostics = runEmailDiagnostics;
  window.testCertificateEmail = testCertificateEmail;
  
  console.log('🎯 Functions are now available globally. Try running: runEmailDiagnostics()');
}).catch(error => {
  console.error('❌ Failed to load email diagnostics:', error);
});