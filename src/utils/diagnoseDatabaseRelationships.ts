/**
 * Database Relationship Diagnostic Tool
 * Specifically for investigating PGRST201 errors with authorized_providers and locations
 */

import { supabase } from '@/integrations/supabase/client';

export async function diagnoseDatabaseRelationships() {
  console.log('🔍 === DIAGNOSING DATABASE RELATIONSHIPS ===');
  
  try {
    // 1. Check authorized_providers table structure
    console.log('1. Checking authorized_providers table structure...');
    const { data: apData, error: apError } = await supabase
      .from('authorized_providers')
      .select('*')
      .limit(1);

    if (apError) {
      console.error('❌ authorized_providers table error:', apError.message);
      return;
    }

    if (apData && apData.length > 0) {
      const columns = Object.keys(apData[0]);
      console.log('✅ authorized_providers columns:', columns);
      
      // Look for location-related foreign keys
      const locationFKs = columns.filter(col => 
        col.includes('location') || 
        col.includes('_location_') ||
        col.endsWith('_location_id')
      );
      console.log('🔍 Location-related foreign keys found:', locationFKs);
    }

    // 2. Check locations table structure  
    console.log('2. Checking locations table structure...');
    const { data: locData, error: locError } = await supabase
      .from('locations')
      .select('*')
      .limit(1);

    if (locError) {
      console.error('❌ locations table error:', locError.message);
    } else if (locData && locData.length > 0) {
      console.log('✅ locations columns:', Object.keys(locData[0]));
    }

    // 3. Test the problematic relationship query
    console.log('3. Testing the original problematic query...');
    try {
      const { data: testData, error: testError } = await supabase
        .from('authorized_providers')
        .select(`
          *,
          locations:primary_location_id(id, name, city, state)
        `)
        .limit(1);

      if (testError) {
        console.error('❌ Original query failed with error:', {
          code: testError.code,
          message: testError.message,
          details: testError.details,
          hint: testError.hint
        });
      } else {
        console.log('✅ Original query succeeded unexpectedly');
      }
    } catch (error) {
      console.error('❌ Original query threw exception:', error);
    }

    // 4. Test the fixed relationship query
    console.log('4. Testing the fixed query with explicit FK specification...');
    try {
      const { data: fixedData, error: fixedError } = await supabase
        .from('authorized_providers')
        .select(`
          *,
          primary_location:locations!primary_location_id(id, name, city, state)
        `)
        .limit(1);

      if (fixedError) {
        console.error('❌ Fixed query failed:', {
          code: fixedError.code,
          message: fixedError.message,
          details: fixedError.details,
          hint: fixedError.hint
        });
      } else {
        console.log('✅ Fixed query succeeded');
        if (fixedData && fixedData.length > 0) {
          console.log('Sample result structure:', Object.keys(fixedData[0]));
        }
      }
    } catch (error) {
      console.error('❌ Fixed query threw exception:', error);
    }

    // 5. Test fallback query without relationships
    console.log('5. Testing fallback query without relationships...');
    try {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('authorized_providers')
        .select('*')
        .limit(1);

      if (fallbackError) {
        console.error('❌ Fallback query failed:', fallbackError);
      } else {
        console.log('✅ Fallback query succeeded');
        if (fallbackData && fallbackData.length > 0) {
          console.log('Sample fallback structure:', Object.keys(fallbackData[0]));
        }
      }
    } catch (error) {
      console.error('❌ Fallback query threw exception:', error);
    }

  } catch (error) {
    console.error('❌ Diagnostic error:', error);
  }

  console.log('🔍 === END RELATIONSHIP DIAGNOSIS ===');
}

// Export for manual calling
if (typeof window !== 'undefined') {
  (window as any).diagnoseDatabaseRelationships = diagnoseDatabaseRelationships;
}