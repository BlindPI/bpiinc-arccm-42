
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { User } from '@supabase/supabase-js';

// Define the Json type directly since it's not exported from supabase-schema
type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

// Define the extended profile type with Json type for preferences
type ExtendedProfile = {
  id: string;
  display_name?: string;
  email?: string;
  role: string;
  status: string;
  avatar_url?: string;
  bio?: string;
  compliance_status?: boolean;
  preferences?: Json;
  address?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
};

interface UserFilters {
  search: string;
  role: string | null;
  status: string | null;
}

interface UserManagementResult {
  isLoading: boolean;
  users: User[];
  profiles: ExtendedProfile[];
  selectedUser: string | null;
  setSelectedUser: (id: string | null) => void;
  fetchUsers: () => Promise<void>;
  updateUserProfile: (userId: string, updates: Partial<ExtendedProfile>) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  suspendUser: (userId: string) => Promise<void>;
  activateUser: (userId: string) => Promise<void>;
  changeUserRole: (userId: string, newRole: string) => Promise<void>;
  resetUserPassword: (userId: string) => Promise<void>;
  // Add the missing properties
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  roleFilter: string;
  setRoleFilter: (role: string) => void;
  complianceFilter: string;
  setComplianceFilter: (filter: string) => void;
  activeFilters: UserFilters;
  setActiveFilters: (filters: UserFilters) => void;
  selectedUsers: string[];
  handleSelectUser: (userId: string, selected: boolean) => void;
  error: Error | null;
  loading: boolean;
}

export function useUserManagement(): UserManagementResult {
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [profiles, setProfiles] = useState<ExtendedProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [complianceFilter, setComplianceFilter] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [activeFilters, setActiveFilters] = useState<UserFilters>({
    search: '',
    role: null,
    status: null
  });

  const handleSelectUser = (userId: string, selected: boolean) => {
    if (selected) {
      setSelectedUsers(prev => [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    }
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.admin.listUsers();
      if (error) throw error;
      
      setUsers(data.users || []);
      
      // Fetch profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*');
      
      if (profilesError) throw profilesError;
      
      setProfiles(profilesData as ExtendedProfile[]);
      
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
      setError(error instanceof Error ? error : new Error(String(error)));
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserProfile = async (userId: string, updates: Partial<ExtendedProfile>) => {
    setIsLoading(true);
    try {
      // Ensure preferences is properly typed as Json
      if (updates.preferences && typeof updates.preferences === 'object') {
        updates.preferences = updates.preferences as Json;
      }
      
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);
      
      if (error) throw error;
      
      toast.success('User profile updated successfully');
      
      // Refresh profiles
      await fetchUsers();
      
    } catch (error) {
      console.error('Error updating user profile:', error);
      toast.error('Failed to update user profile');
      setError(error instanceof Error ? error : new Error(String(error)));
    } finally {
      setIsLoading(false);
    }
  };

  const deleteUser = async (userId: string) => {
    setIsLoading(true);
    try {
      // First delete the profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
      
      if (profileError) throw profileError;
      
      // Then delete the user from auth
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);
      
      if (authError) throw authError;
      
      toast.success('User deleted successfully');
      
      // Refresh users
      await fetchUsers();
      
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
      setError(error instanceof Error ? error : new Error(String(error)));
    } finally {
      setIsLoading(false);
    }
  };

  const suspendUser = async (userId: string) => {
    setIsLoading(true);
    try {
      // Update profile status
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ status: 'SUSPENDED' })
        .eq('id', userId);
      
      if (profileError) throw profileError;
      
      toast.success('User suspended successfully');
      
      // Refresh users
      await fetchUsers();
      
    } catch (error) {
      console.error('Error suspending user:', error);
      toast.error('Failed to suspend user');
      setError(error instanceof Error ? error : new Error(String(error)));
    } finally {
      setIsLoading(false);
    }
  };

  const activateUser = async (userId: string) => {
    setIsLoading(true);
    try {
      // Update profile status
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ status: 'ACTIVE' })
        .eq('id', userId);
      
      if (profileError) throw profileError;
      
      toast.success('User activated successfully');
      
      // Refresh users
      await fetchUsers();
      
    } catch (error) {
      console.error('Error activating user:', error);
      toast.error('Failed to activate user');
      setError(error instanceof Error ? error : new Error(String(error)));
    } finally {
      setIsLoading(false);
    }
  };

  const changeUserRole = async (userId: string, newRole: string) => {
    setIsLoading(true);
    try {
      // Update profile role
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);
      
      if (profileError) throw profileError;
      
      toast.success(`User role changed to ${newRole} successfully`);
      
      // Refresh users
      await fetchUsers();
      
    } catch (error) {
      console.error('Error changing user role:', error);
      toast.error('Failed to change user role');
      setError(error instanceof Error ? error : new Error(String(error)));
    } finally {
      setIsLoading(false);
    }
  };

  const resetUserPassword = async (userId: string) => {
    setIsLoading(true);
    try {
      // Get user email
      const user = profiles.find(p => p.id === userId);
      if (!user?.email) {
        throw new Error('User email not found');
      }
      
      // Send password reset email
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
      
      toast.success('Password reset email sent successfully');
      
    } catch (error) {
      console.error('Error resetting user password:', error);
      toast.error('Failed to send password reset email');
      setError(error instanceof Error ? error : new Error(String(error)));
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    users,
    profiles,
    selectedUser,
    setSelectedUser,
    fetchUsers,
    updateUserProfile,
    deleteUser,
    suspendUser,
    activateUser,
    changeUserRole,
    resetUserPassword,
    // Add the missing properties to the return object
    searchTerm,
    setSearchTerm,
    roleFilter,
    setRoleFilter,
    complianceFilter,
    setComplianceFilter,
    activeFilters,
    setActiveFilters,
    selectedUsers,
    handleSelectUser,
    error,
    loading: isLoading // Alias for backward compatibility
  };
}
