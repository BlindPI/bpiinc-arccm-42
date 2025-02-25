
import { useAuth } from '@/contexts/AuthContext';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/lib/roles';
import { toast } from 'sonner';

export function useRoleTransitions() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch role transition requests with extended information
  const { data: transitionRequests, isLoading: requestsLoading } = useQuery({
    queryKey: ['role_transition_requests'],
    queryFn: async () => {
      if (!user) return [];

      // First fetch the requests
      const { data: requests, error } = await supabase
        .from('role_transition_requests')
        .select(`
          id,
          user_id,
          from_role,
          to_role,
          status,
          created_at,
          reviewer_id,
          deadline,
          required_approvals,
          received_approvals,
          can_appeal,
          appeal_reason,
          appeal_deadline,
          cancelled_at,
          cancelled_by,
          cancellation_reason
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching transition requests:', error);
        throw error;
      }

      // Then fetch roles separately using the RPC function
      const rolesPromises = requests.map(async request => {
        const { data: role, error: roleError } = await supabase
          .rpc('get_user_role', { user_id: request.user_id });
        
        if (roleError) {
          console.error('Error fetching role for user:', request.user_id, roleError);
          return null;
        }
        return role;
      });

      const roles = await Promise.all(rolesPromises);

      // Combine the data
      const requestsWithRoles = requests.map((request, index) => ({
        ...request,
        profiles: { role: roles[index] }
      }));

      return requestsWithRoles;
    },
    enabled: !!user
  });

  // Create role transition request
  const createTransitionRequest = useMutation({
    mutationFn: async (toRole: UserRole) => {
      if (!user) throw new Error('No user found');

      const { data: currentRole, error: roleError } = await supabase
        .rpc('get_user_role', { user_id: user.id });
      
      if (roleError) throw roleError;
      if (!currentRole) throw new Error('Could not determine current role');

      const { error } = await supabase
        .from('role_transition_requests')
        .insert({
          user_id: user.id,
          from_role: currentRole,
          to_role: toRole,
          status: 'PENDING'
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role_transition_requests'] });
      toast.success('Role transition request submitted successfully');
    },
    onError: (error) => {
      toast.error('Failed to submit role transition request');
      console.error('Error:', error);
    }
  });

  // Update role transition request
  const updateTransitionRequest = useMutation({
    mutationFn: async ({ 
      id, 
      status, 
      rejectionReason,
      appealReason,
      cancellationReason 
    }: { 
      id: string; 
      status: 'APPROVED' | 'REJECTED' | 'CANCELLED';
      rejectionReason?: string;
      appealReason?: string;
      cancellationReason?: string;
    }) => {
      if (!user) throw new Error('No user found');

      const updateData: any = {
        status,
        reviewer_id: user.id,
      };

      if (status === 'REJECTED' && rejectionReason) {
        updateData.rejection_reason = rejectionReason;
      }

      if (status === 'CANCELLED') {
        updateData.cancelled_at = new Date().toISOString();
        updateData.cancelled_by = user.id;
        updateData.cancellation_reason = cancellationReason;
      }

      if (appealReason) {
        updateData.appeal_reason = appealReason;
        updateData.appeal_deadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days
      }

      const { error } = await supabase
        .from('role_transition_requests')
        .update(updateData)
        .eq('id', id);
      
      if (error) throw error;

      if (status === 'APPROVED') {
        const request = transitionRequests?.find(r => r.id === id);
        if (request) {
          const { error: roleUpdateError } = await supabase
            .from('profiles')
            .update({ role: request.to_role })
            .eq('id', request.user_id);
          
          if (roleUpdateError) throw roleUpdateError;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role_transition_requests'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Request updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update request');
      console.error('Error:', error);
    }
  });

  // Submit appeal for rejected request
  const submitAppeal = useMutation({
    mutationFn: async ({ 
      id, 
      appealReason 
    }: { 
      id: string; 
      appealReason: string;
    }) => {
      if (!user) throw new Error('No user found');

      const { error } = await supabase
        .from('role_transition_requests')
        .update({
          appeal_reason: appealReason,
          appeal_deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
          status: 'PENDING'
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role_transition_requests'] });
      toast.success('Appeal submitted successfully');
    },
    onError: (error) => {
      toast.error('Failed to submit appeal');
      console.error('Error:', error);
    }
  });

  // Cancel role transition request
  const cancelRequest = useMutation({
    mutationFn: async ({ 
      id, 
      reason 
    }: { 
      id: string; 
      reason: string;
    }) => {
      if (!user) throw new Error('No user found');

      const { error } = await supabase
        .from('role_transition_requests')
        .update({
          status: 'CANCELLED',
          cancelled_at: new Date().toISOString(),
          cancelled_by: user.id,
          cancellation_reason: reason
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role_transition_requests'] });
      toast.success('Request cancelled successfully');
    },
    onError: (error) => {
      toast.error('Failed to cancel request');
      console.error('Error:', error);
    }
  });

  // Add handleUploadSuccess function
  const handleUploadSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['role_transition_requests'] });
    toast.success('Document uploaded successfully');
  };

  return {
    transitionRequests,
    requestsLoading,
    createTransitionRequest,
    updateTransitionRequest,
    submitAppeal,
    cancelRequest,
    handleUploadSuccess,
  };
}
