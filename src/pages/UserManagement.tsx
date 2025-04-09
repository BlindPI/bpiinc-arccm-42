import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { ExtendedProfile } from '@/types/supabase-schema';
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { UserTableRow } from '@/components/user-management/UserTableRow';
import { BulkActionsMenu } from '@/components/user-management/BulkActionsMenu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { UserCredentialsHoverCard } from '@/components/user-management/UserCredentialsHoverCard';
import { UserRole } from '@/types/supabase-schema';

const UserManagement: React.FC = () => {
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
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<ExtendedProfile>>({});
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [resetPasswordUserId, setResetPasswordUserId] = useState<string | null>(null);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [changeRoleUserId, setChangeRoleUserId] = useState<string | null>(null);
  const [isChangeRoleDialogOpen, setIsChangeRoleDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState<UserRole>('IT'); // Default role
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');

      if (error) {
        setError(error.message);
      } else {
        setUsers(data as ExtendedProfile[]);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    setActiveFilters(prev => ({ ...prev, search: term }));
  };

  const handleSelectUser = (userId: string, selected: boolean) => {
    setSelectedUsers(prev => {
      if (selected) {
        return [...prev, userId];
      } else {
        return prev.filter(id => id !== userId);
      }
    });
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

      if (error) {
        throw error;
      }

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
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          user_id: resetPasswordUserId,
          type: 'RESET_PASSWORD'
        }
      })

      if (error) {
        throw error;
      }

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

  const handleRoleChange = (role: UserRole) => {
    setNewRole(role);
  };

  const handleChangeRoleConfirm = async () => {
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', changeRoleUserId);

      if (error) {
        throw error;
      }

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
      
      if (columnsError) {
        throw columnsError;
      }
      
      const hasStatusColumn = columns && columns.length > 0 && 'status' in columns[0];
      
      if (hasStatusColumn) {
        // Use TypeScript type assertion to tell TypeScript that status is a valid property
        const updateData = { status: 'ACTIVE' } as Partial<ExtendedProfile> & { status: string };
        
        const { error } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', userId);

        if (error) throw error;
      } else {
        console.warn('Status column does not exist in profiles table');
        toast.warning('Status column needs to be added to the profiles table');
      }

      toast.success('User activated successfully');
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
      
      if (columnsError) {
        throw columnsError;
      }
      
      const hasStatusColumn = columns && columns.length > 0 && 'status' in columns[0];
      
      if (hasStatusColumn) {
        // Use TypeScript type assertion to tell TypeScript that status is a valid property
        const updateData = { status: 'INACTIVE' } as Partial<ExtendedProfile> & { status: string };
        
        const { error } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', userId);

        if (error) throw error;
      } else {
        console.warn('Status column does not exist in profiles table');
        toast.warning('Status column needs to be added to the profiles table');
      }

      toast.success('User deactivated successfully');
      fetchUsers();
    } catch (err: any) {
      toast.error(`Failed to deactivate user: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFilterRole = (role: string) => {
    setActiveFilters(prev => ({ ...prev, role: role === 'all' ? null : role }));
  };

  const handleFilterStatus = (status: string) => {
    setActiveFilters(prev => ({ ...prev, status: status === 'all' ? null : status }));
  };

  const applyFilters = (users: ExtendedProfile[]) => {
    return users.filter(user => {
      if (activeFilters.role && user.role !== activeFilters.role) {
        return false;
      }
      
      const userStatus = user.status || 'ACTIVE';
      if (activeFilters.status && userStatus !== activeFilters.status) {
        return false;
      }
      
      if (activeFilters.search) {
        const searchTerm = activeFilters.search.toLowerCase();
        const displayName = (user.display_name || '').toLowerCase();
        const email = (user.email || '').toLowerCase();
        
        if (!displayName.includes(searchTerm) && !email.includes(searchTerm)) {
          return false;
        }
      }
      
      return true;
    });
  };

  const filteredUsers = applyFilters(users);

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-5">User Management</h1>

      <div className="flex flex-col md:flex-row gap-4 mb-5">
        <Input
          type="search"
          placeholder="Search users..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="md:w-1/3"
        />

        <div className="flex items-center space-x-2">
          <Label htmlFor="role-filter" className="text-sm font-medium">Filter by Role:</Label>
          <Select onValueChange={handleFilterRole} defaultValue="all">
            <SelectTrigger id="role-filter">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="IT">Instructor Trainee</SelectItem>
              <SelectItem value="IP">Instructor Provisional</SelectItem>
              <SelectItem value="IC">Instructor Certified</SelectItem>
              <SelectItem value="AP">Admin Provisional</SelectItem>
              <SelectItem value="AD">Administrator</SelectItem>
              <SelectItem value="SA">System Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Label htmlFor="status-filter" className="text-sm font-medium">Filter by Status:</Label>
          <Select onValueChange={handleFilterStatus} defaultValue="all">
            <SelectTrigger id="status-filter">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <BulkActionsMenu
        selectedUsers={selectedUsers}
        onSuccess={fetchUsers}
      />

      {loading ? (
        <p>Loading users...</p>
      ) : error ? (
        <p className="text-red-500">Error: {error}</p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableCaption>A list of all users in your account.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Select</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <UserTableRow
                  key={user.id}
                  user={user}
                  isSelected={selectedUsers.includes(user.id)}
                  onSelect={handleSelectUser}
                  onEdit={handleEditClick}
                  onActivate={handleActivateUser}
                  onDeactivate={handleDeactivateUser}
                  onResetPassword={handleResetPasswordClick}
                  onChangeRole={handleChangeRoleClick}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Edit User</AlertDialogTitle>
            <AlertDialogDescription>
              Make changes to the user profile.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                type="text"
                id="display_name"
                name="display_name"
                value={(editFormData.display_name || '') as string}
                onChange={handleEditFormChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                type="email"
                id="email"
                name="email"
                value={(editFormData.email || '') as string}
                onChange={handleEditFormChange}
                className="col-span-3"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsEditDialogOpen(false)} disabled={isProcessing}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleEditSubmit} disabled={isProcessing}>
              {isProcessing ? 'Updating...' : 'Update'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Password</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reset the password for this user? An email will be sent to the user with instructions on how to reset their password.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsResetPasswordDialogOpen(false)} disabled={isProcessing}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleResetPasswordConfirm} disabled={isProcessing}>
              {isProcessing ? 'Sending...' : 'Reset Password'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isChangeRoleDialogOpen} onOpenChange={setIsChangeRoleDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change User Role</AlertDialogTitle>
            <AlertDialogDescription>
              Select a new role for this user.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-role" className="text-right">
                New Role
              </Label>
              <Select onValueChange={handleRoleChange} defaultValue={newRole}>
                <SelectTrigger id="new-role" className="col-span-3">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IT">Instructor Trainee</SelectItem>
                  <SelectItem value="IP">Instructor Provisional</SelectItem>
                  <SelectItem value="IC">Instructor Certified</SelectItem>
                  <SelectItem value="AP">Admin Provisional</SelectItem>
                  <SelectItem value="AD">Administrator</SelectItem>
                  <SelectItem value="SA">System Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsChangeRoleDialogOpen(false)} disabled={isProcessing}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleChangeRoleConfirm} disabled={isProcessing}>
              {isProcessing ? 'Updating...' : 'Change Role'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UserManagement;
