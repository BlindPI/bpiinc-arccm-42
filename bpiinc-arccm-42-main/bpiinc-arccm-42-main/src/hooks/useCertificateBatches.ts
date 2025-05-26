
import { useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CertificateRequest } from '@/types/supabase-schema';
import { supabase } from '@/integrations/supabase/client';

interface BatchGroup {
  batchId: string;
  submittedAt: string;
  submittedBy: string;
  requests: CertificateRequest[];
}

export function useCertificateBatches(requests: CertificateRequest[] = []) {
  const queryClient = useQueryClient();
  
  return useMemo(() => {
    if (!requests?.length) return [];
    
    const batches: Record<string, CertificateRequest[]> = {};
    
    // Group by create timestamp rounded to the nearest minute as a simple batch identifier
    requests.forEach(request => {
      if (!request.created_at) return;
      
      // Use created_at timestamp rounded to the nearest minute as a batch identifier
      // This groups requests submitted around the same time as a batch
      const batchDate = new Date(request.created_at);
      batchDate.setSeconds(0, 0); // Round to minute
      const batchId = batchDate.toISOString();
      
      // Initialize batch if it doesn't exist
      if (!batches[batchId]) {
        batches[batchId] = [];
      }
      
      // Add request to batch
      batches[batchId].push(request);
    });
    
    // Convert to array and sort by date (newest first)
    return Object.entries(batches)
      .map(([batchId, requests]) => {
        // Find the user display name if available
        let submittedByName = 'Unknown';
        
        if (requests[0]?.user_id) {
          // Try to get the display name from the first request's user profile
          const userId = requests[0].user_id;
          
          // Look up the profile in cached data or use a placeholder
          const userProfiles = queryClient.getQueryData(['profiles']) as any[] || [];
          const userProfile = userProfiles.find((p: any) => p.id === userId);
          
          if (userProfile?.display_name) {
            submittedByName = userProfile.display_name;
          } else {
            // If no display name found, we'll try to fetch it
            submittedByName = `User: ${userId.substring(0, 8)}...`;
            
            // Let's trigger a query to fetch profiles if needed
            // This is a fire-and-forget approach that will update the UI when data is available
            if (userId) {
              // Using void operator to properly handle the Promise without catch
              void (async () => {
                try {
                  const { data, error } = await supabase
                    .from('profiles')
                    .select('id, display_name')
                    .eq('id', userId)
                    .single();
                    
                  if (error) {
                    console.error('Error fetching profile:', error);
                    return;
                  }
                    
                  if (data?.display_name) {
                    // Cache the profile data
                    queryClient.setQueryData(
                      ['profiles'], 
                      (old: any[] = []) => [...old.filter((p: any) => p.id !== userId), data]
                    );
                  }
                } catch (err) {
                  console.error('Error in profile fetch:', err);
                }
              })();
            }
          }
        }
        
        return {
          batchId,
          submittedAt: batchId,
          submittedBy: submittedByName,
          requests: requests.sort((a, b) => 
            a.recipient_name.localeCompare(b.recipient_name)
          )
        };
      })
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  }, [requests, queryClient]);
}
