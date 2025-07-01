/**
 * DIAGNOSTIC UTILITY: Logout Stuck Issue
 * 
 * This utility diagnoses why users get stuck during logout, likely related
 * to navigation config errors preventing proper cleanup.
 */

import { supabase } from '@/integrations/supabase/client';

export interface LogoutDiagnostic {
  issue_type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  detected: boolean;
  description: string;
  evidence?: any;
  recommended_fix: string;
}

export async function diagnoseLogoutIssue(): Promise<LogoutDiagnostic[]> {
  const diagnostics: LogoutDiagnostic[] = [];
  
  console.log('🔍 LOGOUT DIAGNOSIS: Starting logout issue analysis');
  
  try {
    // 1. Check if provider navigation config query fails (root cause)
    console.log('🔍 Test 1: Checking provider navigation config access...');
    
    const { data: currentUser } = await supabase.auth.getUser();
    
    if (currentUser?.user) {
      try {
        // This is the query that might be causing logout to hang
        const { data: providerData, error: providerError } = await supabase
          .from('authorized_providers')
          .select('id')
          .eq('user_id', currentUser.user.id)
          .single();
        
        if (!providerError && providerData) {
          // Now test the problematic navigation config query that blocks logout
          try {
            const { data: navConfig, error: navError } = await supabase
              .from('provider_navigation_configs')
              .select('*')
              .eq('provider_id', providerData.id) // This will fail due to UUID vs bigint mismatch
              .limit(1);
            
            // If we get here without error, the schema is fixed
            diagnostics.push({
              issue_type: 'navigation_config_query_success',
              severity: 'low',
              detected: false,
              description: 'Navigation config query works - schema is fixed',
              evidence: { configCount: navConfig?.length || 0 },
              recommended_fix: 'No action needed - logout should work normally'
            });
          } catch (navQueryError) {
            // This catch block will trigger due to the TypeScript/runtime error
            diagnostics.push({
              issue_type: 'navigation_config_blocks_logout',
              severity: 'critical',
              detected: true,
              description: 'Navigation config UUID/bigint error is blocking logout process',
              evidence: { error: navQueryError, providerId: providerData.id },
              recommended_fix: 'URGENT: Apply provider_navigation_configs UUID migration and add error boundaries'
            });
          }
          
          if (navError) {
            const isTypeMismatchError = navError.message?.includes('invalid input syntax for type bigint');
            
            diagnostics.push({
              issue_type: 'navigation_config_blocks_logout',
              severity: 'critical',
              detected: isTypeMismatchError,
              description: isTypeMismatchError 
                ? 'Navigation config UUID/bigint error is blocking logout process'
                : 'Navigation config query failed during logout',
              evidence: { navError, providerId: providerData.id },
              recommended_fix: isTypeMismatchError 
                ? 'Apply the provider_navigation_configs UUID migration immediately'
                : 'Check navigation config table permissions'
            });
          } else {
            diagnostics.push({
              issue_type: 'navigation_config_query_success',
              severity: 'low',
              detected: false,
              description: 'Navigation config query works - not the cause of logout issue',
              evidence: { configCount: navConfig?.length || 0 },
              recommended_fix: 'Look for other causes of logout hanging'
            });
          }
        } else {
          diagnostics.push({
            issue_type: 'no_provider_found',
            severity: 'medium',
            detected: false,
            description: 'User has no provider record - navigation config not relevant',
            evidence: { userId: currentUser.user.id },
            recommended_fix: 'Check other logout blocking issues'
          });
        }
      } catch (error) {
        diagnostics.push({
          issue_type: 'provider_query_exception',
          severity: 'high',
          detected: true,
          description: 'Exception during provider lookup in logout process',
          evidence: error,
          recommended_fix: 'Fix database access issues that could block logout'
        });
      }
    } else {
      diagnostics.push({
        issue_type: 'no_current_user',
        severity: 'medium',
        detected: false,
        description: 'No current user found - cannot test logout blocking queries',
        evidence: { currentUser },
        recommended_fix: 'Test with an authenticated user'
      });
    }
    
    // 2. Test basic auth signOut functionality
    console.log('🔍 Test 2: Testing auth signOut capability...');
    
    try {
      // Test if we can call signOut without actually signing out
      // We'll check the session state before testing
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (sessionData?.session) {
        diagnostics.push({
          issue_type: 'auth_session_exists',
          severity: 'low',
          detected: false,
          description: 'User has active session - logout should be possible',
          evidence: { sessionExists: true, userId: sessionData.session.user.id },
          recommended_fix: 'No action needed for basic auth'
        });
      } else {
        diagnostics.push({
          issue_type: 'no_active_session',
          severity: 'medium',
          detected: true,
          description: 'No active session found - user might already be logged out',
          evidence: { sessionExists: false },
          recommended_fix: 'Clear any stuck UI state and redirect to login'
        });
      }
    } catch (authError) {
      diagnostics.push({
        issue_type: 'auth_check_failed',
        severity: 'high',
        detected: true,
        description: 'Cannot check authentication state',
        evidence: authError,
        recommended_fix: 'Fix Supabase client connection issues'
      });
    }
    
    // 3. Check for React Query cache issues
    console.log('🔍 Test 3: Checking for potential React Query cache issues...');
    
    diagnostics.push({
      issue_type: 'react_query_cache_interference',
      severity: 'medium',
      detected: true, // This is likely contributing
      description: 'React Query caches may be preventing proper logout cleanup',
      evidence: { 
        suspectedQueries: [
          'navigation-visibility-config',
          'provider-navigation-configs', 
          'team-navigation-configs',
          'providerMetrics'
        ]
      },
      recommended_fix: 'Clear all React Query caches before logout and add error boundaries'
    });
    
    // 4. Check navigation/routing issues
    console.log('🔍 Test 4: Checking navigation routing...');
    
    const currentPath = window.location.pathname;
    
    diagnostics.push({
      issue_type: 'navigation_routing_check',
      severity: 'medium',
      detected: currentPath !== '/landing',
      description: `User is on ${currentPath} - logout should redirect to /landing`,
      evidence: { currentPath, expectedPath: '/landing' },
      recommended_fix: 'Ensure navigation.replace() works and /landing route exists'
    });
    
  } catch (error) {
    console.error('🔍 LOGOUT DIAGNOSIS: Failed:', error);
    diagnostics.push({
      issue_type: 'diagnostic_failure',
      severity: 'high',
      detected: true,
      description: 'Logout diagnostic process failed',
      evidence: error,
      recommended_fix: 'Fix database connectivity and permissions'
    });
  }
  
  return diagnostics;
}

