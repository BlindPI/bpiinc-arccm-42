/**
 * TEST UTILITY: Validate Provider Navigation Config UUID Fix
 * 
 * This utility tests that the UUID vs BigInt type mismatch has been resolved
 * and that provider navigation queries work correctly after the fix.
 */

import { supabase } from '@/integrations/supabase/client';
import { diagnoseProviderIdMismatch, logProviderIdDiagnosticResults } from './diagnoseProviderIdMismatch';

export interface ProviderNavigationTestResult {
  test_name: string;
  passed: boolean;
  error?: string;
  details?: any;
}

export async function testProviderNavigationFix(userId?: string): Promise<void> {
  console.log('\n🧪 TESTING: Provider Navigation Config UUID Fix');
  console.log('=================================================');
  
  const results: ProviderNavigationTestResult[] = [];
  
  try {
    // Test 1: Check database schema using raw SQL
    console.log('🧪 Test 1: Checking database schema...');
    try {
      const { data: schemaInfo, error: schemaError } = await supabase.rpc('get_column_type', {
        table_name: 'provider_navigation_configs',
        column_name: 'provider_id'
      });
      
      if (schemaError) {
        // If RPC doesn't exist, try a simple query to check if table works
        const { data: testData, error: testError } = await supabase
          .from('provider_navigation_configs')
          .select('provider_id')
          .limit(1);
        
        if (testError) {
          results.push({
            test_name: 'database_schema_check',
            passed: false,
            error: 'Table query failed - likely schema issue',
            details: testError
          });
        } else {
          const sampleId = testData?.[0]?.provider_id;
          const isUUID = typeof sampleId === 'string' &&
            /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sampleId);
          
          results.push({
            test_name: 'database_schema_check',
            passed: isUUID,
            error: isUUID ? undefined : `provider_id appears to be ${typeof sampleId}, expected UUID`,
            details: { sampleId, isUUID, sampleType: typeof sampleId }
          });
        }
      } else {
        const isUUID = schemaInfo === 'uuid';
        results.push({
          test_name: 'database_schema_check',
          passed: isUUID,
          error: isUUID ? undefined : `provider_id is ${schemaInfo}, should be uuid`,
          details: { data_type: schemaInfo }
        });
      }
    } catch (error) {
      results.push({
        test_name: 'database_schema_check',
        passed: false,
        error: 'Schema check failed',
        details: error
      });
    }
    
    // Test 2: Test provider query without type conversion
    console.log('🧪 Test 2: Testing provider lookup...');
    if (userId) {
      try {
        const { data: providerData, error: providerError } = await supabase
          .from('authorized_providers')
          .select('id, name')
          .eq('user_id', userId)
          .single();
        
        if (providerError) {
          results.push({
            test_name: 'provider_lookup',
            passed: false,
            error: 'Could not find provider for user',
            details: providerError
          });
        } else {
          results.push({
            test_name: 'provider_lookup',
            passed: true,
            details: { providerId: providerData.id, providerName: providerData.name }
          });
          
          // Test 3: Test navigation config query with UUID
          console.log('🧪 Test 3: Testing navigation config query with UUID...');
          try {
            const { data: navConfig, error: navError } = await supabase
              .from('provider_navigation_configs')
              .select('*')
              .eq('provider_id', providerData.id) // This should now work with UUID
              .limit(1);
            
            if (navError) {
              const isTypeMismatchError = navError.message?.includes('invalid input syntax for type bigint');
              results.push({
                test_name: 'navigation_config_query',
                passed: !isTypeMismatchError,
                error: isTypeMismatchError ? 'Type mismatch still exists' : navError.message,
                details: { error: navError, providerId: providerData.id }
              });
            } else {
              results.push({
                test_name: 'navigation_config_query',
                passed: true,
                details: { 
                  configCount: navConfig?.length || 0,
                  providerId: providerData.id,
                  sampleConfig: navConfig?.[0]
                }
              });
            }
          } catch (navError) {
            results.push({
              test_name: 'navigation_config_query',
              passed: false,
              error: 'Navigation config query failed',
              details: navError
            });
          }
          
          // Test 4: Test upserting navigation config with UUID
          console.log('🧪 Test 4: Testing navigation config upsert...');
          try {
            const testConfig = {
              'Dashboard': { enabled: true, items: { 'Dashboard': true } }
            };
            
            const { data: upsertData, error: upsertError } = await supabase
              .from('provider_navigation_configs')
              .upsert({
                provider_id: providerData.id, // UUID, no parseInt needed
                config_overrides: testConfig,
                is_active: true
              }, {
                onConflict: 'provider_id'
              })
              .select()
              .single();
            
            if (upsertError) {
              const isTypeMismatchError = upsertError.message?.includes('invalid input syntax for type bigint');
              results.push({
                test_name: 'navigation_config_upsert',
                passed: !isTypeMismatchError,
                error: isTypeMismatchError ? 'Type mismatch on upsert' : upsertError.message,
                details: { error: upsertError, providerId: providerData.id }
              });
            } else {
              results.push({
                test_name: 'navigation_config_upsert',
                passed: true,
                details: { 
                  upsertedId: upsertData.id,
                  providerId: upsertData.provider_id,
                  configOverrides: upsertData.config_overrides
                }
              });
            }
          } catch (upsertError) {
            results.push({
              test_name: 'navigation_config_upsert',
              passed: false,
              error: 'Navigation config upsert failed',
              details: upsertError
            });
          }
        }
      } catch (error) {
        results.push({
          test_name: 'provider_lookup',
          passed: false,
          error: 'Provider lookup failed',
          details: error
        });
      }
    } else {
      results.push({
        test_name: 'provider_lookup',
        passed: false,
        error: 'No user ID provided for testing'
      });
    }
    
    // Test 5: Run full diagnostic
    console.log('🧪 Test 5: Running full diagnostic...');
    try {
      const diagnostics = await diagnoseProviderIdMismatch(userId);
      const criticalIssues = diagnostics.filter(d => d.detected && d.severity === 'critical');
      
      results.push({
        test_name: 'full_diagnostic',
        passed: criticalIssues.length === 0,
        details: {
          totalIssues: diagnostics.filter(d => d.detected).length,
          criticalIssues: criticalIssues.length,
          diagnostics: diagnostics
        }
      });
      
      // Log diagnostic results
      await logProviderIdDiagnosticResults(diagnostics);
      
    } catch (diagError) {
      results.push({
        test_name: 'full_diagnostic',
        passed: false,
        error: 'Diagnostic failed',
        details: diagError
      });
    }
    
  } catch (error) {
    console.error('🧪 TESTING: Test suite failed:', error);
  }
  
  // Report results
  console.log('\n📊 TEST RESULTS SUMMARY');
  console.log('========================');
  
  const passedTests = results.filter(r => r.passed);
  const failedTests = results.filter(r => !r.passed);
  
  console.log(`✅ Passed: ${passedTests.length}/${results.length}`);
  console.log(`❌ Failed: ${failedTests.length}/${results.length}`);
  
  if (passedTests.length > 0) {
    console.log('\n✅ PASSED TESTS:');
    passedTests.forEach((test, i) => {
      console.log(`${i + 1}. ${test.test_name}`);
      if (test.details) {
        console.log(`   Details:`, test.details);
      }
    });
  }
  
  if (failedTests.length > 0) {
    console.log('\n❌ FAILED TESTS:');
    failedTests.forEach((test, i) => {
      console.log(`${i + 1}. ${test.test_name}: ${test.error}`);
      if (test.details) {
        console.log(`   Details:`, test.details);
      }
    });
  }
  
  console.log('\n🎯 OVERALL RESULT:', failedTests.length === 0 ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
  
  if (failedTests.length === 0) {
    console.log('\n🎉 Provider Navigation Config UUID fix is working correctly!');
  } else {
    console.log('\n⚠️  Some issues remain. Check the failed tests above and ensure:');
    console.log('   1. Database migration has been applied');
    console.log('   2. Application code has been updated');
    console.log('   3. No cached queries are using old schema');
  }
  
  console.log('\n=================================================');
}

/**
 * Quick test function for debugging
 */
export async function quickTestProviderNavigationFix(): Promise<boolean> {
  console.log('🧪 QUICK TEST: Provider Navigation UUID Fix');
  
  try {
    // Test the basic query that was failing
    const { data, error } = await supabase
      .from('provider_navigation_configs')
      .select('id, provider_id')
      .limit(1);
    
    if (error) {
      console.error('❌ Quick test failed:', error.message);
      return false;
    }
    
    console.log('✅ Quick test passed - provider_navigation_configs query works');
    return true;
  } catch (error) {
    console.error('❌ Quick test exception:', error);
    return false;
  }
}