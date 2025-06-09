
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/types/supabase-schema';

interface RoleTransition {
  fromRole: UserRole;
  toRole: UserRole;
  requiresApproval: boolean;
  minimumRequirements: string[];
}

// Valid role progression paths
const ROLE_TRANSITIONS: RoleTransition[] = [
  {
    fromRole: 'IT',
    toRole: 'IP',
    requiresApproval: true,
    minimumRequirements: ['Complete basic training', 'Pass assessment']
  },
  {
    fromRole: 'IP',
    toRole: 'IN', // Changed from 'IC' to 'IN'
    requiresApproval: true,
    minimumRequirements: ['Teaching hours requirement', 'Supervisor approval']
  }
];

export const useRoleTransitions = () => {
  const [pendingTransitions, setPendingTransitions] = useState<any[]>([]);
  const queryClient = useQueryClient();

  const { data: availableTransitions = [] } = useQuery({
    queryKey: ['role-transitions'],
    queryFn: async () => {
      return ROLE_TRANSITIONS;
    }
  });

  const requestRoleTransition = useMutation({
    mutationFn: async ({ userId, fromRole, toRole }: { 
      userId: string; 
      fromRole: UserRole; 
      toRole: UserRole;
    }) => {
      // Implementation for role transition request
      const { data, error } = await supabase
        .from('role_transition_requests')
        .insert({
          user_id: userId,
          from_role: fromRole,
          to_role: toRole,
          status: 'pending'
        });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['role-transitions']);
    }
  });

  const getValidTransitions = (currentRole: UserRole): UserRole[] => {
    return ROLE_TRANSITIONS
      .filter(transition => transition.fromRole === currentRole)
      .map(transition => transition.toRole);
  };

  return {
    availableTransitions,
    pendingTransitions,
    requestRoleTransition,
    getValidTransitions
  };
};
