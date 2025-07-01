/**
 * DIAGNOSTIC UTILITY: Auth Session Mismatch
 * 
 * This utility diagnoses authentication state inconsistencies where users
 * have valid IDs but sessions aren't properly attached to database queries.
 */

import { supabase } from '@/integrations/supabase/client';

export interface AuthSessionDiagnostic {
  issue_type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  detected: boolean;
  description: string;
  evidence?: any;
  recommended_fix: string;
}

export async function diagnoseAuthSessionMismatch(): Promise<AuthSessionDiagnostic[]> {
  const diagnostics: AuthSessionDiagnostic[] = [];
  
  console.log('🔍 AUTH SESSION DIAGNOSIS: Starting authentication state analysis');
  
  try {
    // 1. Check auth user vs session state
    console.log('🔍 Test 1: Checking auth user and session state...');
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (userError || sessionError) {
      diagnostics.push({
        issue_type: 'auth_query_failed',
        severity: 'critical',
        detected: true,
        description: 'Cannot query Supabase auth state',
        evidence: { userError, sessionError },
        recommended_fix: 'Check Supabase client configuration and network connectivity'
      });
    } else {
      const hasUser = !!user;
      const hasSession = !!session;
      const userSessionMatch = user?.id === session?.user?.id;
      
      diagnostics.push({
        issue_type: 'auth_user_session_state',
        severity: hasUser && !hasSession ? 'critical' : 'low',
        detected: hasUser && !hasSession,
        description: `User: ${hasUser ? 'exists' : 'missing'}, Session: ${hasSession ? 'exists' : 'missing'}, Match: ${userSessionMatch}`,
        evidence: { 
          hasUser, 
          hasSession, 
          userSessionMatch, 
          userId: user?.id,
          sessionUserId: session?.user?.id,
          sessionExpiry: session?.expires_at
        },
        recommended_fix: hasUser && !hasSession 
          ? 'CRITICAL: Session missing - force re-authentication' 
          : 'Auth state is normal'
      });
      
      // 2. Test database query with current session
      if (user?.id) {
        console.log('🔍 Test 2: Testing database query with current session...');
        
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('id, role, email')
            .eq('id', user.id)
            .single();
          
          if (profileError) {
            const isSessionError = profileError.message?.includes('Auth session missing') ||
                                 profileError.message?.includes('session') ||
                                 profileError.code === '401';
            
            diagnostics.push({
              issue_type: 'database_session_missing',
              severity: 'critical',
              detected: isSessionError,
              description: isSessionError 
                ? 'Database query failed due to missing auth session'
                : 'Database query failed for other reason',
              evidence: { profileError, userId: user.id },
              recommended_fix: isSessionError 
                ? 'URGENT: Refresh or re-establish auth session'
                : 'Check database permissions and RLS policies'
            });
          } else {
            diagnostics.push({
              issue_type: 'database_query_success',
              severity: 'low',
              detected: false,
              description: 'Database query with auth session works correctly',
              evidence: { profileData: !!profileData, role: profileData?.role },
              recommended_fix: 'No action needed for database queries'
            });
          }
        } catch (queryError) {
          diagnostics.push({
            issue_type: 'database_query_exception',
            severity: 'critical',
            detected: true,
            description: 'Database query threw exception - likely session issue',
            evidence: queryError,
            recommended_fix: 'Force session refresh and re-authentication'
          });
        }
      }
      
      // 3. Check session expiry
      if (session) {
        console.log('🔍 Test 3: Checking session expiry...');
        
        const now = Date.now() / 1000;
        const expiresAt = session.expires_at || 0;
        const isExpired = now > expiresAt;
        const expiresInMinutes = Math.max(0, (expiresAt - now) / 60);
        
        diagnostics.push({
          issue_type: 'session_expiry_check',
          severity: isExpired ? 'critical' : expiresInMinutes < 5 ? 'high' : 'low',
          detected: isExpired,
          description: isExpired 
            ? 'Session has expired' 
            : `Session expires in ${Math.round(expiresInMinutes)} minutes`,
          evidence: { 
            now, 
            expiresAt, 
            isExpired, 
            expiresInMinutes: Math.round(expiresInMinutes) 
          },
          recommended_fix: isExpired 
            ? 'URGENT: Session expired - force re-authentication'
            : expiresInMinutes < 5 
              ? 'Session expiring soon - refresh token'
              : 'Session timing is healthy'
        });
      }
      
      // 4. Check refresh token
      if (session?.refresh_token) {
        console.log('🔍 Test 4: Testing refresh token...');
        
        try {
          // Don't actually refresh, just validate we have the token
          diagnostics.push({
            issue_type: 'refresh_token_available',
            severity: 'low',
            detected: false,
            description: 'Refresh token is available for session renewal',
            evidence: { hasRefreshToken: !!session.refresh_token },
            recommended_fix: 'No action needed - can refresh if needed'
          });
        } catch (refreshError) {
          diagnostics.push({
            issue_type: 'refresh_token_issue',
            severity: 'high',
            detected: true,
            description: 'Issue with refresh token availability',
            evidence: refreshError,
            recommended_fix: 'May need to re-authenticate from scratch'
          });
        }
      } else {
        diagnostics.push({
          issue_type: 'no_refresh_token',
          severity: 'high',
          detected: true,
          description: 'No refresh token available - cannot renew session',
          evidence: { session: !!session },
          recommended_fix: 'Force re-authentication to get new tokens'
        });
      }
    }
    
  } catch (error) {
    console.error('🔍 AUTH SESSION DIAGNOSIS: Failed:', error);
    diagnostics.push({
      issue_type: 'diagnostic_failure',
      severity: 'high',
      detected: true,
      description: 'Auth session diagnostic process failed',
      evidence: error,
      recommended_fix: 'Check Supabase client and network connectivity'
    });
  }
  
  return diagnostics;
}

