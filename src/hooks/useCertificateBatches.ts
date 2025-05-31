
import { useMemo } from 'react';
import { CertificateRequest } from '@/types/supabase-schema';

interface BatchGroup {
  batchId: string;
  submittedAt: string;
  submittedBy: string;
  requests: CertificateRequest[];
}

// This hook is now deprecated - batch grouping is handled directly in the Enhanced Pending Approvals view
// using real batch_id and batch_name fields from the database instead of fake timestamp grouping
export function useCertificateBatches(requests: CertificateRequest[] = []) {
  return useMemo(() => {
    console.warn('useCertificateBatches hook is deprecated. Use direct batch grouping with real batch_id instead.');
    return [];
  }, [requests]);
}
