import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Loader2, Award, Clock, CheckCircle2, AlertCircle, UserCircle2, ChevronRight, Users, MapPin, CalendarRange } from 'lucide-react';
import { UserRole } from '@/lib/roles';
import { ROLE_LABELS } from '@/lib/roles';
import { useProfile } from '@/hooks/useProfile';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { Progress } from '@/components/ui/progress';
import { PageHeader } from "@/components/ui/PageHeader";
import { Link } from "react-router-dom";
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { useRealtime } from '@/contexts/RealtimeContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Index = () => {
  const { user, signOut } = useAuth();
  const { data: systemSettings, isLoading: systemSettingsLoading } = useSystemSettings();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { realtimeEnabled } = useRealtime();
  const [activeTab, setActiveTab] = useState('personal');

  const isAdmin = profile?.role === 'SA' || profile?.role === 'AD';

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
    enabled: !!user,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Add company-wide certificate stats for admins
  const { data: companyStats, isLoading: companyStatsLoading } = useQuery({
    queryKey: ['companyCertificateStats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('certificates')
        .select('status, issue_date'); // Updated to select issue_date as well

      if (error) throw error;

      // Get user count
      const { count: userCount, error: userError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
        
      if (userError) throw userError;
      
      // Get location count
      const { count: locationCount, error: locationError } = await supabase
        .from('locations')
        .select('*', { count: 'exact', head: true });
        
      if (locationError) throw locationError;
      
      const stats = {
        total: data.length,
        active: data.filter(cert => cert.status === 'ACTIVE').length,
        expired: data.filter(cert => cert.status === 'EXPIRED').length,
        revoked: data.filter(cert => cert.status === 'REVOKED').length,
        userCount: userCount || 0,
        locationCount: locationCount || 0,
        thisMonth: data.filter(cert => {
          // Filter for certificates issued in the current month
          if (!cert.issue_date) return false;
          const today = new Date();
          const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
          try {
            const issueDate = new Date(cert.issue_date);
            return issueDate >= firstDayOfMonth;
          } catch (e) {
            return false;
          }
        }).length
      };

      return stats;
    },
    enabled: !!user && isAdmin,
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
  const isLoading = systemSettingsLoading || profileLoading || requestLoading || statsLoading || (isAdmin && companyStatsLoading);

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const personalStatCards = [
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

  // Company-wide stat cards for admins
  const companyStatCards = [
    {
      title: 'All Certificates',
      value: companyStats?.total || 0,
      icon: Award,
      description: 'Total certificates in system',
      gradient: 'from-indigo-50 to-white',
      iconColor: 'text-indigo-600'
    },
    {
      title: 'Active System-Wide',
      value: companyStats?.active || 0,
      icon: CheckCircle2,
      description: 'Currently valid across all users',
      gradient: 'from-emerald-50 to-white',
      iconColor: 'text-emerald-600'
    },
    {
      title: 'Users',
      value: companyStats?.userCount || 0,
      icon: Users,
      description: 'Total registered users',
      gradient: 'from-violet-50 to-white',
      iconColor: 'text-violet-600'
    },
    {
      title: 'Locations',
      value: companyStats?.locationCount || 0,
      icon: MapPin,
      description: 'Registered locations',
      gradient: 'from-cyan-50 to-white',
      iconColor: 'text-cyan-600'
    },
    {
      title: 'This Month',
      value: companyStats?.thisMonth || 0,
      icon: CalendarRange,
      description: 'Certificates issued this month',
      gradient: 'from-blue-50 to-white',
      iconColor: 'text-blue-600'
    },
    {
      title: 'Need Renewal',
      value: companyStats?.expired || 0,
      icon: AlertCircle,
      description: 'Expired certificates',
      gradient: 'from-orange-50 to-white',
      iconColor: 'text-orange-600'
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

            {isAdmin && (
              <Tabs defaultValue="personal" className="w-full" onValueChange={setActiveTab}>
                <div className="flex justify-center mb-4">
                  <TabsList className="grid grid-cols-2 w-[400px]">
                    <TabsTrigger value="personal">Personal Stats</TabsTrigger>
                    <TabsTrigger value="company">Company Stats</TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="personal" className="mt-0">
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {personalStatCards.map((stat, index) => (
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
                </TabsContent>
                
                <TabsContent value="company" className="mt-0">
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {companyStatCards.map((stat, index) => (
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
                  
                  <div className="mt-6 flex justify-end">
                    <Link 
                      to="/certificate-analytics" 
                      className="inline-flex items-center px-4 py-2 rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                    >
                      View Detailed Analytics
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Link>
                  </div>
                </TabsContent>
              </Tabs>
            )}

            {!isAdmin && (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {personalStatCards.map((stat, index) => (
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
