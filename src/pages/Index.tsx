
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Loader2, Award, Clock, CheckCircle2, AlertCircle, UserCircle2, ChevronRight } from 'lucide-react';
import { UserRole } from '@/lib/roles';
import { ROLE_LABELS } from '@/lib/roles';
import { useProfile } from '@/hooks/useProfile';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { Progress } from '@/components/ui/progress';
import { PageHeader } from "@/components/ui/PageHeader";
import { Link } from "react-router-dom";
import { cn } from '@/lib/utils';
import { ProtectedRoute } from '@/utils/routeUtils';

const Index = () => {
  const { user, signOut, loading, authReady } = useAuth();
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
        expired: data.filter(cert => cert.status === 'EXPIRED').length,
        revoked: data.filter(cert => cert.status === 'REVOKED').length
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

  // We'll use our ProtectedRoute component to handle auth state and redirects
  return (
    <ProtectedRoute user={user} loading={loading} authReady={authReady}>
      <DashboardLayout>
        <IndexContent 
          user={user} 
          profile={profile} 
          certificateStats={certificateStats} 
          pendingRequest={pendingRequest} 
          isLoading={systemSettingsLoading || profileLoading || requestLoading || statsLoading}
          signOut={signOut}
        />
      </DashboardLayout>
    </ProtectedRoute>
  );
};

// Extract the content to a separate component to keep the main component focused on route protection
const IndexContent = ({ 
  user, 
  profile, 
  certificateStats, 
  pendingRequest, 
  isLoading, 
  signOut 
}) => {
  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const statCards = [
    {
      title: 'Total Certificates',
      value: certificateStats?.total || 0,
      icon: Award,
      description: 'Certificates issued and managed',
      gradient: 'from-blue-50 to-white',
      iconColor: 'text-blue-600'
    },
    {
      title: 'Active Certificates',
      value: certificateStats?.active || 0,
      icon: CheckCircle2,
      description: 'Currently valid certificates',
      gradient: 'from-green-50 to-white',
      iconColor: 'text-green-600'
    },
    {
      title: 'Revoked Certificates',
      value: certificateStats?.revoked || 0,
      icon: Clock,
      description: 'Certificates revoked',
      gradient: 'from-amber-50 to-white',
      iconColor: 'text-amber-600'
    },
    {
      title: 'Expired',
      value: certificateStats?.expired || 0,
      icon: AlertCircle,
      description: 'Needs renewal',
      gradient: 'from-red-50 to-white',
      iconColor: 'text-red-600'
    }
  ];

  const isSuperAdmin = profile?.role === 'SA';

  return (
    <div className="space-y-6 animate-fade-in">
      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <PageHeader
            icon={<UserCircle2 className="h-7 w-7 text-primary" />}
            title={`${getTimeOfDay()}, ${user?.email?.split('@')[0] || 'User'}`}
            subtitle="Welcome to your certificate management dashboard"
            className="bg-gradient-to-r from-blue-50 via-white to-blue-50/50"
          />

          {isSuperAdmin && (
            <Alert className="bg-gradient-to-r from-blue-50 to-white border-blue-200 shadow-sm">
              <AlertDescription className="text-blue-800 font-medium">
                You are logged in as a System Administrator
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {statCards.map((stat, index) => (
              <Card 
                key={index} 
                className={cn(
                  "bg-gradient-to-br border-0 shadow-md hover:shadow-lg transition-shadow",
                  stat.gradient
                )}
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className={cn("w-4 h-4", stat.iconColor)} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-2 bg-gradient-to-br from-white to-gray-50/50 shadow-md">
            <CardHeader>
              <CardTitle className="text-xl text-gray-900">Account Overview</CardTitle>
              <CardDescription className="text-gray-600">
                Your current role and access level information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600 font-medium">Email</span>
                  <span className="text-gray-900 font-semibold">{user?.email}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600 font-medium">Role</span>
                  <span className="text-gray-900 font-semibold">
                    {profile?.role ? ROLE_LABELS[profile.role as UserRole] : 'No role assigned'}
                  </span>
                </div>
                
                {pendingRequest && (
                  <div className="bg-gradient-to-r from-amber-50 to-white p-4 rounded-lg border border-amber-200 shadow-sm mt-4">
                    <p className="text-sm text-amber-800 font-medium">
                      Pending role transition request from {ROLE_LABELS[pendingRequest.from_role]} to {ROLE_LABELS[pendingRequest.to_role]}
                    </p>
                    <Progress className="mt-2" value={66} />
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t">
                <Button 
                  onClick={signOut} 
                  variant="outline"
                  className="text-gray-700 hover:text-gray-900"
                >
                  Sign Out
                </Button>
                <Link 
                  to="/progression-paths" 
                  className="inline-flex items-center px-4 py-2 rounded-md bg-primary text-white hover:bg-primary/90 transition-colors"
                >
                  Progression Path Builder
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default Index;
