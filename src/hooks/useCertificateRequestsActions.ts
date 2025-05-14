
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useCertificateRequestsActions(profile: any) {
  const queryClient = useQueryClient();

  // Handle approve mutation
  const approveMutation = useMutation({
    mutationFn: async (requestId: string) => {
      if (!profile?.id) throw new Error('User profile not found');
      
      const { data, error } = await supabase
        .from('certificate_requests')
        .update({ 
          status: 'APPROVED',
          reviewer_id: profile.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId)
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Certificate request approved successfully');
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['certificateRequests'] });
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
      // Add a small timeout before refetching to ensure database consistency
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['certificateRequests'] });
      }, 1000);
    },
    onError: (error: Error) => {
      toast.error(`Error approving certificate request: ${error.message}`);
    }
  });

  // Handle reject mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      if (!profile?.id) throw new Error('User profile not found');
      if (!reason) throw new Error('Rejection reason is required');
      
      const { data, error } = await supabase
        .from('certificate_requests')
        .update({ 
          status: 'REJECTED',
          rejection_reason: reason,
          reviewer_id: profile.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Certificate request rejected');
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['certificateRequests'] });
    },
    onError: (error: Error) => {
      toast.error(`Error rejecting certificate request: ${error.message}`);
    }
  });

  // Handle delete mutation
  const deleteRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase
        .from('certificate_requests')
        .delete()
        .eq('id', requestId);
      
      if (error) throw error;
      return requestId;
    },
    onSuccess: () => {
      toast.success('Certificate request deleted');
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['certificateRequests'] });
    },
    onError: (error: Error) => {
      toast.error(`Error deleting certificate request: ${error.message}`);
    }
  });

  // Wrapper functions for better handling of async operations
  const handleApprove = async (requestId: string) => {
    try {
      await approveMutation.mutateAsync(requestId);
    } catch (error) {
      console.error('Error in handleApprove:', error);
    }
  };

  const handleReject = async (requestId: string, reason: string) => {
    try {
      await rejectMutation.mutateAsync({ id: requestId, reason });
    } catch (error) {
      console.error('Error in handleReject:', error);
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    try {
      await deleteRequestMutation.mutateAsync(requestId);
    } catch (error) {
      console.error('Error in handleDeleteRequest:', error);
    }
  };

  return {
    handleApprove,
    handleReject,
    handleDeleteRequest,
    deleteRequestMutation
  };
}
