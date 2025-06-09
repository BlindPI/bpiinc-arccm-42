
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ExtendedProfile, DatabaseUserRole } from '@/types/supabase-schema';
import { toast } from 'sonner';

interface User extends ExtendedProfile {
  // User interface that properly extends Profile
}

export const useUserManagement = () => {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: async (): Promise<ExtendedProfile[]> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('display_name');
      
      if (error) throw error;
      
      return (data || []).map(user => ({
        ...user,
        display_name: user.display_name || 'Unnamed User',
        status: user.status || 'ACTIVE'
      })) as ExtendedProfile[];
    }
  });

  const updateUserRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: DatabaseUserRole }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', userId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('User role updated successfully');
      queryClient.invalidateQueries(['users']);
    },
    onError: (error: any) => {
      toast.error(`Failed to update user role: ${error.message}`);
    }
  });

  const updateUserStatus = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: 'ACTIVE' | 'INACTIVE' | 'PENDING' }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ status })
        .eq('id', userId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('User status updated successfully');
      queryClient.invalidateQueries(['users']);
    },
    onError: (error: any) => {
      toast.error(`Failed to update user status: ${error.message}`);
    }
  });

  const toggleUserSelection = useCallback((userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  }, []);

  const selectAllUsers = useCallback(() => {
    setSelectedUsers(users.map(user => user.id));
  }, [users]);

  const clearSelection = useCallback(() => {
    setSelectedUsers([]);
  }, []);

  return {
    users,
    isLoading,
    error,
    selectedUsers,
    toggleUserSelection,
    selectAllUsers,
    clearSelection,
    updateUserRole,
    updateUserStatus
  };
};
