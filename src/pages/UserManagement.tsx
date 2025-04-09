
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProfile } from "@/hooks/useProfile";
import { Loader2, Search, UserCog } from "lucide-react";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { UserTableRow } from "@/components/user-management/UserTableRow";
import { UserManagementLoading } from "@/components/user-management/UserManagementLoading";
import { UserManagementAccessDenied } from "@/components/user-management/UserManagementAccessDenied";
import { FilterBar } from "@/components/user-management/FilterBar";
import { ComplianceStats } from "@/components/user-management/ComplianceStats";
import { InviteUserDialog } from "@/components/user-management/InviteUserDialog";
import { SupervisionManagement } from "@/components/user-management/SupervisionManagement";
import { useState } from "react";
import { Profile } from "@/types/user-management";
import { BulkActionsMenu } from "@/components/user-management/BulkActionsMenu";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ROLE_LABELS } from "@/lib/roles";

export default function UserManagement() {
  const { data: currentUserProfile, isLoading: isLoadingProfile } = useProfile();
  const { data: systemSettings } = useSystemSettings();
  const { data: profiles, isLoading: isLoadingProfiles, refetch: refetchProfiles } = useUserProfiles();

  const [searchValue, setSearchValue] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [complianceFilter, setComplianceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("active");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  if (isLoadingProfile) {
    return <UserManagementLoading />;
  }

  // Allow both AD and SA roles to access
  if (!currentUserProfile?.role || !['AD', 'SA'].includes(currentUserProfile.role)) {
    return <UserManagementAccessDenied />;
  }

  // Filter out SA roles from the displayed profiles for non-SA users
  const filteredProfiles = profiles?.filter((profile: Profile) => {
    const matchesSearch = searchValue === "" || 
      profile.display_name?.toLowerCase().includes(searchValue.toLowerCase()) ||
      profile.email?.toLowerCase().includes(searchValue.toLowerCase()) ||
      profile.id.toLowerCase().includes(searchValue.toLowerCase());
      
    const matchesRole = roleFilter === "all" || profile.role === roleFilter;
    
    const matchesCompliance = complianceFilter === "all" || 
      (complianceFilter === "compliant" && profile.compliance_status) ||
      (complianceFilter === "non-compliant" && !profile.compliance_status);
    
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && profile.status !== "INACTIVE") || 
      (statusFilter === "inactive" && profile.status === "INACTIVE");

    // Hide SA roles from the list for non-SA users
    if (currentUserProfile.role !== 'SA' && profile.role === 'SA') {
      return false;
    }

    return matchesSearch && matchesRole && matchesCompliance && matchesStatus;
  }) || [];

  const totalUsers = filteredProfiles.length || 0;
  const compliantUsers = filteredProfiles.filter(p => p.compliance_status).length || 0;
  const nonCompliantUsers = totalUsers - compliantUsers;

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    
    if (checked) {
      setSelectedUsers(filteredProfiles.map(profile => profile.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers(prev => [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
    // Reset selection when search changes
    setSelectedUsers([]);
    setSelectAll(false);
  };

  const handleBulkActionSuccess = () => {
    refetchProfiles();
    setSelectedUsers([]);
    setSelectAll(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
            <p className="text-muted-foreground">
              Manage user roles and monitor compliance
            </p>
          </div>
          {['AD', 'SA'].includes(currentUserProfile.role) && (
            <div className="flex items-center gap-2">
              <BulkActionsMenu 
                selectedUsers={selectedUsers} 
                onSuccess={handleBulkActionSuccess} 
              />
              <InviteUserDialog />
            </div>
          )}
        </div>

        <ComplianceStats
          totalUsers={totalUsers}
          compliantUsers={compliantUsers}
          nonCompliantUsers={nonCompliantUsers}
        />

        <SupervisionManagement />

        {/* Enhanced Search and Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users by name or email..."
              className="pl-8"
              value={searchValue}
              onChange={handleSearchChange}
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Filter by Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {Object.entries(ROLE_LABELS).map(([role, label]) => (
                  <SelectItem key={role} value={role}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={complianceFilter} onValueChange={setComplianceFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Compliance Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Compliance</SelectItem>
                <SelectItem value="compliant">Compliant</SelectItem>
                <SelectItem value="non-compliant">Non-Compliant</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5" />
              Users and Compliance Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingProfiles ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <div className="relative overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">
                        <Checkbox 
                          checked={selectAll} 
                          onCheckedChange={handleSelectAll}
                          aria-label="Select all users"
                        />
                      </TableHead>
                      <TableHead>User Info</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Compliance</TableHead>
                      <TableHead>Last Active</TableHead>
                      {currentUserProfile.role === 'AD' && (
                        <TableHead>Actions</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProfiles.length === 0 ? (
                      <TableRow>
                        <TableHead colSpan={7} className="text-center py-6 text-muted-foreground">
                          No users match the current filters
                        </TableHead>
                      </TableRow>
                    ) : (
                      filteredProfiles.map((profile) => (
                        <UserTableRow
                          key={profile.id}
                          profile={profile}
                          showCredentials={currentUserProfile.role === 'AD'}
                          isSelected={selectedUsers.includes(profile.id)}
                          onSelect={(checked) => handleSelectUser(profile.id, checked)}
                          onStatusChange={refetchProfiles}
                        />
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
