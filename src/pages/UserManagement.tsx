
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

export default function UserManagement() {
  const { data: currentUserProfile, isLoading: isLoadingProfile } = useProfile();
  const { data: systemSettings } = useSystemSettings();
  const { data: profiles, isLoading: isLoadingProfiles } = useUserProfiles(systemSettings);

  if (isLoadingProfile) {
    return <UserManagementLoading />;
  }

  if (!currentUserProfile?.role || !['SA', 'AD'].includes(currentUserProfile.role)) {
    return <UserManagementAccessDenied />;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
            <p className="text-muted-foreground">
              Manage user roles and access permissions
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5" />
              Users
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
                      <TableHead>Type</TableHead>
                      <TableHead>Created At</TableHead>
                      {(currentUserProfile.role === 'SA' || currentUserProfile.role === 'AD') && (
                        <TableHead>Login Info</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {profiles?.map((profile) => (
                      <UserTableRow
                        key={profile.id}
                        profile={profile}
                        showCredentials={
                          currentUserProfile.role === 'SA' || currentUserProfile.role === 'AD'
                        }
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
