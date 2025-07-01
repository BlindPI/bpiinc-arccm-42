/**
 * Certificate Visibility Diagnostic Utility
 * 
 * This utility compares certificate counts between:
 * 1. providerRelationshipService.getProviderLocationKPIs() (used by AP dashboard)
 * 2. Direct Supabase query (used by certificate page)
 * 
 * This will validate our hypothesis about the root cause of the visibility discrepancy.
 */

import { supabase } from '@/integrations/supabase/client';
import { providerRelationshipService } from '@/services/provider/providerRelationshipService';

export interface CertificateVisibilityDiagnostic {
  provider_id: string;
  service_certificate_count: number;
  direct_query_certificate_count: number;
  rls_query_certificate_count: number;
  location_based_query_count: number;
  team_based_query_count: number;
  primary_location_id: string | null;
  team_assignments: number;
  discrepancy_detected: boolean;
  potential_causes: string[];
}

export async function diagnoseCertificateVisibility(providerId: string): Promise<CertificateVisibilityDiagnostic> {
  console.log(`🔍 CERTIFICATE VISIBILITY DIAGNOSTIC for provider ${providerId}`);
  
  // Method 1: Service approach (used by AP dashboard)
  console.log(`🔍 Testing service approach (AP dashboard method)...`);
  const serviceKPIs = await providerRelationshipService.getProviderLocationKPIs(providerId);
  const serviceCertCount = serviceKPIs.certificatesIssued;
  console.log(`✅ Service method result: ${serviceCertCount} certificates`);

  // Method 2: Direct query (used by certificate page)
  console.log(`🔍 Testing direct query approach (certificate page method)...`);
  const { data: directQueryData, error: directError } = await supabase
    .from('certificates')
    .select('id', { count: 'exact' })
    .eq('status', 'ACTIVE');
  
  const directQueryCount = directError ? 0 : (directQueryData?.length || 0);
  console.log(`${directError ? '❌' : '✅'} Direct query result: ${directQueryCount} certificates`);
  if (directError) console.error('Direct query error:', directError);

  // Method 3: RLS-aware query (what should work for AP users)
  console.log(`🔍 Testing RLS-aware query...`);
  const { count: rlsCount, error: rlsError } = await supabase
    .from('certificates')
    .select('id', { count: 'exact' })
    .eq('status', 'ACTIVE');
  
  const rlsQueryCount = rlsError ? 0 : (rlsCount || 0);
  console.log(`${rlsError ? '❌' : '✅'} RLS query result: ${rlsQueryCount} certificates`);
  if (rlsError) console.error('RLS query error:', rlsError);

  // Get provider details for analysis
  const { data: provider, error: providerError } = await supabase
    .from('authorized_providers')
    .select('primary_location_id')
    .eq('id', providerId)
    .single();
  
  const primaryLocationId = provider?.primary_location_id || null;
  console.log(`🔍 Provider primary location: ${primaryLocationId}`);

  // Method 4: Location-based query
  let locationBasedCount = 0;
  if (primaryLocationId) {
    console.log(`🔍 Testing location-based query...`);
    const { count: locCount, error: locError } = await supabase
      .from('certificates')
      .select('id', { count: 'exact' })
      .eq('location_id', primaryLocationId)
      .eq('status', 'ACTIVE');
    
    locationBasedCount = locError ? 0 : (locCount || 0);
    console.log(`${locError ? '❌' : '✅'} Location-based query result: ${locationBasedCount} certificates`);
    if (locError) console.error('Location-based query error:', locError);
  }

  // Method 5: Team-based query
  console.log(`🔍 Testing team-based query...`);
  const { data: teamAssignments, error: teamError } = await supabase
    .from('provider_team_assignments')
    .select('team_id')
    .eq('provider_id', providerId)
    .eq('status', 'active');
  
  const teamAssignmentCount = teamAssignments?.length || 0;
  console.log(`🔍 Provider has ${teamAssignmentCount} team assignments`);

  let teamBasedCount = 0;
  if (teamAssignmentCount > 0) {
    const teamIds = teamAssignments?.map(a => a.team_id) || [];
    const { count: teamCertCount, error: teamCertError } = await supabase
      .from('certificates')
      .select('id, teams!inner(id)', { count: 'exact' })
      .in('teams.id', teamIds)
      .eq('status', 'ACTIVE');
    
    teamBasedCount = teamCertError ? 0 : (teamCertCount || 0);
    console.log(`${teamCertError ? '❌' : '✅'} Team-based query result: ${teamBasedCount} certificates`);
    if (teamCertError) console.error('Team-based query error:', teamCertError);
  }

  // Analyze discrepancies
  const counts = [serviceCertCount, directQueryCount, rlsQueryCount, locationBasedCount, teamBasedCount];
  const uniqueCounts = [...new Set(counts)];
  const discrepancyDetected = uniqueCounts.length > 1;
  
  console.log(`🔍 SUMMARY:`);
  console.log(`   Service method (dashboard): ${serviceCertCount}`);
  console.log(`   Direct query (cert page): ${directQueryCount}`);
  console.log(`   RLS query: ${rlsQueryCount}`);
  console.log(`   Location-based: ${locationBasedCount}`);
  console.log(`   Team-based: ${teamBasedCount}`);
  console.log(`   Discrepancy detected: ${discrepancyDetected ? '🔴 YES' : '🟢 NO'}`);

  // Identify potential causes
  const potentialCauses: string[] = [];
  
  if (serviceCertCount !== directQueryCount) {
    potentialCauses.push('Service uses complex location mapping while direct query relies on basic RLS');
  }
  
  if (locationBasedCount !== serviceCertCount && locationBasedCount > 0) {
    potentialCauses.push('Location ID mismatch between provider and certificates');
  }
  
  if (teamBasedCount !== serviceCertCount && teamBasedCount > 0) {
    potentialCauses.push('Team assignment logic missing from certificate page');
  }
  
  if (rlsQueryCount !== directQueryCount) {
    potentialCauses.push('RLS policy inconsistency between count and select queries');
  }
  
  if (serviceCertCount > Math.max(locationBasedCount, teamBasedCount)) {
    potentialCauses.push('Service combines multiple certificate access paths (location + team)');
  }

  return {
    provider_id: providerId,
    service_certificate_count: serviceCertCount,
    direct_query_certificate_count: directQueryCount,
    rls_query_certificate_count: rlsQueryCount,
    location_based_query_count: locationBasedCount,
    team_based_query_count: teamBasedCount,
    primary_location_id: primaryLocationId,
    team_assignments: teamAssignmentCount,
    discrepancy_detected: discrepancyDetected,
    potential_causes: potentialCauses
  };
}

export async function validateCertificateVisibilityFix(providerId: string): Promise<void> {
  console.log(`🔍 VALIDATING CERTIFICATE VISIBILITY FIX for provider ${providerId}`);
  
  const diagnostic = await diagnoseCertificateVisibility(providerId);
  
  if (!diagnostic.discrepancy_detected) {
    console.log(`✅ VALIDATION PASSED: All methods return consistent certificate counts`);
    return;
  }
  
  console.error(`❌ VALIDATION FAILED: Certificate count discrepancies detected`);
  console.error(`   Potential causes:`, diagnostic.potential_causes);
  
  // Suggest fixes
  if (diagnostic.service_certificate_count > diagnostic.direct_query_certificate_count) {
    console.log(`💡 SUGGESTED FIX: Replace direct Supabase queries with providerRelationshipService methods`);
  }
  
  if (diagnostic.location_based_query_count !== diagnostic.service_certificate_count) {
    console.log(`💡 SUGGESTED FIX: Implement location ID mapping logic from service in certificate queries`);
  }
  
  if (diagnostic.team_based_query_count > 0 && diagnostic.team_based_query_count !== diagnostic.service_certificate_count) {
    console.log(`💡 SUGGESTED FIX: Include team assignment logic in certificate filtering`);
  }
}