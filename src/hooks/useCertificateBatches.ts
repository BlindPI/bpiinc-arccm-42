
import { useMemo } from 'react';
import { CertificateRequest } from '@/types/supabase-schema';

interface BatchGroup {
  batchId: string;
  batchName: string;
  submittedAt: string;
  submittedBy: string;
  requests: CertificateRequest[];
}

export function useCertificateBatches(requests: CertificateRequest[] = []) {
  return useMemo(() => {
    if (!requests.length) return [];

    console.log('Grouping certificate requests:', requests);

    // Group by batch_id, treating null/undefined batch_id as individual submissions
    const batchMap = new Map<string, BatchGroup>();
    const individualRequests: CertificateRequest[] = [];

    requests.forEach(request => {
      if (request.batch_id && request.batch_name) {
        // This is part of a batch submission
        const batchKey = request.batch_id;
        
        if (!batchMap.has(batchKey)) {
          batchMap.set(batchKey, {
            batchId: request.batch_id,
            batchName: request.batch_name,
            submittedAt: request.created_at,
            submittedBy: request.user_id || 'Unknown',
            requests: []
          });
        }
        
        batchMap.get(batchKey)!.requests.push(request);
      } else {
        // Individual submission - create a group for each
        individualRequests.push(request);
      }
    });

    // Convert batches to array
    const batches = Array.from(batchMap.values());

    // Create individual "batches" for non-batch submissions
    const individualBatches = individualRequests.map(request => ({
      batchId: `individual_${request.id}`,
      batchName: `Individual Request - ${request.recipient_name}`,
      submittedAt: request.created_at,
      submittedBy: request.user_id || 'Unknown',
      requests: [request]
    }));

    // Combine and sort by submission date (newest first)
    const allBatches = [...batches, ...individualBatches].sort((a, b) => 
      new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );

    console.log(`Grouped ${requests.length} requests into ${allBatches.length} logical groups:`, allBatches);

    return allBatches;
  }, [requests]);
}
