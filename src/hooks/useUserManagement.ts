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
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) setError(error.message);
      else setUsers(data as ExtendedProfile[]);
    } catch (err: any) {
      setError(err.message);
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
      const { error } = await supabase
        .from('profiles')
        .update(editFormData)
        .eq('id', editUserId);
      if (error) throw error;
      toast.success('User updated successfully');
      setIsEditDialogOpen(false);
      fetchUsers();
    } catch (err: any) {
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
      const { error } = await supabase.functions.invoke('create-user', {
        body: { user_id: resetPasswordUserId, type: 'RESET_PASSWORD' }
      });
      if (error) throw error;
      toast.success(`Password reset email sent successfully`);
      setIsResetPasswordDialogOpen(false);
    } catch (err: any) {
      toast.error(`Failed to send password reset email: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleChangeRoleClick = (userId: string) => {
    setChangeRoleUserId(userId);
    setIsChangeRoleDialogOpen(true);
  };
  const handleRoleChange = (role: UserRole) => { setNewRole(role); };
  const handleChangeRoleConfirm = async () => {
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', changeRoleUserId);
      if (error) throw error;
      toast.success('User role updated successfully');
      setIsChangeRoleDialogOpen(false);
      fetchUsers();
    } catch (err: any) {
      toast.error(`Failed to update user role: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleActivateUser = async (userId: string) => {
    setIsProcessing(true);
    try {
      const { data: columns, error: columnsError } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);
      if (columnsError) throw columnsError;
      
      const hasStatusColumn = columns && columns.length > 0 && 'status' in columns[0];
      
      if (hasStatusColumn) {
        const updateData = { status: 'ACTIVE' } as Partial<ExtendedProfile>;
        const { error } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', userId);
        if (error) throw error;
        toast.success('User activated successfully');
      } else {
        toast.warning('Status column needs to be added to the profiles table');
      }
      fetchUsers();
    } catch (err: any) {
      toast.error(`Failed to activate user: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleDeactivateUser = async (userId: string) => {
    setIsProcessing(true);
    try {
      const { data: columns, error: columnsError } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);
      if (columnsError) throw columnsError;
      
      const hasStatusColumn = columns && columns.length > 0 && 'status' in columns[0];
      
      if (hasStatusColumn) {
        const updateData = { status: 'INACTIVE' } as Partial<ExtendedProfile>;
        const { error } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', userId);
        if (error) throw error;
        toast.success('User deactivated successfully');
      } else {
        toast.warning('Status column needs to be added to the profiles table');
      }
      fetchUsers();
    } catch (err: any) {
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
