
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { ExtendedProfile, UserRole } from '@/types/supabase-schema';

export function useUserManagement() {
  const [users, setUsers] = useState<ExtendedProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState({
    role: null as string | null,
    status: null as string | null,
    search: null as string | null,
  });
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [detailUserId, setDetailUserId] = useState<string | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<ExtendedProfile>>({});
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [resetPasswordUserId, setResetPasswordUserId] = useState<string | null>(null);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [changeRoleUserId, setChangeRoleUserId] = useState<string | null>(null);
  const [isChangeRoleDialogOpen, setIsChangeRoleDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState<UserRole>('IT');
  const [isProcessing, setIsProcessing] = useState(false);
  const [roleFilter, setRoleFilter] = useState('all');
  const [complianceFilter, setComplianceFilter] = useState('all');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("Fetching all users...");
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) {
        setError(error.message);
        console.error("Error fetching users:", error);
      } else {
        setUsers(data as ExtendedProfile[]);
        console.log("Successfully fetched users:", data);
      }
    } catch (err: any) {
      setError(err.message);
      console.error("Exception fetching users:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSelectUser = (userId: string, selected: boolean) => {
    setSelectedUsers(prev => (selected ? [...prev, userId] : prev.filter(id => id !== userId)));
  };

  const handleEditClick = (userId: string) => {
    setEditUserId(userId);
    const userToEdit = users.find(user => user.id === userId);
    if (userToEdit) {
      setEditFormData(userToEdit);
      setIsEditDialogOpen(true);
    }
  };

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async () => {
    setIsProcessing(true);
    try {
      console.log("Updating user with data:", editFormData);
      
      const { error } = await supabase
        .from('profiles')
        .update(editFormData)
        .eq('id', editUserId);
      
      if (error) throw error;
      
      toast.success('User updated successfully');
      setIsEditDialogOpen(false);
      await fetchUsers(); // Refresh the user list
    } catch (err: any) {
      console.error("Failed to update user:", err);
      toast.error(`Failed to update user: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetPasswordClick = (userId: string) => {
    setResetPasswordUserId(userId);
    setIsResetPasswordDialogOpen(true);
  };
  
  const handleResetPasswordConfirm = async () => {
    setIsProcessing(true);
    try {
      console.log("Sending password reset for user:", resetPasswordUserId);
      
      const { error } = await supabase.functions.invoke('create-user', {
        body: { user_id: resetPasswordUserId, type: 'RESET_PASSWORD' }
      });
      
      if (error) throw error;
      
      toast.success(`Password reset email sent successfully`);
      setIsResetPasswordDialogOpen(false);
    } catch (err: any) {
      console.error("Failed to send password reset:", err);
      toast.error(`Failed to send password reset email: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleChangeRoleClick = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setNewRole(user.role as UserRole);
      setChangeRoleUserId(userId);
      setIsChangeRoleDialogOpen(true);
    }
  };
  
  const handleRoleChange = (role: UserRole) => { 
    setNewRole(role); 
  };
  
  const handleChangeRoleConfirm = async () => {
    setIsProcessing(true);
    try {
      console.log(`Updating role for user ${changeRoleUserId} to ${newRole}`);
      
      // Get the current state before update for logging
      const currentUser = users.find(u => u.id === changeRoleUserId);
      console.log("Current user state:", currentUser);
      
      const { data, error } = await supabase
        .from('profiles')
        .update({ 
          role: newRole,
          updated_at: new Date().toISOString()
        })
        .eq('id', changeRoleUserId)
        .select();
      
      if (error) {
        console.error("Supabase error updating role:", error);
        throw error;
      }

      console.log("Role update response data:", data);
      
      toast.success('User role updated successfully');
      setIsChangeRoleDialogOpen(false);
      
      // Ensure we refresh the user list to reflect the changes
      await fetchUsers();
    } catch (err: any) {
      console.error("Failed to update user role:", err);
      toast.error(`Failed to update user role: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleActivateUser = async (userId: string) => {
    setIsProcessing(true);
    try {
      console.log(`Activating user: ${userId}`);
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          status: 'ACTIVE',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (error) throw error;
      
      toast.success('User activated successfully');
      await fetchUsers(); // Refresh the user list
    } catch (err: any) {
      console.error("Failed to activate user:", err);
      toast.error(`Failed to activate user: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleDeactivateUser = async (userId: string) => {
    setIsProcessing(true);
    try {
      console.log(`Deactivating user: ${userId}`);
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          status: 'INACTIVE',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (error) throw error;
      
      toast.success('User deactivated successfully');
      await fetchUsers(); // Refresh the user list
    } catch (err: any) {
      console.error("Failed to deactivate user:", err);
      toast.error(`Failed to deactivate user: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleViewUserDetail = (userId: string) => {
    setDetailUserId(userId);
    setIsDetailDialogOpen(true);
  };
  
  const handleCloseUserDetail = () => {
    setIsDetailDialogOpen(false);
    setDetailUserId(null);
  };

  return {
    users,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    activeFilters,
    setActiveFilters,
    selectedUsers,
    handleSelectUser,
    roleFilter,
    setRoleFilter,
    complianceFilter,
    setComplianceFilter,
    editUserId,
    setEditUserId,
    editFormData,
    setEditFormData,
    isEditDialogOpen,
    setIsEditDialogOpen,
    handleEditClick,
    handleEditFormChange,
    handleEditSubmit,
    isProcessing,
    resetPasswordUserId,
    setResetPasswordUserId,
    isResetPasswordDialogOpen,
    setIsResetPasswordDialogOpen,
    handleResetPasswordClick,
    handleResetPasswordConfirm,
    changeRoleUserId,
    setChangeRoleUserId,
    isChangeRoleDialogOpen,
    setIsChangeRoleDialogOpen,
    handleChangeRoleClick,
    handleRoleChange,
    handleChangeRoleConfirm,
    handleActivateUser,
    handleDeactivateUser,
    fetchUsers,
    newRole,
    detailUserId,
    setDetailUserId,
    isDetailDialogOpen,
    setIsDetailDialogOpen,
    handleViewUserDetail,
    handleCloseUserDetail,
  };
}
