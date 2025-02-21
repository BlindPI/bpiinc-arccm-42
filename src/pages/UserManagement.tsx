
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { ROLE_LABELS, UserRole } from "@/lib/roles";
import { AlertCircle, CheckCircle, Loader2, UserCog, BeakerIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

export default function UserManagement() {
  const { data: currentUserProfile } = useProfile();

  // Fetch system settings to check if test data is enabled
  const { data: systemSettings } = useQuery({
    queryKey: ['systemSettings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('key', 'showTestData')
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Fetch all profiles if user is SA or AD, otherwise only their own
  const { data: profiles, isLoading: isLoadingProfiles } = useQuery({
    queryKey: ['profiles', systemSettings?.value?.enabled],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, role_transition_requests!role_transition_requests_user_id_fkey(*))')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // If test data is enabled and we have test users, include them
      if (systemSettings?.value?.enabled) {
        // Add test users
        const testUsers = [
          {
            id: 'test-1',
            role: 'IT',
            created_at: new Date().toISOString(),
            is_test_data: true,
          },
          {
            id: 'test-2',
            role: 'IC',
            created_at: new Date().toISOString(),
            is_test_data: true,
          },
          {
            id: 'test-3',
            role: 'AP',
            created_at: new Date().toISOString(),
            is_test_data: true,
          },
        ];
        return [...data, ...testUsers];
      }

      return data;
    },
    enabled: !!currentUserProfile?.role && !!systemSettings
  });

  if (!currentUserProfile?.role || !['SA', 'AD'].includes(currentUserProfile.role)) {
    return (
      <DashboardLayout>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You don't have permission to access the User Management section.
          </AlertDescription>
        </Alert>
      </DashboardLayout>
    );
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
                      <TableHead>User ID</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Created At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {profiles?.map((profile) => {
                      const hasPendingRequest = profile.role_transition_requests?.some(
                        (request: any) => request.status === 'PENDING'
                      );

                      return (
                        <TableRow 
                          key={profile.id}
                          className={profile.is_test_data ? 'bg-muted/20' : ''}
                        >
                          <TableCell className="font-mono">{profile.id}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {ROLE_LABELS[profile.role as UserRole]}
                              </span>
                              {hasPendingRequest && (
                                <Badge variant="outline" className="text-xs">
                                  Pending Role Change
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span>Active</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {profile.is_test_data ? (
                              <Badge variant="secondary" className="flex items-center gap-1">
                                <BeakerIcon className="h-3 w-3" />
                                Test Data
                              </Badge>
                            ) : (
                              <Badge variant="default">Production</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {new Date(profile.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      );
                    })}
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
