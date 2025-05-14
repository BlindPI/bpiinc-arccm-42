
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UpdateRequestParams } from '@/types/certificates';

export function useCertificateRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status, rejectionReason, profile }: UpdateRequestParams) => {
      if (!id || !status) {
        throw new Error('Missing required parameters');
      }

      console.log(`Updating request ${id} to status ${status}`);
      
      const updateData: Record<string, any> = { 
        status, 
        updated_at: new Date().toISOString() 
      };
      
      if (rejectionReason) {
        updateData.rejection_reason = rejectionReason;
      }
      
      if (status === 'APPROVED' || status === 'REJECTED') {
        updateData.reviewer_id = profile?.id;
      }

      const { data, error } = await supabase
        .from('certificate_requests')
        .update(updateData)
        .eq('id', id)
        .select('*');

      if (error) {
        console.error('Error updating certificate request:', error);
        throw error;
      }

      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidate multiple queries to ensure all views are refreshed
      queryClient.invalidateQueries({ queryKey: ['certificateRequests'] });
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
      
      const statusMessage = {
        'APPROVED': 'Certificate request approved',
        'REJECTED': 'Certificate request rejected',
        'ARCHIVED': 'Certificate request archived',
        'PENDING': 'Certificate request set to pending'
      }[variables.status] || 'Certificate request updated';
      
      toast.success(statusMessage);
    },
    onError: (error: Error) => {
      toast.error(`Failed to update certificate request: ${error.message}`);
    }
  });
}
