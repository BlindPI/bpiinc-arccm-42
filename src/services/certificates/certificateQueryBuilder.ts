
import { supabase } from '@/integrations/supabase/client';

/**
 * This file is kept as a placeholder for backward compatibility.
 * Certificate filtering logic has been moved to certificateFetchService.ts
 * to avoid TypeScript's "excessively deep instantiation" errors.
 * 
 * @deprecated Use fetchCertificates in certificateFetchService.ts instead
 */

// Simple utility function that could be used if needed
export function canAccessCertificates(profileId: string | undefined, isAdmin: boolean): boolean {
  return !!profileId;
}
