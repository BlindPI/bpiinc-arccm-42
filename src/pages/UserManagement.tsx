
import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useProfile } from '@/hooks/useProfile';
import { UserTable } from '@/components/user-management/UserTable';
import { FilterBar } from '@/components/user-management/FilterBar';
import { SavedFiltersMenu } from '@/components/user-management/SavedFiltersMenu';
import { UserManagementLoading } from '@/components/user-management/UserManagementLoading';
import { UserManagementAccessDenied } from '@/components/user-management/UserManagementAccessDenied';
import { FilterSet, SavedItem } from '@/types/filter-types';
import { PageHeader } from '@/components/ui/PageHeader';
import { Users } from 'lucide-react';
import { useUserManagement } from '@/hooks/useUserManagement';

const UserManagementPage: React.FC = () => {
  const { data: profile, isLoading: profileLoading } = useProfile();
  const isAdmin = profile?.role && ['SA', 'AD'].includes(profile.role);

  const [filters, setFilters] = useState<FilterSet>({
    search: '',
    role: '',
    compliance: ''
  });
  
  const [savedFilters, setSavedFilters] = useState<SavedItem[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const { users, loading, error, refetch } = useUserManagement();

  // Dialog state handlers for user management operations
  const [dialogState, setDialogState] = useState({
    editUser: { open: false, userId: '' },
    changeRole: { open: false, userId: '' },
    resetPassword: { open: false, userId: '' },
    userDetail: { open: false, userId: '' },
  });

  const dialogHandlers = {
    onEdit: (userId: string) => setDialogState(prev => ({ ...prev, editUser: { open: true, userId } })),
    onChangeRole: (userId: string) => setDialogState(prev => ({ ...prev, changeRole: { open: true, userId } })),
    onResetPassword: (userId: string) => setDialogState(prev => ({ ...prev, resetPassword: { open: true, userId } })),
    onViewDetail: (userId: string) => setDialogState(prev => ({ ...prev, userDetail: { open: true, userId } })),
  };

  // Handle user selection
  const handleSelectUser = (userId: string, selected: boolean) => {
    if (selected) {
      setSelectedUsers(prev => [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    }
  };

  // Handle filter changes
  const handleSearchChange = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
  };

  const handleRoleFilterChange = (value: string) => {
    setFilters(prev => ({ ...prev, role: value }));
  };

  const handleComplianceFilterChange = (value: string) => {
    setFilters(prev => ({ ...prev, compliance: value }));
  };

  const handleClearAllFilters = () => {
    setFilters({ search: '', role: '', compliance: '' });
  };

  // Handle saved filters
  const handleSaveFilter = (name: string) => {
    const newSavedFilter = { name, filters: { ...filters } };
    setSavedFilters(prev => [...prev, newSavedFilter]);
  };

  const handleApplyFilter = (filters: FilterSet) => {
    setFilters(filters);
  };

  const handleDeleteFilter = (name: string) => {
    setSavedFilters(prev => prev.filter(filter => filter.name !== name));
  };

  if (profileLoading) {
    return <UserManagementLoading />;
  }

  if (!isAdmin) {
    return <UserManagementAccessDenied />;
  }

  // Get active filter tags
  const activeTags = [];
  if (filters.role) activeTags.push({ id: 'role', label: `Role: ${filters.role}` });
  if (filters.compliance) activeTags.push({ id: 'compliance', label: `Compliance: ${filters.compliance}` });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          icon={<Users className="h-6 w-6 text-primary" />}
          title="User Management"
          subtitle="Manage users and their roles in the system"
        />

        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <FilterBar 
              onSearchChange={handleSearchChange}
              onRoleFilterChange={handleRoleFilterChange}
              onComplianceFilterChange={handleComplianceFilterChange}
              onClearAllFilters={handleClearAllFilters}
              searchValue={filters.search}
              roleFilter={filters.role}
              complianceFilter={filters.compliance}
              activeTags={activeTags}
            />
            <SavedFiltersMenu
              filters={filters}
              savedFilters={savedFilters}
              onSave={handleSaveFilter}
              onApply={handleApplyFilter}
              onDelete={handleDeleteFilter}
            />
          </div>

          <UserTable
            users={users}
            loading={loading}
            error={error}
            selectedUsers={selectedUsers}
            onSelectUser={handleSelectUser}
            dialogHandlers={dialogHandlers}
            isAdmin={isAdmin}
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default UserManagementPage;
