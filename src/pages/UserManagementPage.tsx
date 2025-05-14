
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useUserManagement } from "@/hooks/useUserManagement";
import { useProfile } from '@/hooks/useProfile';
import { UserTable } from "@/components/user-management/UserTable";
import { UserFilters } from "@/components/user-management/UserFilters";
import { Button } from "@/components/ui/button";
import { Loader2, Users, UserPlus } from "lucide-react";
import { InviteUserDialog } from '@/components/user-management/dialogs/InviteUserDialog';
import { usePagination } from '@/hooks/usePagination';
import { DataPagination } from '@/components/ui/data-pagination';
import { ExtendedProfile } from '@/types/supabase-schema';
import { FilterSet, SavedItem } from '@/types/filter-types';
import { handleError } from '@/utils/error-handler';

export default function UserManagementPage() {
  const { data: profile, isLoading: profileLoading } = useProfile();
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [savedFilters, setSavedFilters] = useState<SavedItem[]>([]);
  
  // Current filter state
  const [currentFilters, setCurrentFilters] = useState<FilterSet>({
    search: '',
    role: 'all',
    compliance: 'all'
  });

  const isAdmin = profile?.role && ['SA', 'AD'].includes(profile.role);
  const userManagement = useUserManagement();
  
  // Filter users based on current filters
  const filteredUsers = React.useMemo(() => {
    try {
      let result = [...userManagement.users];
      
      // Apply search filter
      if (currentFilters.search) {
        const searchLower = currentFilters.search.toLowerCase();
        result = result.filter(user => 
          (user.display_name && user.display_name.toLowerCase().includes(searchLower)) || 
          (user.email && user.email.toLowerCase().includes(searchLower))
        );
      }
      
      // Apply role filter
      if (currentFilters.role !== 'all') {
        result = result.filter(user => user.role === currentFilters.role);
      }
      
      // Apply compliance filter
      if (currentFilters.compliance === 'compliant') {
        result = result.filter(user => user.compliance_status === true);
      } else if (currentFilters.compliance === 'non-compliant') {
        result = result.filter(user => user.compliance_status === false);
      }
      
      return result;
    } catch (error) {
      handleError(error, { context: 'Filtering users' });
      return [];
    }
  }, [userManagement.users, currentFilters]);

  // Setup pagination
  const {
    paginatedData: paginatedUsers,
    currentPage,
    totalPages,
    goToPage,
    totalItems,
    startItem,
    endItem
  } = usePagination<ExtendedProfile>({
    data: filteredUsers,
    pageSize: 10
  });

  // Save current filters
  const handleSaveFilter = (name: string) => {
    setSavedFilters(prev => [...prev, { name, filters: { ...currentFilters } }]);
  };

  // Load saved filter
  const handleLoadFilter = (filterItem: SavedItem) => {
    setCurrentFilters(filterItem.filters);
  };

  // Handle filter changes
  const handleFilterChange = (key: keyof FilterSet, value: string) => {
    setCurrentFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const isLoading = userManagement.loading || profileLoading;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Card className="container mx-auto my-8 max-w-7xl">
        <CardHeader className="flex flex-row items-center justify-between bg-muted/50">
          <div>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              User Management
            </CardTitle>
            {isAdmin && (
              <p className="text-sm text-muted-foreground mt-1">
                Manage user accounts, roles, and compliance
              </p>
            )}
          </div>
          
          {isAdmin && (
            <Button onClick={() => setIsInviteDialogOpen(true)} className="gap-1">
              <UserPlus className="h-4 w-4" />
              Invite User
            </Button>
          )}
        </CardHeader>
        
        <CardContent className="pt-6 px-6 pb-8 space-y-6">
          <UserFilters 
            currentFilters={currentFilters}
            onFilterChange={handleFilterChange}
            savedFilters={savedFilters}
            onSaveFilter={handleSaveFilter}
            onLoadFilter={handleLoadFilter}
          />
          
          <UserTable
            users={paginatedUsers}
            loading={isLoading}
            error={userManagement.error}
            selectedUsers={userManagement.selectedUsers}
            onSelectUser={userManagement.handleSelectUser}
            dialogHandlers={userManagement}
            isAdmin={!!isAdmin}
          />
          
          {totalPages > 1 && (
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-between items-center pt-4">
              <p className="text-sm text-muted-foreground">
                Showing {startItem} to {endItem} of {totalItems} users
              </p>
              <DataPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={goToPage}
              />
            </div>
          )}
        </CardContent>
      </Card>
      
      {isAdmin && (
        <InviteUserDialog
          open={isInviteDialogOpen}
          onOpenChange={setIsInviteDialogOpen}
          onInviteSent={userManagement.fetchUsers}
        />
      )}
    </DashboardLayout>
  );
}
