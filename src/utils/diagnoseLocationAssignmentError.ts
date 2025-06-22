/**
 * LOCATION ASSIGNMENT DIAGNOSTIC UTILITY
 * 
 * This utility diagnoses the specific 403 Forbidden error occurring during location assignment
 * by testing the exact PATCH operation that's failing and checking RLS policies.
 */

import { supabase } from '@/integrations/supabase/client';

export interface LocationAssignmentDiagnostic {
  issue_type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  detected: boolean;
  error_details?: any;
  remediation_steps: string[];
}

export async function diagnoseLocationAssignmentError(
  providerId: string, 
  locationId: string
): Promise<LocationAssignmentDiagnostic[]> {
  const diagnostics: LocationAssignmentDiagnostic[] = [];
  
  console.log('🔍 DIAGNOSTIC: Starting location assignment error diagnosis');
  console.log('🔍 DIAGNOSTIC: Provider ID:', providerId);
  console.log('🔍 DIAGNOSTIC: Location ID:', locationId);

  // Test 1: Check current user authentication
  try {
    const { data: currentUser, error: authError } = await supabase.auth.getUser();
    
    if (authError || !currentUser?.user) {
      diagnostics.push({
        issue_type: 'authentication_failure',
        severity: 'critical',
        description: 'User not properly authenticated',
        detected: true,
        error_details: authError,
        remediation_steps: [
          'Re-login to the application',
          'Check if session has expired',
          'Verify authentication tokens'
        ]
      });
    } else {
      console.log('🔍 DIAGNOSTIC: User authenticated successfully');
      console.log('🔍 DIAGNOSTIC: User ID:', currentUser.user.id);
      console.log('🔍 DIAGNOSTIC: User Email:', currentUser.user.email);
      console.log('🔍 DIAGNOSTIC: User Role:', currentUser.user.role);
    }
  } catch (error) {
    diagnostics.push({
      issue_type: 'authentication_error',
      severity: 'critical',
      description: 'Failed to check user authentication',
      detected: true,
      error_details: error,
      remediation_steps: ['Check Supabase client configuration', 'Verify network connectivity']
    });
  }

  // Test 2: Test provider read access
  try {
    console.log('🔍 DIAGNOSTIC: Testing provider read access...');
    const { data: providerRead, error: readError } = await supabase
      .from('authorized_providers')
      .select('id, name, status, primary_location_id')
      .eq('id', providerId)
      .single();
    
    if (readError) {
      diagnostics.push({
        issue_type: 'provider_read_access_denied',
        severity: 'high',
        description: 'Cannot read provider data - RLS policy may be blocking read access',
        detected: true,
        error_details: readError,
        remediation_steps: [
          'Check RLS policies on authorized_providers table for SELECT operations',
          'Verify user has proper role/permissions for reading provider data',
          'Check if provider exists and user has access to it'
        ]
      });
    } else {
      console.log('🔍 DIAGNOSTIC: Provider read access successful');
      console.log('🔍 DIAGNOSTIC: Provider data:', providerRead);
    }
  } catch (error) {
    diagnostics.push({
      issue_type: 'provider_read_error',
      severity: 'high',
      description: 'Error occurred while testing provider read access',
      detected: true,
      error_details: error,
      remediation_steps: ['Check database connectivity', 'Verify table structure']
    });
  }

  // Test 3: Test the exact PATCH operation that's failing
  try {
    console.log('🔍 DIAGNOSTIC: Testing PATCH operation on authorized_providers...');
    const { data: patchResult, error: patchError } = await supabase
      .from('authorized_providers')
      .update({
        primary_location_id: locationId,
        updated_at: new Date().toISOString()
      })
      .eq('id', providerId)
      .select('*');
    
    if (patchError) {
      const is403Error = patchError.code === '42501' || 
                         patchError.message?.includes('policy') ||
                         patchError.message?.includes('permission') ||
                         patchError.message?.includes('forbidden');
      
      diagnostics.push({
        issue_type: 'patch_operation_blocked',
        severity: 'critical',
        description: is403Error ? 
          'PATCH operation blocked by RLS policy - User lacks UPDATE permissions' :
          'PATCH operation failed for other reason',
        detected: true,
        error_details: {
          code: patchError.code,
          message: patchError.message,
          details: patchError.details,
          hint: patchError.hint,
          is_rls_policy_error: is403Error
        },
        remediation_steps: is403Error ? [
          'CRITICAL: Check RLS policies on authorized_providers table for UPDATE operations',
          'Verify current user role has UPDATE permissions',
          'Check if policy conditions match current user context',
          'Consider adding policy: CREATE POLICY "Users can update providers" ON authorized_providers FOR UPDATE USING (true);',
          'Or modify existing policy to allow current user/role to perform updates'
        ] : [
          'Check error details for specific database constraint violations',
          'Verify foreign key relationships',
          'Check data types and constraints'
        ]
      });
    } else {
      console.log('🔍 DIAGNOSTIC: PATCH operation successful!');
      console.log('🔍 DIAGNOSTIC: This suggests the issue may be intermittent or context-dependent');
      diagnostics.push({
        issue_type: 'patch_operation_success',
        severity: 'low',
        description: 'PATCH operation succeeded in test - issue may be intermittent',
        detected: false,
        remediation_steps: [
          'Monitor for consistent behavior',
          'Check if issue occurs only in specific contexts',
          'Review application logs for patterns'
        ]
      });
    }
  } catch (error) {
    diagnostics.push({
      issue_type: 'patch_test_error',
      severity: 'critical',
      description: 'Unexpected error during PATCH operation test',
      detected: true,
      error_details: error,
      remediation_steps: [
        'Check network connectivity',
        'Verify Supabase client configuration',
        'Check database availability'
      ]
    });
  }

  // Test 4: Check location existence
  try {
    console.log('🔍 DIAGNOSTIC: Testing location existence...');
    const { data: locationData, error: locationError } = await supabase
      .from('locations')
      .select('id, name, status')
      .eq('id', locationId)
      .single();
    
    if (locationError || !locationData) {
      diagnostics.push({
        issue_type: 'invalid_location_id',
        severity: 'high',
        description: 'Location ID does not exist or is not accessible',
        detected: true,
        error_details: locationError,
        remediation_steps: [
          'Verify location ID is correct',
          'Check if location exists in locations table',
          'Ensure location is active/available'
        ]
      });
    } else {
      console.log('🔍 DIAGNOSTIC: Location exists and is accessible');
      console.log('🔍 DIAGNOSTIC: Location data:', locationData);
    }
  } catch (error) {
    diagnostics.push({
      issue_type: 'location_check_error',
      severity: 'medium',
      description: 'Error occurred while checking location existence',
      detected: true,
      error_details: error,
      remediation_steps: ['Check database connectivity', 'Verify locations table structure']
    });
  }

  // Test 5: Check for competing transactions/locks
  try {
    console.log('🔍 DIAGNOSTIC: Checking for table locks or competing transactions...');
    
    // Try a simple read to see if table is accessible
    const { error: lockError } = await supabase
      .from('authorized_providers')
      .select('id')
      .limit(1);
    
    if (lockError) {
      diagnostics.push({
        issue_type: 'table_access_issue',
        severity: 'medium',
        description: 'Possible table lock or access issue',
        detected: true,
        error_details: lockError,
        remediation_steps: [
          'Check for long-running transactions',
          'Verify database performance',
          'Check for table locks'
        ]
      });
    }
  } catch (error) {
    // Non-critical error
  }

  console.log('🔍 DIAGNOSTIC: Diagnosis complete');
  console.log('🔍 DIAGNOSTIC: Found', diagnostics.filter(d => d.detected).length, 'issues');
  
  return diagnostics;
}

