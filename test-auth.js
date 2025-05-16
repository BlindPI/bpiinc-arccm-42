// Simple script to test authentication flow
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('=== Authentication Flow Test ===');
console.log('This script will help verify that the authentication fixes are working correctly.');

// Check if the project is using npm or yarn
let packageManager = 'npm';
if (fs.existsSync(path.join(__dirname, 'yarn.lock'))) {
  packageManager = 'yarn';
}

// Function to run a command and return the output
function runCommand(command) {
  try {
    return execSync(command, { encoding: 'utf8', stdio: 'pipe' });
  } catch (error) {
    console.error(`Error running command: ${command}`);
    console.error(error.message);
    return null;
  }
}

// Check if the development server is already running
console.log('\n1. Checking if development server is running...');
let serverRunning = false;
try {
  // Try to make a request to the development server
  const http = require('http');
  const req = http.get('http://localhost:3000', (res) => {
    serverRunning = res.statusCode === 200;
    console.log(`Development server is ${serverRunning ? 'running' : 'not running'}.`);
    continueTests();
  });
  req.on('error', () => {
    console.log('Development server is not running.');
    continueTests();
  });
  req.end();
} catch (error) {
  console.log('Development server is not running.');
  continueTests();
}

function continueTests() {
  // If server is not running, suggest starting it
  if (!serverRunning) {
    console.log('\nPlease start the development server in a separate terminal:');
    console.log(`${packageManager === 'npm' ? 'npm run dev' : 'yarn dev'}`);
    console.log('\nThen test the authentication flow by:');
  } else {
    console.log('\nTest the authentication flow by:');
  }

  // Provide instructions for manual testing
  console.log('1. Open http://localhost:3000/auth-diagnostic in your browser');
  console.log('2. Check the "Auth Context State" section to verify authentication state');
  console.log('3. Click "Clear Session" to log out');
  console.log('4. Navigate to http://localhost:3000 and verify you are redirected to the login page');
  console.log('5. Log in with valid credentials');
  console.log('6. Verify you are redirected to the dashboard without getting stuck in a loading loop');
  
  console.log('\n=== Diagnostic Information ===');
  console.log('Modified files:');
  console.log('- src/hooks/auth/useAuthInit.ts - Added safety timeout and improved error handling');
  console.log('- src/utils/authUtils.ts - Added timeout to profile fetching to prevent hanging');
  console.log('- src/pages/Index.tsx - Improved loading state handling to prevent redirect loops');
  console.log('- src/pages/Auth.tsx - Improved loading state handling to prevent redirect loops');
  console.log('- src/pages/AuthDiagnostic.tsx - Added diagnostic page to help troubleshoot auth issues');
  
  console.log('\nIf you encounter any issues:');
  console.log('1. Check the browser console for error messages');
  console.log('2. Look for the "🔍 DEBUG:" log messages we added');
  console.log('3. Use the Auth Diagnostic page to verify authentication state');
}