
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Loader2, Award, Clock, CheckCircle2, AlertCircle, UserCircle2, ChevronRight, BarChart2 } from 'lucide-react';
import { UserRole } from '@/lib/roles';
import { ROLE_LABELS } from '@/lib/roles';
import { useProfile } from '@/hooks/useProfile';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { Progress } from '@/components/ui/progress';
import { PageHeader } from "@/components/ui/PageHeader";
import { Link } from "react-router-dom";
import { cn } from '@/lib/utils';
import { useEffect } from 'react';
import { useRealtime } from '@/contexts/RealtimeContext';
import { useCertificateAnalytics } from '@/hooks/useCertificateAnalytics';

const Index = () => {
  const { user, signOut } = useAuth();
  const { data: systemSettings, isLoading: systemSettingsLoading } = useSystemSettings();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { realtimeEnabled } = useRealtime();
  const isAdmin = profile?.role === 'SA' || profile?.role === 'AD';
  
  // If user is admin, use analytics data for a comprehensive view
  const {
    totalActive,
    totalExpired,
    totalRevoked,
    statusCounts,
    isLoading: analyticsLoading
  } = useCertificateAnalytics({
    enabled: isAdmin && !!user
  });
  
  // For non-admin users, just show their issued certificates
  const { data: certificateStats, isLoading: statsLoading } = useQuery({
    queryKey: ['certificateStats', user?.id, isAdmin],
    queryFn: async () => {
      // For admins, get all certificates
      const query = isAdmin 
        ? supabase.from('certificates').select('status')
        : supabase.from('certificates').select('status').eq('issued_by', user?.id);
        
      const { data, error } = await query;

      if (error) throw error;

      const stats = {
        total: data.length,
        active: data.filter(cert => cert.status === 'ACTIVE').length,
        expired: data.filter(cert => cert.status === 'EXPIRED').length,
        revoked: data.filter(cert => cert.status === 'REVOKED').length
      };

      return stats;
    },
    enabled: !!user,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 1000 * 60 * 2, // 2 minutes
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
    retry: 1,
    refetchOnWindowFocus: true,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Log when realtime subscriptions are active
  useEffect(() => {
    if (realtimeEnabled && user) {
      console.log('Realtime subscriptions are enabled for the dashboard');
    }
  }, [realtimeEnabled, user]);

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const isSuperAdmin = profile?.role === 'SA';
  const isLoading = systemSettingsLoading || profileLoading || requestLoading || statsLoading || analyticsLoading;

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Use either analytics data (for admins) or certificate stats (for regular users)
  const stats = isAdmin && totalActive !== undefined
    ? {
        total: (totalActive || 0) + (totalExpired || 0) + (totalRevoked || 0),
        active: totalActive || 0,
        expired: totalExpired || 0,
        revoked: totalRevoked || 0
      }
    : certificateStats || { total: 0, active: 0, expired: 0, revoked: 0 };

  const statCards = [
    {
      title: 'Total Certificates',
      value: stats.total,
      icon: Award,
      description: isAdmin ? 'All certificates in the system' : 'Certificates you have issued',
      gradient: 'from-blue-50 to-white',
      iconColor: 'text-blue-600'
    },
    {
      title: 'Active Certificates',
      value: stats.active,
      icon: CheckCircle2,
      description: 'Currently valid certificates',
      gradient: 'from-green-50 to-white',
      iconColor: 'text-green-600'
    },
    {
      title: 'Revoked Certificates',
      value: stats.revoked,
      icon: Clock,
      description: 'Certificates revoked',
      gradient: 'from-amber-50 to-white',
      iconColor: 'text-amber-600'
    },
    {
      title: 'Expired',
      value: stats.expired,
      icon: AlertCircle,
      description: 'Needs renewal',
      gradient: 'from-red-50 to-white',
      iconColor: 'text-red-600'
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <PageHeader
              icon={<UserCircle2 className="h-7 w-7 text-primary" />}
              title={`${getTimeOfDay()}, ${user.email?.split('@')[0]}`}
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

            {isAdmin && (
              <Card className="border-2 bg-gradient-to-br from-white to-blue-50/30 shadow-md">
                <CardHeader>
                  <CardTitle className="text-xl text-gray-900 flex items-center gap-2">
                    <BarChart2 className="h-5 w-5 text-primary" />
                    Certificate Analytics Overview
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Performance metrics for all certificates in the system
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Certificate Status Distribution</h3>
                      <div className="space-y-2">
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span>Active</span>
                            <span>{Math.round((stats.active / (stats.total || 1)) * 100)}%</span>
                          </div>
                          <Progress value={(stats.active / (stats.total || 1)) * 100} className="h-2 bg-gray-200" />
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span>Expired</span>
                            <span>{Math.round((stats.expired / (stats.total || 1)) * 100)}%</span>
                          </div>
                          <Progress value={(stats.expired / (stats.total || 1)) * 100} className="h-2 bg-gray-200" />
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span>Revoked</span>
                            <span>{Math.round((stats.revoked / (stats.total || 1)) * 100)}%</span>
                          </div>
                          <Progress value={(stats.revoked / (stats.total || 1)) * 100} className="h-2 bg-gray-200" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Quick Actions</h3>
                      <div className="space-y-2">
                        <Link 
                          to="/certifications?tab=certificates&status=active" 
                          className="flex items-center justify-between p-2 bg-white rounded border border-gray-200 hover:bg-blue-50 transition-colors"
                        >
                          <span className="text-sm">View Active Certificates</span>
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                        <Link 
                          to="/certifications?tab=requests" 
                          className="flex items-center justify-between p-2 bg-white rounded border border-gray-200 hover:bg-blue-50 transition-colors"
                        >
                          <span className="text-sm">Review Pending Requests</span>
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                        <Link 
                          to="/certificate-analytics" 
                          className="flex items-center justify-between p-2 bg-white rounded border border-gray-200 hover:bg-blue-50 transition-colors"
                        >
                          <span className="text-sm">Detailed Analytics</span>
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

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
                    <span className="text-gray-900 font-semibold">{user.email}</span>
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
    </DashboardLayout>
  );
};

export default Index;
