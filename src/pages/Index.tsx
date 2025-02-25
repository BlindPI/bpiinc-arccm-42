
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Loader2, Award, Certificate, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { UserRole } from '@/lib/roles';
import { ROLE_LABELS } from '@/lib/roles';
import { useProfile } from '@/hooks/useProfile';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { Progress } from '@/components/ui/progress';

const Index = () => {
  const { user, signOut } = useAuth();
  const { data: systemSettings, isLoading: systemSettingsLoading } = useSystemSettings();
  const { data: profile, isLoading: profileLoading } = useProfile();

  const { data: certificateStats, isLoading: statsLoading } = useQuery({
    queryKey: ['certificateStats', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('certificates')
        .select('status')
        .eq('issued_by', user?.id);

      if (error) throw error;

      const stats = {
        total: data.length,
        active: data.filter(cert => cert.status === 'ACTIVE').length,
        pending: data.filter(cert => cert.status === 'PENDING').length,
        expired: data.filter(cert => cert.status === 'EXPIRED').length
      };

      return stats;
    },
    enabled: !!user
  });

  const { data: pendingRequest, isLoading: requestLoading } = useQuery({
    queryKey: ['roleRequest', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('role_transition_requests')
        .select('*')
        .eq('user_id', user?.id)
        .eq('status', 'PENDING')
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user,
    retry: 1
  });

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const isSuperAdmin = profile?.role === 'SA';
  const isLoading = systemSettingsLoading || profileLoading || requestLoading || statsLoading;

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                {getTimeOfDay()}, {user.email?.split('@')[0]}
              </h1>
              <p className="text-gray-500">
                Welcome to your certificate management dashboard. Here's an overview of your activities.
              </p>
            </div>

            {isSuperAdmin && (
              <Alert className="bg-blue-50 border-blue-200">
                <AlertDescription className="text-blue-800">
                  You are logged in as a System Administrator (Superadmin)
                </AlertDescription>
              </Alert>
            )}

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card className="bg-gradient-to-br from-purple-50 to-white">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Certificates</CardTitle>
                  <Award className="w-4 h-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-700">{certificateStats?.total || 0}</div>
                  <p className="text-xs text-gray-500 mt-1">Certificates issued and managed</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-white">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium text-gray-600">Active Certificates</CardTitle>
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-700">{certificateStats?.active || 0}</div>
                  <p className="text-xs text-gray-500 mt-1">Currently valid certificates</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-amber-50 to-white">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium text-gray-600">Pending Requests</CardTitle>
                  <Clock className="w-4 h-4 text-amber-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-amber-700">{certificateStats?.pending || 0}</div>
                  <p className="text-xs text-gray-500 mt-1">Awaiting approval</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-red-50 to-white">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium text-gray-600">Expired</CardTitle>
                  <AlertCircle className="w-4 h-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-700">{certificateStats?.expired || 0}</div>
                  <p className="text-xs text-gray-500 mt-1">Needs renewal</p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-2">
              <CardHeader>
                <CardTitle>Account Overview</CardTitle>
                <CardDescription>
                  Your current role and access level information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Email</span>
                    <span className="font-medium">{user.email}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Role</span>
                    <span className="font-medium">
                      {profile?.role ? ROLE_LABELS[profile.role as UserRole] : 'No role assigned'}
                    </span>
                  </div>
                  
                  {pendingRequest && (
                    <div className="bg-yellow-50 p-4 rounded-md mt-4">
                      <p className="text-sm text-yellow-800">
                        You have a pending request to transition from {ROLE_LABELS[pendingRequest.from_role]} to {ROLE_LABELS[pendingRequest.to_role]}
                      </p>
                      <Progress className="mt-2" value={66} />
                    </div>
                  )}
                </div>
                
                <div className="pt-4">
                  <Button onClick={signOut} variant="outline">Sign Out</Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Index;