export async function logAuthSessionDiagnosticResults(diagnostics: AuthSessionDiagnostic[]): Promise<void> {
  console.log('\n🔍 AUTH SESSION MISMATCH DIAGNOSTIC RESULTS');
  console.log('============================================');
  
  const criticalIssues = diagnostics.filter(d => d.detected && d.severity === 'critical');
  const highIssues = diagnostics.filter(d => d.detected && d.severity === 'high');
  const allDetected = diagnostics.filter(d => d.detected);
  
  console.log(`📊 SUMMARY: ${allDetected.length} auth session issues found`);
  console.log(`🔴 Critical: ${criticalIssues.length}, 🟡 High: ${highIssues.length}`);
  
  if (criticalIssues.length > 0) {
    console.log('\n🔴 CRITICAL AUTH SESSION ISSUES:');
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
  
  console.log('\n🔧 IMMEDIATE ACTIONS TO FIX AUTH:');
  
  if (criticalIssues.some(i => i.issue_type === 'database_session_missing')) {
    console.log('1. 🚨 URGENT: Session missing from database queries - refresh session');
    console.log('2. 🔄 Force token refresh or re-authentication');
    console.log('3. ✅ Test database queries after session fix');
  } else if (criticalIssues.some(i => i.issue_type === 'session_expiry_check')) {
    console.log('1. ⏰ Session expired - force re-authentication');
    console.log('2. 🔄 Clear any cached auth state');
    console.log('3. 🔐 Redirect to login page');
  } else {
    console.log('1. 🔄 Refresh auth session');
    console.log('2. 🧹 Clear React Query auth caches');
    console.log('3. ✅ Test critical queries');
  }
  
  console.log('\n============================================');
}

/**
 * Emergency session refresh function
 */
export async function emergencySessionRefresh(): Promise<boolean> {
  console.log('🚨 EMERGENCY SESSION REFRESH: Attempting to fix auth session');
  
  try {
    console.log('🚨 Step 1: Getting current session');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('🚨 Cannot get current session:', sessionError);
      return false;
    }
    
    if (!session) {
      console.log('🚨 No session found - redirect to login needed');
      return false;
    }
    
    if (session.refresh_token) {
      console.log('🚨 Step 2: Refreshing session with refresh token');
      
      const { data, error: refreshError } = await supabase.auth.refreshSession({
        refresh_token: session.refresh_token
      });
      
      if (refreshError) {
        console.error('🚨 Session refresh failed:', refreshError);
        return false;
      }
      
      if (data.session) {
        console.log('🚨 Step 3: Session refreshed successfully');
        return true;
      }
    }
    
    console.log('🚨 Session refresh not possible - re-authentication needed');
    return false;
    
  } catch (error) {
    console.error('🚨 EMERGENCY SESSION REFRESH FAILED:', error);
    return false;
  }
}