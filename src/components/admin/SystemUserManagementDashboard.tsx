
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUserManagement } from '@/hooks/useUserManagement';
import { UserTable } from '@/components/user-management/UserTable';
import { 
  Users, 
  Search, 
  Filter, 
  Download, 
  UserPlus,
  Shield,
  Settings
} from 'lucide-react';

export function SystemUserManagementDashboard() {
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
    handleSelectUser
  } = useUserManagement();

  const [bulkAction, setBulkAction] = useState('');

  const handleBulkAction = () => {
    if (!bulkAction || selectedUsers.length === 0) return;
    
    console.log(`Performing bulk action: ${bulkAction} on users:`, selectedUsers);
    // Implement bulk operations here
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesCompliance = complianceFilter === 'all' || 
                            (complianceFilter === 'compliant' ? user.compliance_status === true : user.compliance_status === false);
    
    return matchesSearch && matchesRole && matchesCompliance;
  });

  const dialogHandlers = {
    isEditDialogOpen: false,
    isResetPasswordDialogOpen: false,
    isChangeRoleDialogOpen: false,
    isDetailDialogOpen: false,
    detailUserId: null,
    handleEditClick: (user: any) => console.log('Edit user:', user.id),
    handleActivateUser: (userId: string) => console.log('Activate user:', userId),
    handleDeactivateUser: (userId: string) => console.log('Deactivate user:', userId),
    handleResetPasswordClick: (user: any) => console.log('Reset password:', user.id),
    handleChangeRoleClick: (user: any) => console.log('Change role:', user.id),
    handleViewUserDetail: (userId: string) => console.log('View details:', userId),
    handleCloseUserDetail: () => console.log('Close details'),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-600" />
            System User Management
          </h2>
          <p className="text-muted-foreground">
            Comprehensive user oversight and compliance management
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Users
          </Button>
          <Button size="sm">
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="SA">System Admin</SelectItem>
                <SelectItem value="AD">Admin</SelectItem>
                <SelectItem value="AP">Authorized Provider</SelectItem>
                <SelectItem value="IC">Instructor Certified</SelectItem>
                <SelectItem value="IP">Instructor Provisional</SelectItem>
                <SelectItem value="IT">Instructor Trainee</SelectItem>
                <SelectItem value="ST">Student</SelectItem>
              </SelectContent>
            </Select>
            <Select value={complianceFilter} onValueChange={setComplianceFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Compliance status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="compliant">Compliant</SelectItem>
                <SelectItem value="non-compliant">Non-Compliant</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
                </Badge>
                <Select value={bulkAction} onValueChange={setBulkAction}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Choose bulk action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activate">Activate Users</SelectItem>
                    <SelectItem value="deactivate">Deactivate Users</SelectItem>
                    <SelectItem value="reset-compliance">Reset Compliance</SelectItem>
                    <SelectItem value="assign-tier">Assign Tier</SelectItem>
                    <SelectItem value="send-notification">Send Notification</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleBulkAction}
                disabled={!bulkAction}
                size="sm"
              >
                Apply Action
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* User Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{filteredUsers.length}</p>
              <p className="text-sm text-muted-foreground">Total Users</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {filteredUsers.filter(u => u.compliance_status === true).length}
              </p>
              <p className="text-sm text-muted-foreground">Compliant</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">
                {filteredUsers.filter(u => u.compliance_status === false).length}
              </p>
              <p className="text-sm text-muted-foreground">Non-Compliant</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-600">
                {filteredUsers.filter(u => u.status === 'ACTIVE').length}
              </p>
              <p className="text-sm text-muted-foreground">Active</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <UserTable
        users={filteredUsers}
        loading={isLoading}
        error={error}
        selectedUsers={selectedUsers}
        onSelectUser={handleSelectUser}
        dialogHandlers={dialogHandlers}
        isAdmin={true}
      />
    </div>
  );
}
