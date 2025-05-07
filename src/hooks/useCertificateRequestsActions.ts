
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Profile } from '@/types/supabase-schema';

export function useCertificateRequestsActions(profile?: Profile | null) {
  const queryClient = useQueryClient();
  
  const deleteRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      // Double-check permissions
      if (profile?.role !== 'SA') {
        throw new Error('Only System Administrators can delete certificate requests');
      }
      
      console.log('Deleting certificate request:', requestId);
      const { error } = await supabase
        .from('certificate_requests')
        .delete()
        .eq('id', requestId);
      
      if (error) throw error;
      return requestId;
    },
    onMutate: (requestId) => {
      queryClient.setQueryData(['certificateRequests'], (oldData: any[]) => {
        return oldData.filter(req => req.id !== requestId);
      });
    },
    onSuccess: (requestId) => {
      toast.success('Certificate request deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['certificateRequests'] });
    },
    onError: (error) => {
      console.error('Error deleting certificate request:', error);
      toast.error(`Failed to delete request: ${error instanceof Error ? error.message : 'Unknown error'}`);
      queryClient.invalidateQueries({ queryKey: ['certificateRequests'] });
    },
  });
  
  // Function to handle approve action
  const handleApprove = (requestId: string) => {
    // Double-check permissions
    const isAdmin = profile?.role && ['SA', 'AD'].includes(profile.role);
    if (!isAdmin) {
      toast.error('Only Administrators can approve certificate requests');
      return;
    }
    
    // Use the useCertificateRequest hook to update the request status
    // This is just a placeholder - in the actual component, we use the hook directly
    return requestId;
  };
  
  // Function to handle reject action
  const handleReject = (requestId: string, rejectionReason: string) => {
    // Double-check permissions
    const isAdmin = profile?.role && ['SA', 'AD'].includes(profile.role);
    if (!isAdmin) {
      toast.error('Only Administrators can reject certificate requests');
      return;
    }
    
    // Use the useCertificateRequest hook to update the request status
    // This is just a placeholder - in the actual component, we use the hook directly
    return { requestId, rejectionReason };
  };
  
  // Function to handle delete action
  const handleDeleteRequest = (requestId: string) => {
    if (profile?.role !== 'SA') {
      toast.error('Only System Administrators can delete certificate requests');
      return;
    }
    
    deleteRequestMutation.mutate(requestId);
  };
  
  return {
    handleApprove,
    handleReject,
    handleDeleteRequest,
    deleteRequestMutation
  };
}
