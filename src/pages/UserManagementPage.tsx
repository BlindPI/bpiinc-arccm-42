
import React, { useState, useEffect, useMemo } from 'react';
import { FilterBar } from '@/components/user-management/FilterBar';
import { BulkActionsMenu } from '@/components/user-management/BulkActionsMenu';
import { UserTable } from '@/components/user-management/UserTable';
import { useUserManagement } from '@/hooks/useUserManagement';
import { SavedFiltersMenu } from '@/components/user-management/SavedFiltersMenu';
import { ComplianceStats } from '@/components/user-management/ComplianceStats';
import { Card } from '@/components/ui/card';
import { FilterSet, SavedItem } from '@/types/filter-types';

const UserManagementPage: React.FC = () => {
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
    setActiveFilters(prev => ({
      ...prev,
      search: filters.search,
      role: filters.role === "all" ? null : filters.role,
      status: null,
    }));
  };
  const handleDeleteFilter = (name: string) => {
    setSavedFilters(sf => sf.filter(item => item.name !== name));
  };
  const handleClearAllFilters = () => {
    setSearchTerm("");
    setRoleFilter("all");
    setComplianceFilter("all");
    setActiveFilters({ ...activeFilters, search: "", role: null, status: null });
  };

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

  const compliantUsers = filteredUsers.filter(user => user.compliance_status).length;
  const nonCompliantUsers = filteredUsers.length - compliantUsers;

  return (
    <div className="flex flex-col gap-6 pb-12">
      <Card className="p-6 border border-border/50 shadow-md bg-gradient-to-br from-card to-muted/20">
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
          }}
          searchValue={searchTerm}
          roleFilter={roleFilter}
          complianceFilter={complianceFilter}
          onClearAllFilters={handleClearAllFilters}
          activeTags={activeFilterTags}
        />
      </Card>

      <ComplianceStats
        totalUsers={filteredUsers.length}
        compliantUsers={compliantUsers}
        nonCompliantUsers={nonCompliantUsers}
      />

      <div className="flex items-center mb-4 space-x-4">
        <BulkActionsMenu 
          selectedUsers={selectedUsers} 
          onSuccess={dialogHandlers.fetchUsers} 
        />
      </div>

      <UserTable
        users={filteredUsers}
        loading={loading}
        error={error}
        selectedUsers={selectedUsers}
        onSelectUser={handleSelectUser}
        dialogHandlers={dialogHandlers}
        isAdmin={true}
      />
    </div>
  );
};

export default UserManagementPage;
