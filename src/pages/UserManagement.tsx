
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProfile } from "@/hooks/useProfile";
import { Loader2, UserCog } from "lucide-react";
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
import type { Profile } from "@/types/user-management";

export default function UserManagement() {
  const { data: currentUserProfile, isLoading: isLoadingProfile } = useProfile();
  const { data: systemSettings } = useSystemSettings();
  const { data: profiles, isLoading: isLoadingProfiles } = useUserProfiles(systemSettings?.value?.enabled);

  const [searchValue, setSearchValue] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [complianceFilter, setComplianceFilter] = useState("all");

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
      profile.id.toLowerCase().includes(searchValue.toLowerCase());
      
    const matchesRole = roleFilter === "all" || profile.role === roleFilter;
    
    const matchesCompliance = complianceFilter === "all" || 
      (complianceFilter === "compliant" && profile.compliance_status) ||
      (complianceFilter === "non-compliant" && !profile.compliance_status);

    // Hide SA roles from the list for non-SA users
    if (currentUserProfile.role !== 'SA' && profile.role === 'SA') {
      return false;
    }

    return matchesSearch && matchesRole && matchesCompliance;
  }) || [];

  const totalUsers = filteredProfiles.length || 0;
  const compliantUsers = filteredProfiles.filter(p => p.compliance_status).length || 0;
  const nonCompliantUsers = totalUsers - compliantUsers;

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
          {currentUserProfile.role === 'AD' && (
            <InviteUserDialog />
          )}
        </div>

        <ComplianceStats
          totalUsers={totalUsers}
          compliantUsers={compliantUsers}
          nonCompliantUsers={nonCompliantUsers}
        />

        <SupervisionManagement />

        <FilterBar
          searchValue={searchValue}
          roleFilter={roleFilter}
          complianceFilter={complianceFilter}
          onSearchChange={setSearchValue}
          onRoleFilterChange={setRoleFilter}
          onComplianceFilterChange={setComplianceFilter}
        />

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
                      <TableHead>User Info</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Compliance</TableHead>
                      <TableHead>Last Check</TableHead>
                      {currentUserProfile.role === 'AD' && (
                        <TableHead>Actions</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProfiles.map((profile) => (
                      <UserTableRow
                        key={profile.id}
                        profile={profile}
                        showCredentials={currentUserProfile.role === 'AD'}
                      />
                    ))}
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
