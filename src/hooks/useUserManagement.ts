
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
  status: string;
  compliance_status?: boolean;
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

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // We need to use "profiles" table instead of "users" which is part of auth schema
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*');

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
  }, []);

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
    fetchUsers
  };
}
