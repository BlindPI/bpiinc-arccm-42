
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Loader2 } from 'lucide-react';
import type { UserRole } from '@/lib/roles';
import { ROLE_LABELS, ROLE_HIERARCHY } from '@/lib/roles';
import { useProfile } from '@/hooks/useProfile';
import { useSystemSettings } from '@/hooks/useSystemSettings';

const Index = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const [targetRole, setTargetRole] = useState<UserRole | ''>('');
  
  // If auth is still loading, show loading state
  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading authentication...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Check if user is authenticated before making any other queries
  if (!user) {
    console.log('No user found, redirecting to auth');
    return <Navigate to="/auth" replace />;
  }

  // First, fetch system settings - this query should run independently
  const { data: systemSettings, isLoading: systemSettingsLoading } = useSystemSettings();
  
  // Then, fetch profile but don't depend on systemSettings loading state
  const { data: profile, isLoading: profileLoading, error: profileError } = useProfile({
    enabled: !!user.id,
  });

  const { data: pendingRequest, isLoading: requestLoading } = useQuery({
    queryKey: ['roleRequest', user.id],
    queryFn: async () => {
      if (!user.id) return null;
      
      const { data, error } = await supabase
        .from('role_transition_requests')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'PENDING')
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user.id && !profileLoading, // Only fetch after profile is loaded
    retry: 1,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  // Show loading state only when profile is loading (since it's essential)
  if (profileLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading your profile...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Handle profile error first since it's critical
  if (profileError) {
    return (
      <DashboardLayout>
        <div className="p-4">
          <Alert variant="destructive">
            <AlertDescription>
              An error occurred while loading your profile. Please try refreshing the page.
            </AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    );
  }

  // If we get here, we have a profile
  const availableRoles = profile ? ROLE_HIERARCHY[profile.role as UserRole] : [];
  const isSuperAdmin = profile?.role === 'SA';

  const handleRoleRequest = async () => {
    if (!user || !profile || !targetRole) return;
    
    try {
      const { error } = await supabase
        .from('role_transition_requests')
        .insert({
          user_id: user.id,
          from_role: profile.role,
          to_role: targetRole,
        });

      if (error) throw error;
      
      toast.success('Role transition request submitted successfully');
      setTargetRole('');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {isSuperAdmin && (
          <Alert className="bg-blue-50 border-blue-200">
            <AlertDescription className="text-blue-800">
              You are logged in as a System Administrator (Superadmin)
            </AlertDescription>
          </Alert>
        )}
        <Card>
          <CardHeader>
            <CardTitle>Welcome to Certificate Management</CardTitle>
            <CardDescription>
              Manage your certifications and role requests
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-2">
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{user.email}</p>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-sm text-gray-500">Current Role</p>
              <p className="font-medium">{profile?.role ? ROLE_LABELS[profile.role as UserRole] : 'No role assigned'}</p>
            </div>
            
            {pendingRequest ? (
              <div className="bg-yellow-50 p-4 rounded-md">
                <p className="text-sm text-yellow-800">
                  You have a pending request to transition from {ROLE_LABELS[pendingRequest.from_role]} to {ROLE_LABELS[pendingRequest.to_role]}
                </p>
              </div>
            ) : availableRoles.length > 0 ? (
              <div className="space-y-4">
                <p className="text-sm font-medium">Request Role Transition</p>
                <div className="flex gap-4">
                  <Select value={targetRole} onValueChange={(value) => setTargetRole(value as UserRole)}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select new role" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRoles.map((role) => (
                        <SelectItem key={role} value={role}>
                          {ROLE_LABELS[role]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={handleRoleRequest} disabled={!targetRole}>
                    Submit Request
                  </Button>
                </div>
              </div>
            ) : null}
            
            <div className="pt-4">
              <Button onClick={signOut} variant="outline">Sign Out</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Index;
