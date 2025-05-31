
import { useState } from 'react';
import { toast } from 'sonner';
import { useCertificateRequest } from '@/hooks/useCertificateRequest';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useEnhancedCertificateRequests(profile: any) {
  const queryClient = useQueryClient();
  const updateRequestMutation = useCertificateRequest();
  
  // Delete certificate request mutation
  const deleteRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const { data, error } = await supabase
        .from('certificate_requests')
        .delete()
        .eq('id', requestId);
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enhanced-certificate-requests'] });
      toast.success('Request deleted successfully');
    },
    onError: (error: Error) => {
      console.error('Error deleting request:', error);
      toast.error(`Failed to delete request: ${error.message}`);
    },
  });

  // Handle approval using the working certificate request logic
  const handleApprove = async (requestId: string) => {
    try {
      console.log('Approving request', requestId);
      
      if (!profile) {
        toast.error('You must be logged in to approve requests');
        return;
      }

      await updateRequestMutation.mutateAsync({
        id: requestId,
        status: 'APPROVED',
        profile
      });
      
      // Invalidate enhanced queries
      queryClient.invalidateQueries({ queryKey: ['enhanced-certificate-requests'] });
      console.log('Request approved successfully:', requestId);
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error(`Failed to approve request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Handle rejection using the working certificate request logic
  const handleReject = async (requestId: string, rejectionReason: string) => {
    try {
      console.log('Rejecting request', requestId, 'with reason:', rejectionReason);
      
      if (!profile) {
        toast.error('You must be logged in to reject requests');
        return;
      }

      if (!rejectionReason) {
        toast.error('Please provide a reason for rejection');
        return;
      }

      await updateRequestMutation.mutateAsync({
        id: requestId,
        status: 'REJECTED',
        rejectionReason,
        profile
      });
      
      // Invalidate enhanced queries
      queryClient.invalidateQueries({ queryKey: ['enhanced-certificate-requests'] });
      console.log('Request rejected successfully:', requestId);
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error(`Failed to reject request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Handle delete
  const handleDeleteRequest = async (requestId: string) => {
    try {
      await deleteRequestMutation.mutateAsync(requestId);
    } catch (error) {
      console.error('Error handling delete request:', error);
    }
  };

  return {
    handleApprove,
    handleReject,
    handleDeleteRequest,
    deleteRequestMutation,
    isProcessing: updateRequestMutation.isPending
  };
}
