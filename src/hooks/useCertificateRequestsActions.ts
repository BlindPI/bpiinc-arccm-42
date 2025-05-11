
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useFontLoader } from '@/hooks/useFontLoader';

export function useCertificateRequestsActions(profile: any) {
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);
  const { loadFonts } = useFontLoader();
  
  // Delete a certificate request
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
      queryClient.invalidateQueries({ queryKey: ['certificateRequests'] });
      toast.success('Certificate request deleted');
    },
    onError: (error) => {
      console.error('Error deleting certificate request:', error);
      toast.error('Failed to delete certificate request');
    }
  });

  // Handle approval of a certificate request
  const handleApprove = async (requestId: string) => {
    if (isProcessing || !profile?.id) {
      toast.error('Cannot process request at this time');
      return;
    }
    
    setIsProcessing(true);
    toast.loading('Processing certificate request...');
    
    try {
      // Step 1: Load required fonts
      await loadFonts();
      
      // Step 2: Get the certificate request
      const { data: request, error: fetchError } = await supabase
        .from('certificate_requests')
        .select('*')
        .eq('id', requestId)
        .single();
      
      if (fetchError) throw fetchError;
      if (!request) throw new Error('Certificate request not found');

      // Step 3: Update the request status to APPROVED
      const { error: updateError } = await supabase
        .from('certificate_requests')
        .update({ 
          status: 'APPROVED',
          reviewer_id: profile.id
        })
        .eq('id', requestId);
      
      if (updateError) throw updateError;
      
      // Step 4: Generate certificate - call the edge function
      const { data, error: genError } = await supabase.functions.invoke('generate-certificate', {
        body: { 
          requestId,
          issuerId: profile.id,
          // Include batch information from the request if available
          batchId: request.batch_id || null,
          batchName: request.batch_name || null,
          withPdfGeneration: true
        }
      });
      
      if (genError) throw genError;
      
      // Step 5: Verify result and show appropriate toast
      if (data?.success) {
        toast.dismiss();
        toast.success('Certificate created successfully');
        
        // Step 6: Invalidate all relevant queries
        queryClient.invalidateQueries({ queryKey: ['certificateRequests'] });
        queryClient.invalidateQueries({ queryKey: ['certificates'] });
        
        return data;
      } else {
        throw new Error(data?.message || 'Failed to create certificate');
      }
    } catch (error) {
      console.error('Error approving certificate request:', error);
      toast.dismiss();
      toast.error(`Error: ${error instanceof Error ? error.message : 'Failed to process certificate'}`);
      
      // Try to update request status to indicate failure
      try {
        await supabase
          .from('certificate_requests')
          .update({ status: 'APPROVAL_FAILED' })
          .eq('id', requestId);
      } catch (updateError) {
        console.error('Error updating request status after failure:', updateError);
      }
      
      return null;
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Handle rejection of a certificate request
  const handleReject = async (requestId: string, rejectionReason: string) => {
    if (isProcessing || !profile?.id) {
      toast.error('Cannot process request at this time');
      return;
    }
    
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Update the request status to REJECTED
      const { error } = await supabase
        .from('certificate_requests')
        .update({
          status: 'REJECTED',
          reviewer_id: profile.id,
          rejection_reason: rejectionReason
        })
        .eq('id', requestId);
      
      if (error) throw error;
      
      // Send notification through edge function
      try {
        const { data: request } = await supabase
          .from('certificate_requests')
          .select('user_id, recipient_name, course_name, email')
          .eq('id', requestId)
          .single();
        
        if (request) {
          await supabase.functions.invoke('send-notification', {
            body: {
              userId: request.user_id,
              type: 'CERTIFICATE_REJECTED',
              title: 'Certificate Request Rejected',
              message: `Your certificate request for ${request.recipient_name} (${request.course_name}) was rejected: ${rejectionReason}`,
              recipientEmail: request.email,
              recipientName: request.recipient_name,
              rejectionReason: rejectionReason
            }
          });
        }
      } catch (notifError) {
        console.error('Error sending rejection notification:', notifError);
        // Don't throw here - we don't want to fail the rejection if notification fails
      }
      
      toast.success('Certificate request rejected');
      queryClient.invalidateQueries({ queryKey: ['certificateRequests'] });
      
      return true;
    } catch (error) {
      console.error('Error rejecting certificate request:', error);
      toast.error(`Error: ${error instanceof Error ? error.message : 'Failed to reject certificate'}`);
      return false;
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Delete a certificate request
  const handleDeleteRequest = async (requestId: string) => {
    if (!profile?.id) {
      toast.error('You must be logged in to delete a request');
      return;
    }
    
    if (confirm('Are you sure you want to delete this certificate request?')) {
      await deleteRequestMutation.mutateAsync(requestId);
    }
  };

  return {
    handleApprove,
    handleReject,
    handleDeleteRequest,
    isProcessing,
    deleteRequestMutation
  };
}
