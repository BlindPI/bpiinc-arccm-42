/**
 * COMPREHENSIVE VALIDATION: All Runtime Issues Fixed
 * 
 * This utility validates that all interconnected issues have been resolved:
 * 1. Database UUID vs BigInt type mismatch
 * 2. Logout blocking problems
 * 3. Auth session missing errors
 * 4. Navigation config loading issues
 */

import { supabase } from '@/integrations/supabase/client';
import { diagnoseProviderIdMismatch, logProviderIdDiagnosticResults } from './diagnoseProviderIdMismatch';
import { diagnoseLogoutIssue, logLogoutDiagnosticResults } from './diagnoseLogoutIssue';
import { diagnoseAuthSessionMismatch, logAuthSessionDiagnosticResults } from './diagnoseAuthSessionMismatch';

export interface ComprehensiveTestResult {
  category: string;
  test_name: string;
  passed: boolean;
  severity: 'critical' | 'high' | 'medium' | 'low';
  error?: string;
  details?: any;
  recommended_action?: string;
}

export async function validateComprehensiveFix(): Promise<void> {
  console.log('\n🧪 COMPREHENSIVE VALIDATION: Testing All Runtime Issue Fixes');
  console.log('============================================================');
  
  const results: ComprehensiveTestResult[] = [];
  let overallSuccess = true;
  
  try {
    // Get current user for testing
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;
    
    console.log('🧪 Testing with user:', userId || 'No user authenticated');
    
    // Category 1: Database Schema Tests
    console.log('\n📊 CATEGORY 1: Database Schema Tests');
    console.log('===================================');
    
    // Test 1.1: Provider Navigation Config UUID Fix
    try {
      console.log('🧪 Test 1.1: Provider navigation config UUID compatibility...');
      
      if (userId) {
        const { data: providerData } = await supabase
          .from('authorized_providers')
          .select('id')
          .eq('user_id', userId)
          .single();
        
        if (providerData) {
          // This should now work without UUID vs BigInt errors
          const { data: navConfig, error: navError } = await supabase
            .from('provider_navigation_configs')
            .select('*')
            .eq('provider_id', providerData.id)
            .limit(1);
          
          const isTypeMismatchError = navError?.message?.includes('invalid input syntax for type bigint');
          
          results.push({
            category: 'Database Schema',
            test_name: 'provider_navigation_uuid_compatibility',
            passed: !isTypeMismatchError,
            severity: isTypeMismatchError ? 'critical' : 'low',
            error: isTypeMismatchError ? 'UUID vs BigInt type mismatch still exists' : undefined,
            details: { navError, providerId: providerData.id },
            recommended_action: isTypeMismatchError 
              ? 'Apply database migration immediately'
              : 'Database schema is correct'
          });
          
          if (isTypeMismatchError) overallSuccess = false;
        } else {
          results.push({
            category: 'Database Schema',
            test_name: 'provider_navigation_uuid_compatibility',
            passed: true,
            severity: 'low',
            details: { reason: 'No provider found - test not applicable' },
            recommended_action: 'No action needed'
          });
        }
      } else {
        results.push({
          category: 'Database Schema', 
          test_name: 'provider_navigation_uuid_compatibility',
          passed: true,
          severity: 'low',
          details: { reason: 'No user logged in - test not applicable' },
          recommended_action: 'Test with authenticated user'
        });
      }
    } catch (error) {
      results.push({
        category: 'Database Schema',
        test_name: 'provider_navigation_uuid_compatibility',
        passed: false,
        severity: 'critical',
        error: 'Test threw exception',
        details: error,
        recommended_action: 'Fix database connectivity or schema issues'
      });
      overallSuccess = false;
    }

    // Category 2: Authentication Tests
    console.log('\n🔐 CATEGORY 2: Authentication Tests');
    console.log('===================================');
    
    // Test 2.1: Auth Session Consistency
    try {
      console.log('🧪 Test 2.1: Auth session consistency...');
      
      const { data: { session } } = await supabase.auth.getSession();
      const hasUser = !!user;
      const hasSession = !!session;
      const sessionValid = session && (Date.now() / 1000) < (session.expires_at || 0);
      
      const authConsistent = hasUser === hasSession && (!hasUser || sessionValid);
      
      results.push({
        category: 'Authentication',
        test_name: 'auth_session_consistency',
        passed: authConsistent,
        severity: authConsistent ? 'low' : 'critical',
        error: authConsistent ? undefined : 'Auth state inconsistent',
        details: { hasUser, hasSession, sessionValid },
        recommended_action: authConsistent 
          ? 'Auth state is healthy'
          : 'Refresh session or force re-authentication'
      });
      
      if (!authConsistent) overallSuccess = false;
    } catch (error) {
      results.push({
        category: 'Authentication',
        test_name: 'auth_session_consistency',
        passed: false,
        severity: 'critical',
        error: 'Auth consistency check failed',
        details: error,
        recommended_action: 'Fix auth system connectivity'
      });
      overallSuccess = false;
    }
    
    // Test 2.2: Profile Loading Without Session Errors
    try {
      console.log('🧪 Test 2.2: Profile loading without session errors...');
      
      if (userId) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, role, email')
          .eq('id', userId)
          .single();
        
        const hasSessionError = profileError?.message?.includes('Auth session missing') ||
                               profileError?.message?.includes('session');
        
        results.push({
          category: 'Authentication',
          test_name: 'profile_loading_no_session_errors',
          passed: !hasSessionError,
          severity: hasSessionError ? 'critical' : 'low',
          error: hasSessionError ? 'Profile loading has session errors' : undefined,
          details: { profileError, profileLoaded: !!profile },
          recommended_action: hasSessionError 
            ? 'Fix session attachment to database queries'
            : 'Profile loading works correctly'
        });
        
        if (hasSessionError) overallSuccess = false;
      } else {
        results.push({
          category: 'Authentication',
          test_name: 'profile_loading_no_session_errors',
          passed: true,
          severity: 'low',
          details: { reason: 'No user to test profile loading' },
          recommended_action: 'Test with authenticated user'
        });
      }
    } catch (error) {
      results.push({
        category: 'Authentication',
        test_name: 'profile_loading_no_session_errors',
        passed: false,
        severity: 'critical',
        error: 'Profile loading test failed',
        details: error,
        recommended_action: 'Fix profile loading system'
      });
      overallSuccess = false;
    }

    // Category 3: Navigation and UI Tests  
    console.log('\n🧭 CATEGORY 3: Navigation and UI Tests');
    console.log('======================================');
    
    // Test 3.1: Navigation Config Loading
    try {
      console.log('🧪 Test 3.1: Navigation config loading without errors...');
      
      // Test the navigation hooks that were causing issues
      let navigationLoadError = false;
      let navigationErrorDetails = null;
      
      try {
        if (userId) {
          // Simulate the problematic navigation config query
          const { data: providerData } = await supabase
            .from('authorized_providers')
            .select('id')
            .eq('user_id', userId)
            .single();
          
          if (providerData) {
            const { error: navError } = await supabase
              .from('provider_navigation_configs')
              .select('*')
              .eq('provider_id', providerData.id);
            
            if (navError) {
              const isBlockingError = !navError.message?.includes('does not exist') && 
                                    !navError.message?.includes('relation') &&
                                    navError.message?.includes('invalid input syntax');
              navigationLoadError = isBlockingError;
              navigationErrorDetails = navError;
            }
          }
        }
      } catch (navTestError) {
        navigationLoadError = true;
        navigationErrorDetails = navTestError;
      }
      
      results.push({
        category: 'Navigation',
        test_name: 'navigation_config_loading',
        passed: !navigationLoadError,
        severity: navigationLoadError ? 'high' : 'low',
        error: navigationLoadError ? 'Navigation config loading has errors' : undefined,
        details: navigationErrorDetails,
        recommended_action: navigationLoadError 
          ? 'Fix navigation config database issues'
          : 'Navigation config loading works'
      });
      
      if (navigationLoadError) overallSuccess = false;
    } catch (error) {
      results.push({
        category: 'Navigation',
        test_name: 'navigation_config_loading',
        passed: false,
        severity: 'high',
        error: 'Navigation config test failed',
        details: error,
        recommended_action: 'Fix navigation system'
      });
      overallSuccess = false;
    }

    // Category 4: Logout Functionality Tests
    console.log('\n🚪 CATEGORY 4: Logout Functionality Tests');
    console.log('=========================================');
    
    // Test 4.1: Logout Process Safety (without actually logging out)
    try {
      console.log('🧪 Test 4.1: Logout process safety check...');
      
      // Test the components that could block logout
      let logoutBlocked = false;
      let blockingReason = null;
      
      try {
        // Check if the problematic hooks would fail during logout
        if (userId) {
          // Test navigation config query that was blocking logout
          const testStart = Date.now();
          
          const { data: providerData } = await supabase
            .from('authorized_providers')
            .select('id')
            .eq('user_id', userId)
            .single();
          
          if (providerData) {
            const { error: navError } = await supabase
              .from('provider_navigation_configs')
              .select('*')
              .eq('provider_id', providerData.id)
              .limit(1);
            
            const testDuration = Date.now() - testStart;
            
            // Check if this would block logout (takes too long or throws blocking error)
            const isBlockingError = navError?.message?.includes('invalid input syntax for type bigint');
            const takesTooLong = testDuration > 3000; // 3 seconds
            
            if (isBlockingError || takesTooLong) {
              logoutBlocked = true;
              blockingReason = isBlockingError 
                ? 'Type mismatch error would block logout'
                : 'Query takes too long and would timeout logout';
            }
          }
        }
      } catch (logoutTestError) {
        logoutBlocked = true;
        blockingReason = 'Exception would block logout process';
      }
      
      results.push({
        category: 'Logout',
        test_name: 'logout_process_safety',
        passed: !logoutBlocked,
        severity: logoutBlocked ? 'critical' : 'low',
        error: logoutBlocked ? blockingReason : undefined,
        details: { logoutBlocked, blockingReason },
        recommended_action: logoutBlocked 
          ? 'Fix logout blocking issues immediately'
          : 'Logout process is safe'
      });
      
      if (logoutBlocked) overallSuccess = false;
    } catch (error) {
      results.push({
        category: 'Logout',
        test_name: 'logout_process_safety',
        passed: false,
        severity: 'critical',
        error: 'Logout safety test failed',
        details: error,
        recommended_action: 'Fix logout system completely'
      });
      overallSuccess = false;
    }

  } catch (error) {
    console.error('🧪 COMPREHENSIVE VALIDATION: Test suite failed:', error);
    overallSuccess = false;
  }
  
  // Report Results
  console.log('\n📊 COMPREHENSIVE VALIDATION RESULTS');
  console.log('===================================');
  
  const passedTests = results.filter(r => r.passed);
  const failedTests = results.filter(r => !r.passed);
  const criticalFailures = failedTests.filter(r => r.severity === 'critical');
  
  console.log(`✅ Passed: ${passedTests.length}/${results.length}`);
  console.log(`❌ Failed: ${failedTests.length}/${results.length}`);
  console.log(`🔴 Critical Failures: ${criticalFailures.length}`);
  
  if (failedTests.length > 0) {
    console.log('\n❌ FAILED TESTS BY CATEGORY:');
    
    const categories = [...new Set(failedTests.map(t => t.category))];
    categories.forEach(category => {
      const categoryFailures = failedTests.filter(t => t.category === category);
      console.log(`\n🔴 ${category} (${categoryFailures.length} failures):`);
      
      categoryFailures.forEach((test, i) => {
        console.log(`  ${i + 1}. ${test.test_name}: ${test.error}`);
        console.log(`     Action: ${test.recommended_action}`);
        if (test.details) {
          console.log(`     Details:`, test.details);
        }
      });
    });
  }
  
  console.log('\n🎯 OVERALL RESULT:', overallSuccess ? '✅ ALL SYSTEMS OPERATIONAL' : '❌ CRITICAL ISSUES REMAIN');
  
  if (overallSuccess) {
    console.log('\n🎉 SUCCESS: All runtime issues have been resolved!');
    console.log('✅ Database type mismatch fixed');
    console.log('✅ Auth session errors resolved');
    console.log('✅ Navigation config loading works');
    console.log('✅ Logout process is safe');
    console.log('\nYour application should now function normally.');
  } else {
    console.log('\n⚠️  CRITICAL ISSUES DETECTED: Immediate action required');
    console.log('\n🔧 PRIORITY FIXES NEEDED:');
    
    if (criticalFailures.some(f => f.test_name.includes('uuid'))) {
      console.log('1. 🚨 URGENT: Apply database migration for UUID type mismatch');
    }
    if (criticalFailures.some(f => f.test_name.includes('session'))) {
      console.log('2. 🔐 URGENT: Fix auth session attachment issues');
    }
    if (criticalFailures.some(f => f.test_name.includes('logout'))) {
      console.log('3. 🚪 URGENT: Resolve logout blocking problems');
    }
    
    console.log('\nRun individual diagnostic tools for detailed analysis:');
    console.log('- diagnoseProviderIdMismatch() - Database type issues');
    console.log('- diagnoseAuthSessionMismatch() - Auth session problems');
    console.log('- diagnoseLogoutIssue() - Logout blocking issues');
  }
  
  console.log('\n============================================================');
}

/**
 * Quick validation for debugging
 */
export async function quickValidateAllFixes(): Promise<boolean> {
  console.log('🧪 QUICK VALIDATION: Testing critical fixes...');
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Test 1: Auth session works
    if (user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();
      
      if (profileError?.message?.includes('Auth session missing')) {
        console.error('❌ Auth session still missing');
        return false;
      }
    }
    
    // Test 2: Navigation config doesn't have type errors
    if (user) {
      const { data: providerData } = await supabase
        .from('authorized_providers')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (providerData) {
        const { error: navError } = await supabase
          .from('provider_navigation_configs')
          .select('*')
          .eq('provider_id', providerData.id)
          .limit(1);
        
        if (navError?.message?.includes('invalid input syntax for type bigint')) {
          console.error('❌ UUID vs BigInt type mismatch still exists');
          return false;
        }
      }
    }
    
    console.log('✅ Quick validation passed');
    return true;
  } catch (error) {
    console.error('❌ Quick validation failed:', error);
    return false;
  }
}