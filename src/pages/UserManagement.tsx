
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { ROLE_LABELS, UserRole } from "@/lib/roles";
import { AlertCircle, CheckCircle, Loader2, UserCog, Beaker, KeyRound } from "lucide-react";
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
import { Json } from "@/integrations/supabase/types";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

interface SystemSettings {
  key: string;
  value: {
    enabled: boolean;
  };
}

interface RoleTransitionRequest {
  id: string;
  status: string;
}

interface TestUserCredentials {
  email: string;
  password: string;
}

interface Profile {
  id: string;
  role: UserRole;
  created_at: string;
  role_transition_requests?: RoleTransitionRequest[];
  is_test_data?: boolean;
  display_name?: string;
  credentials?: TestUserCredentials;
}

interface SupabaseSystemSettings {
  id: string;
  key: string;
  value: Json;
  created_at: string;
  updated_at: string;
}

export default function UserManagement() {
  const { data: currentUserProfile, isLoading: isLoadingProfile } = useProfile();

  // Fetch system settings to check if test data is enabled
  const { data: systemSettings } = useQuery({
    queryKey: ['systemSettings'],
    queryFn: async () => {
      console.log('Fetching system settings');
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('key', 'test_data_enabled')
        .single();

      if (error) {
        console.error('Error fetching system settings:', error);
        throw error;
      }
      
      console.log('Fetched system settings:', data);
      
      const rawSettings = data as SupabaseSystemSettings;
      const settings: SystemSettings = {
        key: rawSettings.key,
        value: {
          enabled: typeof rawSettings.value === 'boolean' ? rawSettings.value : false
        }
      };
      
      console.log('Processed system settings:', settings);
      return settings;
    },
  });

  // Fetch all profiles if user is SA or AD, otherwise only their own
  const { data: profiles, isLoading: isLoadingProfiles } = useQuery({
    queryKey: ['profiles', systemSettings?.value?.enabled],
    queryFn: async () => {
      console.log('Fetching profiles with current user role:', currentUserProfile?.role);
      console.log('Test data enabled:', systemSettings?.value?.enabled);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*, role_transition_requests!role_transition_requests_user_id_fkey(*)')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching profiles:', error);
        throw error;
      }

      console.log('Fetched profiles:', data);

      // If test data is enabled and we have test users, include them
      if (systemSettings?.value?.enabled === true) {
        console.log('Adding test users to profiles');
        // Add test users for all roles with personalized data
        const testUsers: Profile[] = [
          {
            id: 'test-sa',
            role: 'SA',
            created_at: new Date().toISOString(),
            is_test_data: true,
            display_name: "Alex Thompson",
            credentials: {
              email: "test.sa@example.com",
              password: "TestSA123!"
            }
          },
          {
            id: 'test-ad',
            role: 'AD',
            created_at: new Date().toISOString(),
            is_test_data: true,
            display_name: "Sarah Chen",
            credentials: {
              email: "test.ad@example.com",
              password: "TestAD123!"
            }
          },
          {
            id: 'test-ap',
            role: 'AP',
            created_at: new Date().toISOString(),
            is_test_data: true,
            display_name: "Michael Rodriguez",
            credentials: {
              email: "test.ap@example.com",
              password: "TestAP123!"
            }
          },
          {
            id: 'test-ic',
            role: 'IC',
            created_at: new Date().toISOString(),
            is_test_data: true,
            display_name: "Emma Wilson",
            credentials: {
              email: "test.ic@example.com",
              password: "TestIC123!"
            }
          },
          {
            id: 'test-ip',
            role: 'IP',
            created_at: new Date().toISOString(),
            is_test_data: true,
            display_name: "David Park",
            credentials: {
              email: "test.ip@example.com",
              password: "TestIP123!"
            }
          },
          {
            id: 'test-it',
            role: 'IT',
            created_at: new Date().toISOString(),
            is_test_data: true,
            display_name: "Lisa Martinez",
            credentials: {
              email: "test.it@example.com",
              password: "TestIT123!"
            }
          },
        ];
        const combinedProfiles = [...data, ...testUsers];
        console.log('Combined profiles with test data:', combinedProfiles);
        return combinedProfiles as Profile[];
      }

      return data as Profile[];
    },
    enabled: !isLoadingProfile,
  });

  if (isLoadingProfile) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center p-4">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

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
                    {profiles?.map((profile) => {
                      const hasPendingRequest = profile.role_transition_requests?.some(
                        (request) => request.status === 'PENDING'
                      );

                      return (
                        <TableRow 
                          key={profile.id}
                          className={profile.is_test_data ? 'bg-muted/20' : ''}
                        >
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium">
                                {profile.display_name || 'N/A'}
                              </div>
                              <div className="font-mono text-xs text-muted-foreground">
                                {profile.id}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {ROLE_LABELS[profile.role]}
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
                                <Beaker className="h-3 w-3" />
                                Test Data
                              </Badge>
                            ) : (
                              <Badge variant="default">Production</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {new Date(profile.created_at).toLocaleDateString()}
                          </TableCell>
                          {(currentUserProfile.role === 'SA' || currentUserProfile.role === 'AD') && (
                            <TableCell>
                              {profile.is_test_data && profile.credentials ? (
                                <HoverCard>
                                  <HoverCardTrigger>
                                    <div className="flex items-center gap-1 text-muted-foreground hover:text-foreground cursor-pointer">
                                      <KeyRound className="h-4 w-4" />
                                      <span>View Credentials</span>
                                    </div>
                                  </HoverCardTrigger>
                                  <HoverCardContent className="w-80">
                                    <div className="space-y-2">
                                      <h4 className="font-medium">Test User Credentials</h4>
                                      <div className="space-y-1">
                                        <p className="text-sm">
                                          <span className="font-medium">Email:</span>{" "}
                                          {profile.credentials.email}
                                        </p>
                                        <p className="text-sm">
                                          <span className="font-medium">Password:</span>{" "}
                                          {profile.credentials.password}
                                        </p>
                                      </div>
                                    </div>
                                  </HoverCardContent>
                                </HoverCard>
                              ) : (
                                <span className="text-muted-foreground">N/A</span>
                              )}
                            </TableCell>
                          )}
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

