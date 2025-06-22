/**
 * LOCATION ID MISMATCH FIX
 * 
 * This utility provides a fixed implementation for the certificate counting logic
 * that handles the location_id vs primary_location_id mismatch issue.
 */

import { supabase } from '@/integrations/supabase/client';

export async function getProviderCertificatesWithLocationMapping(providerId: string, teamIds: string[]): Promise<any[]> {
  console.log(`DEBUG: Getting certificates for provider ${providerId} with location mapping`);
  
  // Get provider's primary location
  const { data: providerData, error: providerError } = await supabase
    .from('authorized_providers')
    .select('primary_location_id')
    .eq('id', providerId)
    .single();

  let certificates: any[] = [];
  
  if (!providerError && providerData?.primary_location_id) {
    console.log(`DEBUG: Provider primary_location_id: ${providerData.primary_location_id}`);
    
    // Approach 1: Direct match (certificates.location_id = providers.primary_location_id)
    const { data: directCertData, error: directCertError } = await supabase
      .from('certificates')
      .select('id')
      .eq('location_id', providerData.primary_location_id);
    
    if (!directCertError && directCertData && directCertData.length > 0) {
      certificates = directCertData;
      console.log(`DEBUG: Found ${certificates.length} certificates via direct location_id match`);
      return certificates;
    }
    
    console.log(`DEBUG: No certificates found via direct match, trying location mapping...`);
    
    // Approach 2: Join through locations table to handle ID mapping
    const { data: mappedCertData, error: mappedCertError } = await supabase
      .from('certificates')
      .select(`
        id,
        location_id,
        locations!inner(
          id,
          name
        )
      `)
      .eq('locations.id', providerData.primary_location_id);
    
    if (!mappedCertError && mappedCertData && mappedCertData.length > 0) {
      certificates = mappedCertData;
      console.log(`DEBUG: Found ${certificates.length} certificates via location mapping`);
      return certificates;
    }
    
    console.log(`DEBUG: No certificates found via location mapping, trying team-based approach...`);
    
    // Approach 3: Get certificates through team assignments (alternative path)
    if (teamIds.length > 0) {
      const { data: teamCertData, error: teamCertError } = await supabase
        .from('certificates')
        .select(`
          id,
          location_id,
          teams!inner(
            id,
            location_id
          )
        `)
        .in('teams.id', teamIds);
      
      if (!teamCertError && teamCertData) {
        certificates = teamCertData;
        console.log(`DEBUG: Found ${certificates.length} certificates via team assignments`);
        return certificates;
      }
    }
  }
  
  if (certificates.length === 0) {
    console.log(`DEBUG: No certificates found for provider ${providerId} using any approach`);
    console.log(`DEBUG: This suggests location ID mismatch between primary_location_id and certificate location_id`);
  }
  
  return certificates;
}

export function generateLocationMappingReport(): string {
  return `
-- LOCATION ID MAPPING DIAGNOSTIC QUERY
-- Run this to understand the relationship between primary_location_id and location_id:

SELECT 
  'providers_primary_location' as source,
  primary_location_id as location_ref,
  COUNT(*) as count,
  array_agg(name) as sample_names
FROM authorized_providers 
WHERE primary_location_id IS NOT NULL 
GROUP BY primary_location_id

UNION ALL

SELECT 
  'certificates_location' as source,
  location_id as location_ref, 
  COUNT(*) as count,
  array_agg(certificate_number) as sample_names
FROM certificates 
WHERE location_id IS NOT NULL 
GROUP BY location_id

UNION ALL

SELECT 
  'teams_location' as source,
  location_id as location_ref,
  COUNT(*) as count,
  array_agg(name) as sample_names  
FROM teams 
WHERE location_id IS NOT NULL 
GROUP BY location_id

ORDER BY source, location_ref;

-- This will show you if primary_location_id values from providers 
-- match location_id values in certificates and teams tables
`;
}