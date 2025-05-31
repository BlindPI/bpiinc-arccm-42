
import React, { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useAutoArchiveFailedRequests() {
  const queryClient = useQueryClient();

  // Get failed assessment requests that are still pending
  const { data: failedPendingRequests } = useQuery({
    queryKey: ['failed-pending-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('certificate_requests')
        .select('*')
        .eq('status', 'PENDING')
        .eq('assessment_status', 'FAIL');
      
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000 // Check every 30 seconds
  });

  // Auto-archive failed requests
  const autoArchiveMutation = useMutation({
    mutationFn: async (requestIds: string[]) => {
      const { error } = await supabase
        .from('certificate_requests')
        .update({ 
          status: 'ARCHIVED',
          updated_at: new Date().toISOString()
        })
        .in('id', requestIds);
      
      if (error) throw error;
      return requestIds.length;
    },
    onSuccess: (count) => {
      if (count > 0) {
        toast.info(`Auto-archived ${count} failed assessment request${count > 1 ? 's' : ''}`);
        queryClient.invalidateQueries({ queryKey: ['certificateRequests'] });
        queryClient.invalidateQueries({ queryKey: ['enhanced-certificate-requests'] });
        queryClient.invalidateQueries({ queryKey: ['failed-pending-requests'] });
      }
    }
  });

  // Trigger auto-archive when failed requests are found
  useEffect(() => {
    if (failedPendingRequests && failedPendingRequests.length > 0) {
      const requestIds = failedPendingRequests.map(req => req.id);
      autoArchiveMutation.mutate(requestIds);
    }
  }, [failedPendingRequests, autoArchiveMutation]);

  return {
    failedPendingCount: failedPendingRequests?.length || 0,
    isProcessing: autoArchiveMutation.isPending
  };
}