export async function logDiagnosticResults(diagnostics: LocationAssignmentDiagnostic[]): Promise<void> {
  console.log('='.repeat(80));
  console.log('🔍 LOCATION ASSIGNMENT DIAGNOSTIC RESULTS');
  console.log('='.repeat(80));
  
  const criticalIssues = diagnostics.filter(d => d.detected && d.severity === 'critical');
  const highIssues = diagnostics.filter(d => d.detected && d.severity === 'high');
  const mediumIssues = diagnostics.filter(d => d.detected && d.severity === 'medium');
  
  if (criticalIssues.length > 0) {
    console.log('🚨 CRITICAL ISSUES:');
    criticalIssues.forEach(issue => {
      console.log(`   ❌ ${issue.issue_type}: ${issue.description}`);
      console.log(`      Error details:`, issue.error_details);
      console.log(`      Remediation steps:`);
      issue.remediation_steps.forEach(step => console.log(`         - ${step}`));
      console.log('');
    });
  }
  
  if (highIssues.length > 0) {
    console.log('⚠️ HIGH PRIORITY ISSUES:');
    highIssues.forEach(issue => {
      console.log(`   ⚠️ ${issue.issue_type}: ${issue.description}`);
      console.log(`      Remediation steps:`);
      issue.remediation_steps.forEach(step => console.log(`         - ${step}`));
      console.log('');
    });
  }
  
  if (mediumIssues.length > 0) {
    console.log('ℹ️ MEDIUM PRIORITY ISSUES:');
    mediumIssues.forEach(issue => {
      console.log(`   ℹ️ ${issue.issue_type}: ${issue.description}`);
    });
  }
  
  console.log('='.repeat(80));
}