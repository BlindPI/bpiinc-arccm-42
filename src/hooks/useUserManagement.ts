import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UserFilters } from '@/types/courses';

export function useUserManagement() {
  const [users, setUsers] = useState([]);
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
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*');

      if (usersError) {
        setError(usersError.message);
        toast.error(`Failed to fetch users: ${usersError.message}`);
        return;
      }

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) {
        setError(profilesError.message);
        toast.error(`Failed to fetch profiles: ${profilesError.message}`);
        return;
      }

      // Combine users and profiles data
      const combinedData = usersData.map(user => {
        const profile = profilesData.find(profile => profile.id === user.id);
        return { ...user, ...profile };
      });

      setUsers(combinedData);
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
