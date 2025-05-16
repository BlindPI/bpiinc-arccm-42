
import React, { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { UserManagementLoading } from '@/components/user-management/UserManagementLoading';
import { UserManagementAccessDenied } from '@/components/user-management/UserManagementAccessDenied';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { FilterBar } from '@/components/user-management/FilterBar';
import { BulkActionsMenu } from '@/components/user-management/BulkActionsMenu';
import { UserTable } from '@/components/user-management/UserTable';
import { useUserManagement } from '@/hooks/useUserManagement';
import { SavedFiltersMenu } from '@/components/user-management/SavedFiltersMenu';
import { Users } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { ComplianceStats } from '@/components/user-management/ComplianceStats';
import { Card } from '@/components/ui/card';
import { FilterSet, SavedItem } from '@/types/filter-types';
import { UserRole } from '@/types/supabase-schema';
import { UserFilters } from '@/types/courses';
import { ExtendedProfile } from '@/types/courses';

// Create a type that extends ExtendedProfile to include any other properties from the user data
interface ExtendedUser extends ExtendedProfile {
  // Add any missing required properties from ExtendedProfile
  id: string;
  role: UserRole;
  display_name?: string;
  created_at: string;
  updated_at: string;
  email?: string;
  status: string;
  compliance_status?: boolean;
}

const UserManagementPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();  // Fix: changed isLoading to loading
  const { data: profile, isLoading: profileLoading } = useProfile();

  const {
    isLoading,
    error: fetchError,
    users,
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
    fetchUsers
  } = useUserManagement();

  const isAdmin = profile?.role && ['SA', 'AD'].includes(profile.role);

  const [savedFilters, setSavedFilters] = useState<SavedItem[]>(() => {
    try {
      const saved = localStorage.getItem("usermanagement-saved-filters");
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem("usermanagement-saved-filters", JSON.stringify(savedFilters));
    } catch {}
  }, [savedFilters]);

  const currentFilters: FilterSet = {
    search: searchTerm,
    role: roleFilter,
    compliance: complianceFilter
  };

  const activeFilterTags = useMemo(() => {
    const tags = [];
    if (searchTerm) tags.push({ key: "search", label: `Search: "${searchTerm}"` });
    if (roleFilter && roleFilter !== "all") tags.push({ key: "role", label: "Role: " + roleFilter.toUpperCase() });
    if (complianceFilter && complianceFilter !== "all") tags.push({ key: "comp", label: "Compliance: " + (complianceFilter === "compliant" ? "Compliant" : "Non-Compliant") });
    return tags;
  }, [searchTerm, roleFilter, complianceFilter]);

  const handleSaveFilter = (name: string) => {
    if (savedFilters.some(sf => sf.name === name)) return; // do not duplicate
    setSavedFilters([...savedFilters, { name, filters: currentFilters }]);
  };
  
  const handleApplyFilter = (filters: FilterSet) => {
    setSearchTerm(filters.search);
    setRoleFilter(filters.role);
    setComplianceFilter(filters.compliance);
    setActiveFilters({
      search: filters.search,
      role: filters.role === "all" ? null : filters.role as UserRole | null,
      status: null,
    });
  };
  
  const handleDeleteFilter = (name: string) => {
    setSavedFilters(sf => sf.filter(item => item.name !== name));
  };
  
  const handleClearAllFilters = () => {
    setSearchTerm("");
    setRoleFilter("all");
    setComplianceFilter("all");
    setActiveFilters({ search: "", role: null, status: null });
  };

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

  // Cast users as ExtendedUser[] to match the expected structure
  const extendedUsers = users as ExtendedUser[];

  const filteredUsers = extendedUsers.filter(user => {
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

  const compliantUsers = filteredUsers.filter(user => user.compliance_status).length;
  const nonCompliantUsers = filteredUsers.length - compliantUsers;

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 pb-12">
        <PageHeader
          icon={<Users className="h-7 w-7 text-primary" />}
          title="User Management"
          subtitle="Manage users, roles, and access for your organization."
          actions={
            <SavedFiltersMenu
              filters={currentFilters}
              savedFilters={savedFilters}
              onSave={handleSaveFilter}
              onApply={handleApplyFilter}
              onDelete={handleDeleteFilter}
            />
          }
        />

        <ComplianceStats
          totalUsers={filteredUsers.length}
          compliantUsers={compliantUsers}
          nonCompliantUsers={nonCompliantUsers}
        />

        <Card className="p-6 border border-border/50 shadow-md bg-gradient-to-br from-card to-muted/20">
          <FilterBar 
            onSearchChange={value => {
              setSearchTerm(value);
              setActiveFilters({ ...activeFilters, search: value });
            }}
            onRoleFilterChange={role => {
              setRoleFilter(role);
              setActiveFilters({ ...activeFilters, role: role === "all" ? null : role as UserRole | null });
            }}
            onComplianceFilterChange={val => {
              setComplianceFilter(val);
            }}
            searchValue={searchTerm}
            roleFilter={roleFilter}
            complianceFilter={complianceFilter}
            onClearAllFilters={handleClearAllFilters}
            activeTags={activeFilterTags}
          />
        </Card>

        <div className="flex items-center mb-4 space-x-4">
          <BulkActionsMenu 
            selectedUsers={selectedUsers} 
            onSuccess={fetchUsers} 
          />
        </div>

        <UserTable
          users={filteredUsers as ExtendedProfile[]}
          loading={isLoading}
          error={fetchError || ""}
          selectedUsers={selectedUsers}
          onSelectUser={handleSelectUser}
          dialogHandlers={{
            fetchUsers,
            ...useUserManagement()
          }}
          isAdmin={isAdmin}
        />
      </div>
    </DashboardLayout>
  );
};

export default UserManagementPage;
