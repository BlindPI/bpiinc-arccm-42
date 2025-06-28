
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UserFilters } from '@/types/courses';
import { UserRole, Profile } from '@/types/supabase-schema';

// Define an interface for the user data structure that matches the profiles table
interface User extends Profile {
  id: string;
  email?: string;
  role: UserRole;
  display_name?: string;
  status: 'ACTIVE' | 'INACTIVE';
  compliance_status?: boolean;
  compliance_tier?: 'basic' | 'robust' | null;
  created_at: string;
  updated_at: string;
}

export function useUserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [profiles, setProfiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [complianceFilter, setComplianceFilter] = useState('all');
  const [activeFilters, setActiveFilters] = useState<UserFilters>({
    search: '',
    role: null,
    status: null
  });
  
  const handleSelectUser = useCallback((userId: string, selected: boolean) => {
    setSelectedUsers(prev => {
      if (selected) {
        return [...prev, userId];
      } else {
        return prev.filter(id => id !== userId);
      }
    });
  }, []);

  const handleSelectAllUsers = useCallback((selected: boolean) => {
    if (selected) {
      setSelectedUsers(users.map(user => user.id));
    } else {
      setSelectedUsers([]);
    }
  }, [users]);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Build query with filters
      let query = supabase
        .from('profiles')
        .select('*');

      // Apply filters
      if (searchTerm) {
        query = query.or(`display_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }

      if (roleFilter && roleFilter !== 'all') {
        query = query.eq('role', roleFilter);
      }

      if (complianceFilter === 'compliant') {
        query = query.eq('compliance_status', true);
      } else if (complianceFilter === 'non-compliant') {
        query = query.eq('compliance_status', false);
      }

      const { data: usersData, error: usersError } = await query
        .order('created_at', { ascending: false });

      if (usersError) {
        setError(usersError.message);
        toast.error(`Failed to fetch users: ${usersError.message}`);
        return;
      }

      setUsers(usersData as User[]);
    } catch (err: any) {
      setError(err.message);
      toast.error(`An unexpected error occurred: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, roleFilter, complianceFilter]);

  // Bulk operations
  const bulkUpdateRoles = useCallback(async (userIds: string[], newRole: UserRole) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .in('id', userIds);

      if (error) throw error;

      // Log bulk operation
      await supabase
        .from('audit_logs')
        .insert({
          action: 'bulk_role_update',
          entity_type: 'user',
          details: {
            user_ids: userIds,
            new_role: newRole,
            count: userIds.length
          }
        });

      toast.success(`Successfully updated ${userIds.length} user roles to ${newRole}`);
      fetchUsers();
    } catch (error: any) {
      toast.error(`Failed to update user roles: ${error.message}`);
    }
  }, [fetchUsers]);

  const bulkUpdateStatus = useCallback(async (userIds: string[], status: 'ACTIVE' | 'INACTIVE') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status, updated_at: new Date().toISOString() })
        .in('id', userIds);

      if (error) throw error;

      // Log bulk operation
      await supabase
        .from('audit_logs')
        .insert({
          action: 'bulk_status_update',
          entity_type: 'user',
          details: {
            user_ids: userIds,
            new_status: status,
            count: userIds.length
          }
        });

      toast.success(`Successfully ${status === 'ACTIVE' ? 'activated' : 'deactivated'} ${userIds.length} users`);
      fetchUsers();
    } catch (error: any) {
      toast.error(`Failed to update user status: ${error.message}`);
    }
  }, [fetchUsers]);

  const bulkUpdateComplianceTier = useCallback(async (userIds: string[], tier: 'basic' | 'robust') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ compliance_tier: tier, updated_at: new Date().toISOString() })
        .in('id', userIds);

      if (error) throw error;

      // Log bulk operation
      await supabase
        .from('audit_logs')
        .insert({
          action: 'bulk_tier_update',
          entity_type: 'user',
          details: {
            user_ids: userIds,
            new_tier: tier,
            count: userIds.length
          }
        });

      toast.success(`Successfully updated ${userIds.length} users to ${tier} compliance tier`);
      fetchUsers();
    } catch (error: any) {
      toast.error(`Failed to update compliance tiers: ${error.message}`);
    }
  }, [fetchUsers]);

  // Real-time updates
  useEffect(() => {
    const channel = supabase
      .channel('profiles-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          console.log('Profile change detected:', payload);
          fetchUsers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchUsers]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);
  
  // Return all the properties needed
  return {
    users,
    profiles,
    isLoading,
    error,
    selectedUser,
    setSelectedUser,
    selectedUsers,
    setSelectedUsers,
    searchTerm,
    setSearchTerm,
    roleFilter,
    setRoleFilter,
    complianceFilter,
    setComplianceFilter,
    activeFilters,
    setActiveFilters,
    handleSelectUser,
    handleSelectAllUsers,
    fetchUsers,
    // Bulk operations
    bulkUpdateRoles,
    bulkUpdateStatus,
    bulkUpdateComplianceTier
  };
}
