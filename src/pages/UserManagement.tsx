
import React from 'react';
import { useProfile } from '@/hooks/useProfile';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Users, FileSpreadsheet, Download, Filter } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { UserTable } from '@/components/user-management/UserTable';
import { FilterBar } from '@/components/user-management/FilterBar';
import { SavedFiltersMenu } from '@/components/user-management/SavedFiltersMenu';
import { UserManagementLoading } from '@/components/user-management/UserManagementLoading';
import { UserManagementAccessDenied } from '@/components/user-management/UserManagementAccessDenied';
import { CompanyWideMetrics } from '@/components/user-management/CompanyWideMetrics';
import { FilterSet } from '@/types/filter-types';

// Dummy data for initial state until real data is fetched
const initialFilters: FilterSet = { search: "", role: "all", compliance: "all" };

const UserManagementPage: React.FC = () => {
  const { data: profile, isLoading } = useProfile();
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState("all");
  const [complianceFilter, setComplianceFilter] = React.useState("all");
  const [savedFilters, setSavedFilters] = React.useState<Array<{name: string, filters: FilterSet}>>([]);
  const [selectedUsers, setSelectedUsers] = React.useState<string[]>([]);
  
  const isAdmin = profile?.role && ['SA', 'AD'].includes(profile.role);

  // Handlers for filter actions
  const handleSearchChange = (value: string) => setSearchTerm(value);
  const handleRoleFilterChange = (value: string) => setRoleFilter(value);
  const handleComplianceFilterChange = (value: string) => setComplianceFilter(value);
  const handleClearFilters = () => {
    setSearchTerm("");
    setRoleFilter("all");
    setComplianceFilter("all");
  };

  // Handlers for saved filters
  const handleSaveFilter = (name: string) => {
    setSavedFilters([...savedFilters, {
      name,
      filters: { search: searchTerm, role: roleFilter, compliance: complianceFilter }
    }]);
  };
  
  const handleApplyFilter = (filters: FilterSet) => {
    setSearchTerm(filters.search);
    setRoleFilter(filters.role);
    setComplianceFilter(filters.compliance);
  };
  
  const handleDeleteFilter = (name: string) => {
    setSavedFilters(savedFilters.filter(filter => filter.name !== name));
  };

  // Dummy handler for user selection
  const handleSelectUser = (userId: string, selected: boolean) => {
    if (selected) {
      setSelectedUsers([...selectedUsers, userId]);
    } else {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    }
  };

  // Dummy dialog handlers
  const dialogHandlers = {
    handleEditClick: () => {},
    handleActivateUser: () => {},
    handleDeactivateUser: () => {},
    handleResetPasswordClick: () => {},
    handleChangeRoleClick: () => {},
    handleViewUserDetail: () => {},
    handleCloseUserDetail: () => {},
    isDetailDialogOpen: false,
    detailUserId: null
  };

  if (isLoading) {
    return <UserManagementLoading />;
  }

  if (!isAdmin) {
    return <UserManagementAccessDenied />;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6 pb-16">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
            <p className="text-muted-foreground mt-2">
              View and manage all system users, roles, and certifications.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => navigate('/user-management/export')}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" onClick={() => navigate('/user-management/invite')}>
              <Users className="h-4 w-4 mr-2" />
              Invite User
            </Button>
          </div>
        </div>
        
        {/* Company-wide metrics section */}
        <CompanyWideMetrics />
        
        <Tabs defaultValue="all-users" className="w-full">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
            <TabsList>
              <TabsTrigger value="all-users">All Users</TabsTrigger>
              <TabsTrigger value="administrators">Administrators</TabsTrigger>
              <TabsTrigger value="instructors">Instructors</TabsTrigger>
              <TabsTrigger value="clients">Clients</TabsTrigger>
            </TabsList>
            
            <div className="flex flex-wrap items-center gap-3">
              <FilterBar 
                onSearchChange={handleSearchChange}
                onRoleFilterChange={handleRoleFilterChange}
                onComplianceFilterChange={handleComplianceFilterChange}
                onClearAllFilters={handleClearFilters}
                searchValue={searchTerm}
                roleFilter={roleFilter}
                complianceFilter={complianceFilter}
                activeTags={[]}
              />
              <SavedFiltersMenu 
                filters={{ search: searchTerm, role: roleFilter, compliance: complianceFilter }}
                savedFilters={savedFilters}
                onSave={handleSaveFilter}
                onApply={handleApplyFilter}
                onDelete={handleDeleteFilter}
              />
            </div>
          </div>
          
          <TabsContent value="all-users" className="mt-0">
            <Card>
              <CardHeader className="px-6 py-4">
                <CardTitle className="text-lg">All System Users</CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="p-0">
                <UserTable 
                  users={[]}  // This would be actual fetched users
                  loading={false}
                  error={null}
                  selectedUsers={selectedUsers}
                  onSelectUser={handleSelectUser}
                  dialogHandlers={dialogHandlers}
                  isAdmin={isAdmin}
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="administrators" className="mt-0">
            <Card>
              <CardHeader className="px-6 py-4">
                <CardTitle className="text-lg">Administrators</CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="p-0">
                {/* For tabs, we'll use the existing UserTable but filter by role directly in UserManagementPage */}
                <UserTable 
                  users={[]} // In actual implementation, filter admins from users
                  loading={false}
                  error={null}
                  selectedUsers={selectedUsers}
                  onSelectUser={handleSelectUser}
                  dialogHandlers={dialogHandlers}
                  isAdmin={isAdmin}
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="instructors" className="mt-0">
            <Card>
              <CardHeader className="px-6 py-4">
                <CardTitle className="text-lg">Instructors</CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="p-0">
                {/* For tabs, we'll use the existing UserTable but filter by role directly in UserManagementPage */}
                <UserTable 
                  users={[]} // In actual implementation, filter instructors from users
                  loading={false}
                  error={null}
                  selectedUsers={selectedUsers}
                  onSelectUser={handleSelectUser}
                  dialogHandlers={dialogHandlers}
                  isAdmin={isAdmin}
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="clients" className="mt-0">
            <Card>
              <CardHeader className="px-6 py-4">
                <CardTitle className="text-lg">Clients</CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="p-0">
                <p className="p-6 text-muted-foreground">
                  Client management module coming soon.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default UserManagementPage;
