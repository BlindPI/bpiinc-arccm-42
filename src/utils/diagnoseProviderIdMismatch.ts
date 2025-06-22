/**
 * DIAGNOSTIC UTILITY: Provider ID Type Mismatch
 * 
 * This utility diagnoses the UUID vs BigInt type mismatch in provider_navigation_configs table
 * that's causing "invalid input syntax for type bigint" errors.
 */

import { supabase } from '@/integrations/supabase/client';

export interface ProviderIdDiagnostic {
  issue_type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  detected: boolean;
  description: string;
  evidence?: any;
  recommended_fix: string;
}

export async function diagnoseProviderIdMismatch(userId?: string): Promise<ProviderIdDiagnostic[]> {
  const diagnostics: ProviderIdDiagnostic[] = [];
  
  console.log('🔍 DIAGNOSIS: Starting Provider ID Type Mismatch Analysis');
  
  try {
    // 1. Check authorized_providers table structure and data types
    console.log('🔍 DIAGNOSIS: Checking authorized_providers table...');
    
    const { data: providers, error: providersError } = await supabase
      .from('authorized_providers')
      .select('id, name, user_id')
      .limit(3);
    
    if (providersError) {
      diagnostics.push({
        issue_type: 'authorized_providers_access_failure',
        severity: 'critical',
        detected: true,
        description: 'Cannot access authorized_providers table',
        evidence: providersError,
        recommended_fix: 'Check RLS policies and table permissions'
      });
    } else {
      console.log('✅ DIAGNOSIS: authorized_providers accessible, sample data:', providers?.slice(0, 2));
      
      // Check if provider IDs are UUIDs
      if (providers && providers.length > 0) {
        const sampleId = providers[0].id;
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sampleId);
        
        diagnostics.push({
          issue_type: 'authorized_providers_id_format',
          severity: 'medium',
          detected: !isUUID,
          description: `authorized_providers.id format: ${isUUID ? 'UUID (correct)' : 'Non-UUID (unexpected)'}`,
          evidence: { sampleId, isUUID },
          recommended_fix: isUUID ? 'No action needed' : 'Convert provider IDs to UUID format'
        });
      }
    }
    
    // 2. Check provider_navigation_configs table structure
    console.log('🔍 DIAGNOSIS: Checking provider_navigation_configs table...');
    
    const { data: navConfigs, error: navError } = await supabase
      .from('provider_navigation_configs')
      .select('*')
      .limit(3);
    
    if (navError) {
      diagnostics.push({
        issue_type: 'provider_navigation_configs_access',
        severity: 'high',
        detected: true,
        description: 'Cannot access provider_navigation_configs table - this is the problematic table',
        evidence: navError,
        recommended_fix: 'Check if table exists and has correct schema'
      });
      
      // This is likely the main issue - table might not exist or have wrong schema
      console.error('❌ DIAGNOSIS: provider_navigation_configs table access failed:', navError);
      
    } else {
      console.log('✅ DIAGNOSIS: provider_navigation_configs accessible, sample data:', navConfigs?.slice(0, 2));
      
      // Check provider_id data types in the results
      if (navConfigs && navConfigs.length > 0) {
        const sampleProviderId = navConfigs[0].provider_id;
        const providerIdType = typeof sampleProviderId;
        const isUUID = typeof sampleProviderId === 'string' && 
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sampleProviderId);
        const isInteger = typeof sampleProviderId === 'number' || 
          (typeof sampleProviderId === 'string' && /^\d+$/.test(sampleProviderId));
        
        diagnostics.push({
          issue_type: 'provider_navigation_configs_provider_id_type',
          severity: 'critical',
          detected: !isUUID,
          description: `provider_navigation_configs.provider_id is ${providerIdType}${isInteger ? ' (integer)' : ''}${isUUID ? ' (UUID)' : ''} - should be UUID`,
          evidence: { sampleProviderId, providerIdType, isUUID, isInteger },
          recommended_fix: 'ALTER TABLE provider_navigation_configs ALTER COLUMN provider_id TYPE uuid USING provider_id::uuid'
        });
      } else {
        diagnostics.push({
          issue_type: 'provider_navigation_configs_empty',
          severity: 'medium',
          detected: true,
          description: 'provider_navigation_configs table is empty - cannot validate schema',
          evidence: { count: 0 },
          recommended_fix: 'Add test data or check table schema directly'
        });
      }
    }
    
    // 3. Test the problematic query pattern
    console.log('🔍 DIAGNOSIS: Testing problematic query pattern...');
    
    if (userId) {
      try {
        // This is the exact query from line 79-95 that's failing
        const { data: providerData, error: providerQueryError } = await supabase
          .from('authorized_providers')
          .select('id')
          .eq('user_id', userId)
          .single();
        
        if (!providerQueryError && providerData) {
          console.log('🔍 DIAGNOSIS: Got provider data for user:', providerData);
          
          // Now try the problematic query that causes the error
          try {
            console.log('🔍 DIAGNOSIS: Testing query with provider_id:', providerData.id);
            
            // Try to query - this will fail if schema mismatch exists
            const { data: testNavConfig, error: testNavError } = await supabase
              .from('provider_navigation_configs')
              .select('*')
              .eq('provider_id', providerData.id) // This will cause error if bigint vs uuid mismatch
              .limit(1);
            
            if (testNavError) {
              // Check if it's the specific type mismatch error
              const isTypeMismatchError = testNavError.message?.includes('invalid input syntax for type bigint') ||
                                        testNavError.message?.includes('bigint') ||
                                        testNavError.code === '22P02';
              
              diagnostics.push({
                issue_type: 'uuid_to_bigint_query_error',
                severity: 'critical',
                detected: isTypeMismatchError,
                description: isTypeMismatchError
                  ? 'Confirmed: UUID provider_id cannot be queried against bigint field'
                  : 'Query failed with different error',
                evidence: {
                  error: testNavError,
                  providerId: providerData.id,
                  query: 'provider_navigation_configs WHERE provider_id = UUID',
                  isTypeMismatchError
                },
                recommended_fix: isTypeMismatchError
                  ? 'Run the database migration to change provider_id from bigint to uuid'
                  : 'Check table permissions and structure'
              });
            } else {
              diagnostics.push({
                issue_type: 'uuid_to_bigint_query_success',
                severity: 'low',
                detected: false,
                description: 'Query succeeded - schema is correctly configured as uuid type',
                evidence: { testNavConfig, providerId: providerData.id },
                recommended_fix: 'No database schema action needed'
              });
            }
          } catch (testError) {
            diagnostics.push({
              issue_type: 'uuid_to_bigint_query_exception',
              severity: 'critical',
              detected: true,
              description: 'Exception during UUID to bigint query test',
              evidence: testError,
              recommended_fix: 'Fix database schema mismatch or check permissions'
            });
          }
        }
      } catch (userQueryError) {
        console.error('🔍 DIAGNOSIS: Could not get provider for user:', userQueryError);
      }
    }
    
    // 4. Check the parseInt issue
    console.log('🔍 DIAGNOSIS: Testing parseInt conversion issue...');
    
    const testUUID = 'd6700479-c25e-434a-8954-51c716fb140a';
    const parseIntResult = parseInt(testUUID);
    
    diagnostics.push({
      issue_type: 'parseint_uuid_conversion',
      severity: 'critical',
      detected: isNaN(parseIntResult),
      description: `parseInt(UUID) conversion: ${isNaN(parseIntResult) ? 'FAILS' : 'Success'} - this causes the error on line 165`,
      evidence: { testUUID, parseIntResult, isNaN: isNaN(parseIntResult) },
      recommended_fix: 'Remove parseInt() conversion and fix database schema to use UUID type'
    });
    
  } catch (error) {
    console.error('🔍 DIAGNOSIS: Diagnostic process failed:', error);
    diagnostics.push({
      issue_type: 'diagnostic_failure',
      severity: 'high',
      detected: true,
      description: 'Diagnostic process encountered an error',
      evidence: error,
      recommended_fix: 'Check database connectivity and permissions'
    });
  }
  
  return diagnostics;
}

export async function logProviderIdDiagnosticResults(diagnostics: ProviderIdDiagnostic[]): Promise<void> {
  console.log('\n🔍 PROVIDER ID TYPE MISMATCH DIAGNOSTIC RESULTS');
  console.log('================================================');
  
  const criticalIssues = diagnostics.filter(d => d.detected && d.severity === 'critical');
  const highIssues = diagnostics.filter(d => d.detected && d.severity === 'high');
  const allDetected = diagnostics.filter(d => d.detected);
  
  console.log(`📊 SUMMARY: ${allDetected.length} issues detected (${criticalIssues.length} critical, ${highIssues.length} high)`);
  
  if (criticalIssues.length > 0) {
    console.log('\n🔴 CRITICAL ISSUES:');
    criticalIssues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue.issue_type}: ${issue.description}`);
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
  
  console.log('\n🔧 RECOMMENDED ACTIONS:');
  const fixes = [...new Set(allDetected.map(d => d.recommended_fix))];
  fixes.forEach((fix, index) => {
    console.log(`${index + 1}. ${fix}`);
  });
  
  console.log('\n================================================');
}