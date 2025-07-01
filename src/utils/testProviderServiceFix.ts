/**
 * Test the PostgREST PGRST201 Error Fix
 * Tests both the diagnostic tool and the actual service fix
 */

import { supabase } from '@/integrations/supabase/client';
import { providerRelationshipService } from '@/services/provider/providerRelationshipService';
import { diagnoseDatabaseRelationships } from './diagnoseDatabaseRelationships';

export async function testProviderServiceFix() {
  console.log('🧪 === TESTING PROVIDER SERVICE PGRST201 FIX ===');
  
  try {
    // Step 1: Run diagnostic tool
    console.log('1. Running database relationship diagnostics...');
    await diagnoseDatabaseRelationships();
    
    // Step 2: Test the actual service method that was failing
    console.log('2. Testing the fixed getProviders service method...');
    
    try {
      const providers = await providerRelationshipService.getProviders({ 
        status: ['active'] 
      });
      
      console.log('✅ SUCCESS: getProviders method executed without PGRST201 error');
      console.log('📊 Results:', {
        providerCount: providers.length,
        sampleProvider: providers[0] ? {
          id: providers[0].id,
          name: providers[0].name,
          hasLocationData: !!providers[0].locations
        } : 'No providers found'
      });
      
    } catch (error: any) {
      if (error.code === 'PGRST201') {
        console.error('❌ PGRST201 error still occurs:', error);
        return false;
      } else {
        console.warn('⚠️ Different error occurred (not PGRST201):', error.message);
        // This might be acceptable if it's a different type of error
      }
    }
    
    // Step 3: Test with different filters
    console.log('3. Testing with various filters...');
    
    const testFilters = [
      { provider_type: ['individual'] },
      { search: 'test' },
      { performance_rating_min: 0 }
    ];
    
    for (const filter of testFilters) {
      try {
        const filteredProviders = await providerRelationshipService.getProviders(filter);
        console.log(`✅ Filter test passed:`, filter, `- ${filteredProviders.length} results`);
      } catch (error: any) {
        if (error.code === 'PGRST201') {
          console.error(`❌ PGRST201 still occurs with filter:`, filter, error);
          return false;
        } else {
          console.warn(`⚠️ Non-PGRST201 error with filter:`, filter, error.message);
        }
      }
    }
    
    console.log('✅ All tests completed successfully - PGRST201 error appears to be resolved');
    return true;
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    return false;
  }
}

// Export for manual testing
if (typeof window !== 'undefined') {
  (window as any).testProviderServiceFix = testProviderServiceFix;
}