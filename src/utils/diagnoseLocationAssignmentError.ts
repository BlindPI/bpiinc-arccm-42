import { supabase } from '@/integrations/supabase/client';

/**
 * Diagnostic utility to find and fix the location_assignments query error
 * The system is incorrectly querying "location_assignments" table which doesn't exist
 * It should use the working Provider Management logic instead
 */
export class LocationAssignmentErrorDiagnostic {
  
  /**
   * DIAGNOSIS: The problem is components are using wrong table name
   * WORKING LOGIC: Provider Management uses authorized_providers.primary_location_id
   * BROKEN LOGIC: Some component queries non-existent "location_assignments" table
   */
  static async diagnoseAndFix(userId: string) {
    console.log('🔍 DIAGNOSTIC: Location Assignment Error Analysis');
    console.log('='.repeat(60));
    
    try {
      // 1. Test the WRONG query that's causing 404 errors
      console.log('❌ Testing the BROKEN query pattern:');
      console.log(`   Query: location_assignments?select=location_id&user_id=eq.${userId}&status=eq.active`);
      
      try {
        const { data: brokenResult, error: brokenError } = await supabase
          .from('location_assignments')
          .select('location_id')
          .eq('user_id', userId)
          .eq('status', 'active');
          
        console.log('❌ This should fail with 404:', brokenError?.message);
      } catch (err) {
        console.log('❌ Confirmed: location_assignments table does not exist');
      }
      
      // 2. Test the WORKING query from Provider Management
      console.log('\n✅ Testing the WORKING query pattern (Provider Management style):');
      
      // First get the provider record (this is what works!)
      const { data: providerRecord, error: providerError } = await supabase
        .from('authorized_providers')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
        
      if (providerError) {
        console.log('❌ Provider record error:', providerError);
        return null;
      }
      
      if (!providerRecord) {
        console.log('❌ No provider record found for user');
        return null;
      }
      
      console.log('✅ Found provider record:', {
        id: providerRecord.id,
        name: providerRecord.name,
        primary_location_id: providerRecord.primary_location_id
      });
      
      // 3. Get location details using the working approach
      if (providerRecord.primary_location_id) {
        const { data: location, error: locationError } = await supabase
          .from('locations')
          .select('id, name, address')
          .eq('id', providerRecord.primary_location_id)
          .single();
          
        if (locationError) {
          console.log('❌ Location query error:', locationError);
        } else {
          console.log('✅ Found assigned location:', location);
        }
      }
      
      // 4. Get teams for this location (working approach)
      if (providerRecord.primary_location_id) {
        const { data: teams, error: teamsError } = await supabase
          .from('teams')
          .select(`
            id,
            name,
            description,
            status,
            location_id
          `)
          .eq('location_id', providerRecord.primary_location_id)
          .eq('status', 'active');
          
        if (teamsError) {
          console.log('❌ Teams query error:', teamsError);
        } else {
          console.log('✅ Found teams for location:', teams?.length || 0);
          console.log('   Teams:', teams?.map(t => ({ id: t.id, name: t.name })));
        }
      }
      
      console.log('\n📋 SUMMARY:');
      console.log('❌ BROKEN: Components querying "location_assignments" table');
      console.log('✅ WORKING: Provider Management uses authorized_providers.primary_location_id');
      console.log('🔧 FIX NEEDED: Replace incorrect queries with working Provider Management logic');
      
      return {
        providerId: providerRecord.id,
        locationId: providerRecord.primary_location_id,
        workingApproach: 'authorized_providers.primary_location_id',
        brokenApproach: 'location_assignments table (does not exist)'
      };
      
    } catch (error) {
      console.error('🚨 Diagnostic error:', error);
      return null;
    }
  }
  
  /**
   * Provide the correct query pattern for AP user location assignments
   */
  static getCorrectQueryPattern(userId: string) {
    return {
      description: 'Correct AP User Location Assignment Query',
      steps: [
        {
          step: 1,
          query: 'authorized_providers',
          select: '*',
          where: { user_id: userId },
          purpose: 'Get provider record with primary_location_id'
        },
        {
          step: 2,
          query: 'locations',
          select: 'id, name, address',
          where: 'id = authorized_providers.primary_location_id',
          purpose: 'Get location details'
        },
        {
          step: 3,
          query: 'teams',
          select: 'id, name, status, location_id',
          where: { location_id: 'authorized_providers.primary_location_id', status: 'active' },
          purpose: 'Get teams for assigned location'
        }
      ],
      workingExample: `
        // WORKING: Provider Management approach
        const { data: provider } = await supabase
          .from('authorized_providers')
          .select('*')
          .eq('user_id', userId)
          .single();
          
        const { data: teams } = await supabase
          .from('teams')
          .select('*')
          .eq('location_id', provider.primary_location_id)
          .eq('status', 'active');
      `,
      brokenExample: `
        // BROKEN: What's currently being attempted
        const { data } = await supabase
          .from('location_assignments') // ❌ This table doesn't exist!
          .select('location_id')
          .eq('user_id', userId)
          .eq('status', 'active');
      `
    };
  }
}

/**
 * Main diagnostic function used by providerRelationshipService
 */
export async function diagnoseLocationAssignmentError(providerId: string, locationId: string) {
  console.log('🔍 DIAGNOSTIC: Location Assignment Error Analysis');
  console.log(`Provider ID: ${providerId}, Location ID: ${locationId}`);
  
  return LocationAssignmentErrorDiagnostic.diagnoseAndFix(providerId);
}

/**
 * Log diagnostic results
 */
export async function logDiagnosticResults(diagnostics: any) {
  console.log('📋 DIAGNOSTIC RESULTS:', diagnostics);
  return diagnostics;
}

/**
 * Quick fix function to replace broken location assignment queries
 */
export async function getAPUserLocationAndTeams(userId: string) {
  console.log('🔧 Using CORRECT AP user location/team query pattern');
  
  try {
    // Step 1: Get provider record (this is the working approach!)
    const { data: providerRecord, error: providerError } = await supabase
      .from('authorized_providers')
      .select('id, name, primary_location_id, user_id')
      .eq('user_id', userId)
      .maybeSingle();
      
    if (providerError || !providerRecord) {
      console.log('❌ No provider record found for AP user');
      return { locations: [], teams: [] };
    }
    
    // Step 2: Get location details if assigned
    let location = null;
    if (providerRecord.primary_location_id) {
      const { data: locationData, error: locationError } = await supabase
        .from('locations')
        .select('id, name, address, city, state')
        .eq('id', providerRecord.primary_location_id)
        .single();
        
      if (!locationError && locationData) {
        location = locationData;
      }
    }
    
    // Step 3: Get teams for the assigned location
    let teams = [];
    if (providerRecord.primary_location_id) {
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select(`
          id,
          name,
          description,
          status,
          location_id,
          created_at
        `)
        .eq('location_id', providerRecord.primary_location_id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });
        
      if (!teamsError && teamsData) {
        teams = teamsData;
      }
    }
    
    console.log('✅ Successfully loaded AP user data using working approach');
    console.log(`   Provider: ${providerRecord.name}`);
    console.log(`   Location: ${location?.name || 'None assigned'}`);
    console.log(`   Teams: ${teams.length} found`);
    
    return {
      provider: providerRecord,
      locations: location ? [location] : [],
      teams,
      workingApproach: true
    };
    
  } catch (error) {
    console.error('🚨 Error in corrected AP user query:', error);
    return { locations: [], teams: [], error: error.message };
  }
}