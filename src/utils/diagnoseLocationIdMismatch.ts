/**
 * DIAGNOSTIC UTILITY: Location ID Mismatch Analysis
 * 
 * This utility helps diagnose the location_id vs primary_location_id joining issue
 * that's causing zero member counts and certificate counts.
 */

import { supabase } from '@/integrations/supabase/client';

export interface LocationIdDiagnostic {
  issue_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  affected_count: number;
  details: string;
  sample_data?: any;
  suggested_fix: string;
}

export async function diagnoseLocationIdMismatch(providerId?: string): Promise<LocationIdDiagnostic[]> {
  const diagnostics: LocationIdDiagnostic[] = [];
  
  try {
    console.log('🔍 DIAGNOSTIC: Starting location ID mismatch analysis...');
    
    // 1. Check provider primary_location_id vs certificates location_id mismatch
    if (providerId) {
      console.log(`🔍 DIAGNOSTIC: Analyzing provider ${providerId} location relationships...`);
      
      // Get provider's primary location
      const { data: provider, error: providerError } = await supabase
        .from('authorized_providers')
        .select('id, name, primary_location_id')
        .eq('id', providerId)
        .single();
        
      if (!providerError && provider) {
        console.log(`✅ DIAGNOSTIC: Provider ${provider.name} has primary_location_id: ${provider.primary_location_id}`);
        
        // Check if certificates exist for this location_id
        const { data: certificates, error: certError } = await supabase
          .from('certificates')
          .select('id, location_id')
          .eq('location_id', provider.primary_location_id);
          
        const certCount = certificates?.length || 0;
        console.log(`📊 DIAGNOSTIC: Found ${certCount} certificates for location_id ${provider.primary_location_id}`);
        
        if (certCount === 0 && provider.primary_location_id) {
          // Check if certificates exist with different location_id pattern
          const { data: allCerts, error: allCertError } = await supabase
            .from('certificates')
            .select('id, location_id')
            .limit(10);
            
          diagnostics.push({
            issue_type: 'certificate_location_mismatch',
            severity: 'critical',
            affected_count: 0,
            details: `Provider ${provider.name} has primary_location_id ${provider.primary_location_id} but no certificates found with matching location_id`,
            sample_data: {
              provider_primary_location_id: provider.primary_location_id,
              sample_certificate_location_ids: allCerts?.map(c => c.location_id).slice(0, 5)
            },
            suggested_fix: 'Create mapping between primary_location_id and location_id, or use JOIN with locations table'
          });
        }
      }
    }
    
    // 2. Check team member count calculation
    console.log('🔍 DIAGNOSTIC: Analyzing team member count issues...');
    
    const { data: teamAssignments, error: assignmentError } = await supabase
      .from('provider_team_assignments')
      .select(`
        team_id,
        teams!inner(
          id,
          name,
          location_id
        )
      `)
      .eq('provider_id', providerId || '')
      .limit(5);
      
    if (!assignmentError && teamAssignments) {
      console.log(`📊 DIAGNOSTIC: Found ${teamAssignments.length} team assignments`);
      
      for (const assignment of teamAssignments) {
        const teamId = assignment.team_id;
        const teamName = assignment.teams.name;
        
        // Get actual member count for this team
        const { data: members, error: memberError } = await supabase
          .from('team_members')
          .select('id')
          .eq('team_id', teamId)
          .eq('status', 'active');
          
        const actualMemberCount = members?.length || 0;
        console.log(`📊 DIAGNOSTIC: Team "${teamName}" has ${actualMemberCount} active members`);
        
        if (actualMemberCount === 0) {
          diagnostics.push({
            issue_type: 'zero_team_members',
            severity: 'high',
            affected_count: 1,
            details: `Team "${teamName}" (${teamId}) has no active members in team_members table`,
            sample_data: {
              team_id: teamId,
              team_name: teamName,
              location_id: assignment.teams.location_id
            },
            suggested_fix: 'Check if team_members table is populated, or if status filtering is too restrictive'
          });
        }
      }
    }
    
    // 3. Check location_id consistency across tables
    console.log('🔍 DIAGNOSTIC: Analyzing location_id consistency across tables...');
    
    // Get sample location IDs from different tables
    const { data: locations, error: locError } = await supabase
      .from('locations')
      .select('id, name')
      .limit(5);
      
    const { data: providerLocations, error: provLocError } = await supabase
      .from('authorized_providers')
      .select('primary_location_id')
      .not('primary_location_id', 'is', null)
      .limit(5);
      
    const { data: teamLocations, error: teamLocError } = await supabase
      .from('teams')
      .select('location_id')
      .not('location_id', 'is', null)
      .limit(5);
      
    const { data: certLocations, error: certLocError } = await supabase
      .from('certificates')
      .select('location_id')
      .not('location_id', 'is', null)
      .limit(5);
    
    if (!locError && locations) {
      const validLocationIds = new Set(locations.map(l => l.id));
      const providerLocationIds = new Set(providerLocations?.map(p => p.primary_location_id) || []);
      const teamLocationIds = new Set(teamLocations?.map(t => t.location_id) || []);
      const certificateLocationIds = new Set(certLocations?.map(c => c.location_id) || []);
      
      // Check for orphaned location references
      const orphanedProviderLocations = [...providerLocationIds].filter(id => !validLocationIds.has(id));
      const orphanedTeamLocations = [...teamLocationIds].filter(id => !validLocationIds.has(id));
      const orphanedCertLocations = [...certificateLocationIds].filter(id => !validLocationIds.has(id));
      
      if (orphanedProviderLocations.length > 0) {
        diagnostics.push({
          issue_type: 'orphaned_provider_locations',
          severity: 'high',
          affected_count: orphanedProviderLocations.length,
          details: `Found ${orphanedProviderLocations.length} providers with primary_location_id that don't exist in locations table`,
          sample_data: { orphaned_ids: orphanedProviderLocations.slice(0, 3) },
          suggested_fix: 'Update provider primary_location_id to valid location IDs, or create missing location records'
        });
      }
      
      if (orphanedTeamLocations.length > 0) {
        diagnostics.push({
          issue_type: 'orphaned_team_locations',
          severity: 'medium',
          affected_count: orphanedTeamLocations.length,
          details: `Found ${orphanedTeamLocations.length} teams with location_id that don't exist in locations table`,
          sample_data: { orphaned_ids: orphanedTeamLocations.slice(0, 3) },
          suggested_fix: 'Update team location_id to valid location IDs, or create missing location records'
        });
      }
      
      if (orphanedCertLocations.length > 0) {
        diagnostics.push({
          issue_type: 'orphaned_certificate_locations',
          severity: 'medium',
          affected_count: orphanedCertLocations.length,
          details: `Found ${orphanedCertLocations.length} certificates with location_id that don't exist in locations table`,
          sample_data: { orphaned_ids: orphanedCertLocations.slice(0, 3) },
          suggested_fix: 'Update certificate location_id to valid location IDs, or create missing location records'
        });
      }
    }
    
    console.log(`✅ DIAGNOSTIC: Location ID analysis complete. Found ${diagnostics.length} issues.`);
    return diagnostics;
    
  } catch (error) {
    console.error('🚨 DIAGNOSTIC ERROR:', error);
    diagnostics.push({
      issue_type: 'diagnostic_error',
      severity: 'critical',
      affected_count: 0,
      details: `Failed to run location ID diagnostic: ${error.message}`,
      suggested_fix: 'Check database connectivity and table permissions'
    });
    return diagnostics;
  }
}

export async function generateLocationMappingQuery(): Promise<string> {
  // Generate SQL to help understand location relationships
  return `
-- Location ID Mapping Analysis Query
-- Run this to understand location relationships across tables

SELECT 
  'providers' as table_name,
  primary_location_id as location_id,
  COUNT(*) as count,
  ARRAY_AGG(name) as sample_names
FROM authorized_providers 
WHERE primary_location_id IS NOT NULL 
GROUP BY primary_location_id

UNION ALL

SELECT 
  'teams' as table_name,
  location_id,
  COUNT(*) as count,
  ARRAY_AGG(name) as sample_names
FROM teams 
WHERE location_id IS NOT NULL 
GROUP BY location_id

UNION ALL

SELECT 
  'certificates' as table_name,
  location_id,
  COUNT(*) as count,
  ARRAY_AGG(certificate_number) as sample_names
FROM certificates 
WHERE location_id IS NOT NULL 
GROUP BY location_id

ORDER BY table_name, location_id;
`;
}