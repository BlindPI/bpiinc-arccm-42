
import { useAuth } from '@/contexts/AuthContext';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/lib/roles';
import { toast } from 'sonner';

export function useRoleTransitions() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch role transition requests without the problematic join
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
          reviewer_id
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
      rejectionReason 
    }: { 
      id: string; 
      status: 'APPROVED' | 'REJECTED';
      rejectionReason?: string;
    }) => {
      if (!user) throw new Error('No user found');

      const updateData: any = {
        status,
        reviewer_id: user.id,
      };

      if (rejectionReason) {
        updateData.rejection_reason = rejectionReason;
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

  return {
    transitionRequests,
    requestsLoading,
    createTransitionRequest,
    updateTransitionRequest,
  };
}
