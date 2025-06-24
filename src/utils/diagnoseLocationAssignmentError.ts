import { supabase } from '@/integrations/supabase/client';
import type { ValidationResult } from '@/utils/validateDashboardDataSources';

/**
 * Diagnostic utility to find and fix the location_assignments query error
 * The system is incorrectly querying "location_assignments" table which doesn't exist
 * It should use the working Provider Management logic instead
 */
export async function diagnoseLocationAssignmentError(providerId: string, locationId: string): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];
  console.log('🔍 DIAGNOSTIC: Location Assignment Error Analysis');
  console.log(`Provider ID: ${providerId}, Location ID: ${locationId}`);

  try {
    // 1. Test the BROKEN query pattern that's causing 404 errors
    try {
      const { data: brokenResult, error: brokenError } = await supabase
        .from('location_assignments')
        .select('location_id')
        .eq('user_id', providerId) // Using providerId as userId for testing context
        .eq('status', 'active')
        .maybeSingle();

      if (brokenError) {
        results.push({
          source: 'LocationAssignmentDiagnostic',
          issue: 'Non-existent Table Usage',
          severity: 'critical',
          details: `Attempt to query 'location_assignments' table failed: ${brokenError.message}. This table does not exist.`,
          detected: true,
          recommendation: 'Replace all queries to \'location_assignments\' with the correct \'authorized_providers.primary_location_id\' pattern.'
        });
      } else {
        results.push({
          source: 'LocationAssignmentDiagnostic',
          issue: 'Incorrect Table Usage (Potential)',
          severity: 'low',
          details: 'Query to \'location_assignments\' did not explicitly fail, but this table is conceptually incorrect.',
          detected: false,
          recommendation: 'Ensure all location assignment queries correctly use \'authorized_providers.primary_location_id\'.'
        });
      }
    } catch (err) {
      results.push({
        source: 'LocationAssignmentDiagnostic',
        issue: 'Broken Query Execution',
        severity: 'critical',
        details: `Catch block for broken query hit: ${err instanceof Error ? err.message : String(err)}. Confirmed: 'location_assignments' table does not exist.`,
        detected: true,
        recommendation: 'Verify and correct table names in all related components.'
      });
    }

    // 2. Test the WORKING query from Provider Management
    const { data: providerRecord, error: providerError } = await supabase
      .from('authorized_providers')
      .select('id, name, primary_location_id, user_id')
      .eq('id', providerId)
      .maybeSingle();

    if (providerError || !providerRecord) {
      results.push({
        source: 'LocationAssignmentDiagnostic',
        issue: 'Provider Record Not Found',
        severity: 'high',
        details: `Provider record for ID ${providerId} not found or query failed: ${providerError?.message || 'No record.'}`,
        detected: true,
        recommendation: 'Ensure provider ID is valid and accessible.'
      });
    } else {
      results.push({
        source: 'LocationAssignmentDiagnostic',
        issue: 'Provider Record Found',
        severity: 'low',
        details: `Provider ${providerRecord.name} found with primary location: ${providerRecord.primary_location_id || 'None'}`,
        detected: false,
        recommendation: 'Good: Provider record is accessible.'
      });

      // 3. Get location details using the working approach
      if (providerRecord.primary_location_id) {
        const { data: location, error: locationError } = await supabase
          .from('locations')
          .select('id, name, address')
          .eq('id', providerRecord.primary_location_id)
          .single();

        if (locationError) {
          results.push({
            source: 'LocationAssignmentDiagnostic',
            issue: 'Primary Location Details Error',
            severity: 'high',
            details: `Failed to fetch details for primary location ${providerRecord.primary_location_id}: ${locationError.message}`,
            detected: true,
            recommendation: 'Verify location ID and RLS policies on \'locations\' table.'
          });
        } else {
          results.push({
            source: 'LocationAssignmentDiagnostic',
            issue: 'Primary Location Details Verified',
            severity: 'low',
            details: `Details for primary location ${location?.name} found.`,
            detected: false,
            recommendation: 'Good: Primary location details are accessible.'
          });
        }
      } else {
        results.push({
          source: 'LocationAssignmentDiagnostic',
          issue: 'No Primary Location Assigned',
          severity: 'medium',
          details: 'Provider has no primary location assigned.',
          detected: false,
          recommendation: 'Ensure all providers have a primary location assigned for full functionality.'
        });
      }
    }

    console.log('====================================================');
    console.log(`🔍 DIAGNOSTIC COMPLETE: ${results.length} issues analyzed.`);
    return results;

  } catch (error: any) {
    console.error('🚨 Diagnostic error (outer catch):', error);
    results.push({
      source: 'LocationAssignmentDiagnostic',
      issue: 'Unhandled Diagnostic Error',
      severity: 'critical',
      details: `An unhandled error occurred during diagnostics: ${error.message}`,
      detected: true,
      recommendation: 'Review diagnostic logic.'
    });
    return results;
  }
}

/**
 * Log diagnostic results - now expects an array of ValidationResult
 */
export async function logDiagnosticResults(diagnostics: ValidationResult[]): Promise<void> {
  console.log('\n📋 DETAILED DIAGNOSTIC RESULTS:');
  console.log('=====================================');
  
  diagnostics.forEach((result, index) => {
    const severityIcon = {
      low: '🟢',
      medium: '🟡', 
      high: '🟠',
      critical: '🔴'
    }[result.severity];
    
    console.log(`\n${index + 1}. ${severityIcon} ${result.issue} (${result.source})`);
    console.log(`   Details: ${result.details}`);
    console.log(`   Recommendation: ${result.recommendation}`);
  });
}