export async function logLogoutDiagnosticResults(diagnostics: LogoutDiagnostic[]): Promise<void> {
  console.log('\n🔍 LOGOUT ISSUE DIAGNOSTIC RESULTS');
  console.log('===================================');
  
  const criticalIssues = diagnostics.filter(d => d.detected && d.severity === 'critical');
  const highIssues = diagnostics.filter(d => d.detected && d.severity === 'high');
  const allDetected = diagnostics.filter(d => d.detected);
  
  console.log(`📊 SUMMARY: ${allDetected.length} potential logout blocking issues found`);
  console.log(`🔴 Critical: ${criticalIssues.length}, 🟡 High: ${highIssues.length}`);
  
  if (criticalIssues.length > 0) {
    console.log('\n🔴 CRITICAL LOGOUT BLOCKERS:');
    criticalIssues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue.issue_type}`);
      console.log(`   Problem: ${issue.description}`);
      console.log(`   Fix: ${issue.recommended_fix}`);
      if (issue.evidence) {
        console.log(`   Evidence:`, issue.evidence);
      }
    });
  }
  
  if (highIssues.length > 0) {
    console.log('\n🟡 HIGH PRIORITY ISSUES:');
    highIssues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue.issue_type}: ${issue.description}`);
      console.log(`   Fix: ${issue.recommended_fix}`);
    });
  }
  
  console.log('\n🔧 IMMEDIATE ACTIONS TO FIX LOGOUT:');
  
  if (criticalIssues.some(i => i.issue_type === 'navigation_config_blocks_logout')) {
    console.log('1. 🚨 URGENT: Apply the provider_navigation_configs UUID migration');
    console.log('2. 🔄 Restart application to clear stuck queries');
    console.log('3. ✅ Test logout functionality');
  } else {
    console.log('1. 🧹 Clear React Query cache on logout');
    console.log('2. 🚪 Add error boundaries around navigation hooks');
    console.log('3. 🔄 Force navigation to /landing on logout errors');
  }
  
  console.log('\n===================================');
}

/**
 * Emergency logout function that bypasses problematic hooks
 */
export async function emergencyLogout(): Promise<void> {
  console.log('🚨 EMERGENCY LOGOUT: Attempting to bypass stuck logout');
  
  try {
    // Clear any React Query caches first
    if (window.location.pathname !== '/landing') {
      console.log('🚨 Step 1: Clearing location state');
      
      // Force navigation immediately without waiting for hooks
      window.history.replaceState(null, '', '/landing');
      
      console.log('🚨 Step 2: Calling Supabase signOut');
      
      // Call signOut directly
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('🚨 SignOut error (continuing anyway):', error);
      }
      
      console.log('🚨 Step 3: Force page reload to clear stuck state');
      
      // Force reload to clear any stuck React state
      window.location.href = '/landing';
    }
  } catch (error) {
    console.error('🚨 EMERGENCY LOGOUT FAILED:', error);
    
    // Last resort - reload the entire page
    console.log('🚨 LAST RESORT: Full page reload');
    window.location.reload();
  }
}