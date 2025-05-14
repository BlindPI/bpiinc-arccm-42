
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Loader2, Award, Clock, CheckCircle2, AlertCircle, UserCircle2, ChevronRight, BarChart, TrendingUp } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

const Index = () => {
  const { user, signOut } = useAuth();
  const { data: systemSettings, isLoading: systemSettingsLoading } = useSystemSettings();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { realtimeEnabled } = useRealtime();

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

  // Added company-wide certificate stats query for admins
  const { data: companyStats, isLoading: companyStatsLoading } = useQuery({
    queryKey: ['companyStats'],
    queryFn: async () => {
      // Only fetch if user is admin
      if (!profile?.role || !['SA', 'AD'].includes(profile.role)) {
        return null;
      }

      // Get certificate counts by status
      const { data: statusCounts, error: statusError } = await supabase
        .rpc('get_certificate_status_counts');
      
      if (statusError) throw statusError;
      
      // Get monthly trends
      const { data: monthlyTrends, error: trendsError } = await supabase
        .rpc('get_monthly_certificate_counts', { months_limit: 3 });
      
      if (trendsError) throw trendsError;
      
      // Calculate totals from status counts
      let total = 0;
      let active = 0;
      let expired = 0;
      let revoked = 0;
      
      statusCounts.forEach((item: {status: string, count: number}) => {
        total += Number(item.count);
        if (item.status === 'ACTIVE') active = Number(item.count);
        if (item.status === 'EXPIRED') expired = Number(item.count);
        if (item.status === 'REVOKED') revoked = Number(item.count);
      });
      
      // Format monthly data
      const formattedTrends = monthlyTrends.map((item: any) => {
        const [year, month] = item.month.split('-');
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthIndex = parseInt(month, 10) - 1;
        
        return {
          month: `${monthNames[monthIndex]} ${year}`,
          count: Number(item.count)
        };
      });
      
      return {
        total,
        active,
        expired,
        revoked,
        monthlyTrends: formattedTrends,
      };
    },
    enabled: !!profile && ['SA', 'AD'].includes(profile.role as UserRole),
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
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
  const isAdmin = profile?.role && ['SA', 'AD'].includes(profile.role);
  const isLoading = systemSettingsLoading || profileLoading || requestLoading || statsLoading;

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

            {/* For admins, show company-wide metrics and tabs */}
            {isAdmin && (
              <Card className="border shadow-md overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-50/30 pb-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-xl font-bold">Company-Wide Certificate Metrics</CardTitle>
                      <CardDescription>Overview of all certificates in the system</CardDescription>
                    </div>
                    <Button 
                      variant="ghost" 
                      className="gap-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50/50"
                      asChild
                    >
                      <Link to="/certificate-analytics">
                        View Full Analytics
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <Separator />
                <CardContent className="p-0">
                  <Tabs defaultValue="metrics" className="w-full">
                    <TabsList className="w-full rounded-none border-b bg-white">
                      <TabsTrigger value="metrics" className="flex-1">Certificate Metrics</TabsTrigger>
                      <TabsTrigger value="trends" className="flex-1">Recent Trends</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="metrics" className="p-4">
                      {companyStatsLoading ? (
                        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                          {Array(4).fill(0).map((_, i) => (
                            <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-md"></div>
                          ))}
                        </div>
                      ) : (
                        <div className="grid gap-6 grid-cols-2 md:grid-cols-4">
                          <div className="flex flex-col">
                            <span className="text-sm text-muted-foreground mb-1">Total Certificates</span>
                            <span className="text-3xl font-bold">{companyStats?.total.toLocaleString()}</span>
                            <div className="mt-2 flex items-center">
                              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                              <span className="text-xs text-green-600">+12% from last month</span>
                            </div>
                          </div>
                          
                          <div className="flex flex-col">
                            <span className="text-sm text-muted-foreground mb-1">Active Certificates</span>
                            <span className="text-3xl font-bold text-green-600">{companyStats?.active.toLocaleString()}</span>
                            <Progress className="mt-2" value={(companyStats?.active / companyStats?.total) * 100} />
                          </div>
                          
                          <div className="flex flex-col">
                            <span className="text-sm text-muted-foreground mb-1">Expired Certificates</span>
                            <span className="text-3xl font-bold text-amber-500">{companyStats?.expired.toLocaleString()}</span>
                            <Progress className="mt-2" value={(companyStats?.expired / companyStats?.total) * 100} />
                          </div>
                          
                          <div className="flex flex-col">
                            <span className="text-sm text-muted-foreground mb-1">Revoked Certificates</span>
                            <span className="text-3xl font-bold text-red-500">{companyStats?.revoked.toLocaleString()}</span>
                            <Progress className="mt-2" value={(companyStats?.revoked / companyStats?.total) * 100} />
                          </div>
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="trends" className="p-4">
                      {companyStatsLoading ? (
                        <div className="h-48 bg-gray-100 animate-pulse rounded-md"></div>
                      ) : (
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold">Certificate Issuance (Last 3 Months)</h3>
                          <div className="h-48 grid grid-cols-3 gap-4">
                            {companyStats?.monthlyTrends.map((trend: {month: string, count: number}, index: number) => (
                              <div key={index} className="flex flex-col items-center">
                                <div className="flex-1 w-full bg-blue-100 rounded-t-md relative">
                                  <div 
                                    className="absolute bottom-0 w-full bg-blue-500" 
                                    style={{ 
                                      height: `${(trend.count / Math.max(...companyStats.monthlyTrends.map((t: any) => t.count))) * 100}%`,
                                      minHeight: '10%' 
                                    }}
                                  ></div>
                                </div>
                                <div className="py-2 text-center text-sm">{trend.month}</div>
                                <div className="text-sm font-semibold">{trend.count} issued</div>
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-end">
                            <Button variant="link" asChild className="text-blue-600 gap-1 p-0">
                              <Link to="/certificate-analytics">
                                View Detailed Analytics <BarChart className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}

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
