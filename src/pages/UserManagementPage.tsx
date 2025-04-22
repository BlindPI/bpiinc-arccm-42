
import React from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { UserManagementLoading } from '@/components/user-management/UserManagementLoading';
import { UserManagementAccessDenied } from '@/components/user-management/UserManagementAccessDenied';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { FilterBar } from '@/components/user-management/FilterBar';
import { BulkActionsMenu } from '@/components/user-management/BulkActionsMenu';
import { UserTable } from '@/components/user-management/UserTable';
import { useUserManagement } from '@/hooks/useUserManagement';

const UserManagementPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();

  const {
    users,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    roleFilter,
    complianceFilter,
    setRoleFilter,
    setComplianceFilter,
    activeFilters,
    setActiveFilters,
    selectedUsers,
    handleSelectUser,
    ...dialogHandlers
  } = useUserManagement();

  const isAdmin = profile?.role && ['SA', 'AD'].includes(profile.role);

  if (authLoading || profileLoading) return <UserManagementLoading />;

  if (!user)
    return (
      <DashboardLayout>
        <div className="flex flex-col gap-6">
          <h1 className="text-3xl font-bold tracking-tight">Please sign in</h1>
          <p className="text-muted-foreground">
            You need to be signed in to access this page.
          </p>
        </div>
      </DashboardLayout>
    );

  if (!isAdmin) return <UserManagementAccessDenied />;

  // Filter users according to existing logic
  const filteredUsers = users.filter(user => {
    if (activeFilters.role && user.role !== activeFilters.role) return false;
    const userStatus = user.status || 'ACTIVE';
    if (activeFilters.status && userStatus !== activeFilters.status) return false;
    if (activeFilters.search) {
      const search = activeFilters.search.toLowerCase();
      const displayName = (user.display_name || '').toLowerCase();
      const email = (user.email || '').toLowerCase();
      if (!displayName.includes(search) && !email.includes(search)) return false;
    }
    return true;
  });

  return (
    <DashboardLayout>
      <div className="container mx-auto py-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-7">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight text-gradient bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent mb-1">
              User Management
            </h1>
            <p className="text-muted-foreground text-base mt-1">
              Manage users, roles, and access for your organization.
            </p>
          </div>
        </div>

        <div className="mb-6">
          <FilterBar 
            onSearchChange={value => {
              setSearchTerm(value);
              setActiveFilters(prev => ({ ...prev, search: value }));
            }}
            onRoleFilterChange={role => {
              setRoleFilter(role);
              setActiveFilters(prev => ({ ...prev, role: role === "all" ? null : role }));
            }}
            onComplianceFilterChange={val => {
              setComplianceFilter(val);
              // Extra compliance filtering not implemented yet
            }}
            searchValue={searchTerm}
            roleFilter={roleFilter}
            complianceFilter={complianceFilter}
          />
        </div>

        <div className="flex items-center mb-4 space-x-4">
          <BulkActionsMenu selectedUsers={selectedUsers} onSuccess={dialogHandlers.fetchUsers} />
        </div>

        <UserTable
          users={filteredUsers}
          loading={loading}
          error={error}
          selectedUsers={selectedUsers}
          onSelectUser={handleSelectUser}
          dialogHandlers={dialogHandlers}
          isAdmin={isAdmin}
        />
      </div>
    </DashboardLayout>
  );
};

export default UserManagementPage;
