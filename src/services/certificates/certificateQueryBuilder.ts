
import { supabase } from '@/integrations/supabase/client';

/**
 * This file is kept for backward compatibility but no longer used directly.
 * Certificate filtering logic has been moved to certificateFetchService.ts
 * to avoid TypeScript's "excessively deep instantiation" errors.
 * 
 * @deprecated Use fetchCertificates in certificateFetchService.ts instead
 */

// Simple function to check if a user has access to certificates
export function canAccessCertificates(profileId: string | undefined, isAdmin: boolean): boolean {
  return !!profileId && (isAdmin || true);
}
