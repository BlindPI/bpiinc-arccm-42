import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useUserManagement } from '@/hooks/useUserManagement';
import { UserTable } from '@/components/user-management/UserTable';
import { BulkOperationsPanel } from '@/components/user-management/BulkOperationsPanel';
import { InviteUserDialog } from '@/components/user-management/InviteUserDialog';
import { 
  Users, 
  Search, 
  Filter,
  Download,
  Upload,
  Shield,
  Activity,
  UserPlus,
  RefreshCw
} from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { hasRequiredRole } from '@/utils/roleUtils';

export function SystemUserManagementDashboard() {
  const { data: currentUserProfile } = useProfile();
  const isAdmin = currentUserProfile ? hasRequiredRole(currentUserProfile.role, 'AD') : false;
  
  const {
    users,
    isLoading,
    error,
    selectedUsers,
    searchTerm,
    setSearchTerm,
    roleFilter,
    setRoleFilter,
    complianceFilter,
    setComplianceFilter,
    handleSelectUser,
    handleSelectAllUsers,
    fetchUsers,
    bulkUpdateRoles,
    bulkUpdateStatus,
    bulkUpdateComplianceTier
  } = useUserManagement();

  // Dialog states
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [isChangeRoleDialogOpen, setIsChangeRoleDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [detailUserId, setDetailUserId] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [editFormData, setEditFormData] = useState<any>({});
  const [newRole, setNewRole] = useState<string>('');

  // Dialog handlers
  const handleEditClick = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setEditFormData({
        display_name: user.display_name || '',
        email: user.email || ''
      });
      setSelectedUserId(userId);
      setIsEditDialogOpen(true);
    }
  };

  const handleResetPasswordClick = (userId: string) => {
    setSelectedUserId(userId);
    setIsResetPasswordDialogOpen(true);
  };

  const handleChangeRoleClick = (userId: string) => {
    setSelectedUserId(userId);
    setNewRole('');
    setIsChangeRoleDialogOpen(true);
  };

  const handleViewUserDetail = (userId: string) => {
    setDetailUserId(userId);
    setIsDetailDialogOpen(true);
  };

  const handleCloseUserDetail = () => {
    setDetailUserId('');
    setIsDetailDialogOpen(false);
  };

  // Placeholder handlers for dialog operations
  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleEditSubmit = async () => {
    // Implementation would go here
    console.log('Edit submit:', editFormData);
    setIsEditDialogOpen(false);
  };

  const handleActivateUser = async (userId: string) => {
    await bulkUpdateStatus([userId], 'ACTIVE');
  };

  const handleDeactivateUser = async (userId: string) => {
    await bulkUpdateStatus([userId], 'INACTIVE');
  };

  const handleResetPasswordConfirm = async () => {
    // Implementation would go here
    console.log('Reset password for:', selectedUserId);
    setIsResetPasswordDialogOpen(false);
  };

  const handleRoleChange = (role: string) => {
    setNewRole(role);
  };

  const handleChangeRoleConfirm = async () => {
    if (newRole && selectedUserId) {
      await bulkUpdateRoles([selectedUserId], newRole as any);
      setIsChangeRoleDialogOpen(false);
    }
  };

  const handleClearSelection = () => {
    handleSelectAllUsers(false);
  };

  // Statistics
  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'ACTIVE').length,
    compliant: users.filter(u => u.compliance_status === true).length,
    selected: selectedUsers.length
  };

  if (!isAdmin) {
    return (
      <Card className="border-red-200">
        <CardContent className="p-6 text-center">
          <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-red-700 mb-2">Access Denied</h3>
          <p className="text-red-600">You don't have permission to access system user management.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">System User Management</h2>
          <p className="text-muted-foreground">
            Manage users, roles, and compliance across the organization
          </p>
        </div>
        <div className="flex items-center gap-2">
          <InviteUserDialog />
          <Button variant="outline" size="sm" onClick={fetchUsers}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <p className="text-xs text-gray-500 mt-1">System-wide</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Active Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs text-gray-500 mt-1">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Compliant
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.compliant}</div>
            <p className="text-xs text-gray-500 mt-1">Meeting requirements</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Selected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.selected}</div>
            <p className="text-xs text-gray-500 mt-1">For bulk operations</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="IT">Instructor Trainee</SelectItem>
                <SelectItem value="IP">Instructor Provisional</SelectItem>
                <SelectItem value="IC">Instructor Certified</SelectItem>
                <SelectItem value="AP">Authorized Provider</SelectItem>
                <SelectItem value="AD">Administrator</SelectItem>
                <SelectItem value="SA">System Admin</SelectItem>
              </SelectContent>
            </Select>

            <Select value={complianceFilter} onValueChange={setComplianceFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by compliance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="compliant">Compliant</SelectItem>
                <SelectItem value="non-compliant">Non-Compliant</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Operations Panel */}
      <BulkOperationsPanel
        selectedUsers={selectedUsers}
        onBulkUpdateRoles={bulkUpdateRoles}
        onBulkUpdateStatus={bulkUpdateStatus}
        onBulkUpdateComplianceTier={bulkUpdateComplianceTier}
        onClearSelection={handleClearSelection}
      />

      {/* User Table */}
      <UserTable
        users={users}
        loading={isLoading}
        error={error}
        selectedUsers={selectedUsers}
        onSelectUser={handleSelectUser}
        isAdmin={isAdmin}
        dialogHandlers={{
          isEditDialogOpen,
          setIsEditDialogOpen,
          isResetPasswordDialogOpen,
          setIsResetPasswordDialogOpen,
          isChangeRoleDialogOpen,
          setIsChangeRoleDialogOpen,
          isDetailDialogOpen,
          setIsDetailDialogOpen,
          detailUserId,
          isProcessing,
          editFormData,
          newRole,
          handleEditClick,
          handleResetPasswordClick,
          handleChangeRoleClick,
          handleViewUserDetail,
          handleCloseUserDetail,
          handleEditFormChange,
          handleEditSubmit,
          handleActivateUser,
          handleDeactivateUser,
          handleResetPasswordConfirm,
          handleRoleChange,
          handleChangeRoleConfirm
        }}
      />
    </div>
  );
}
