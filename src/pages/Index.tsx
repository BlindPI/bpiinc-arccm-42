import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Navigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Loader2, Award, Clock, CheckCircle2, AlertCircle, UserCircle2, ChevronRight, FileText, Users } from 'lucide-react';
import { UserRole } from '@/lib/roles';
import { ROLE_LABELS } from '@/lib/roles';
import { useProfile } from '@/hooks/useProfile';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { Progress } from '@/components/ui/progress';
import { PageHeader } from "@/components/ui/PageHeader";
import { cn } from '@/lib/utils';
import { DashboardActionCard } from '@/components/dashboard/DashboardActionCard';
import { CertificateStatusChart } from '@/components/dashboard/CertificateStatusChart';
import { CertificateTrendsChart } from '@/components/dashboard/CertificateTrendsChart';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';

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
        expired: data.filter(cert => cert.status === 'EXPIRED').length,
        revoked: data.filter(cert => cert.status === 'REVOKED').length
      };

      return stats;
    },
    enabled: !!user
  });

  // Get pending certificate requests
  const { data: pendingRequests, isLoading: requestsLoading } = useQuery({
    queryKey: ['pendingRequests', profile?.role],
    queryFn: async () => {
      // Only fetch if user is admin or higher
      if (!profile?.role || !['SA', 'AD'].includes(profile.role)) {
        return { count: 0 };
      }
      
      const { count, error } = await supabase
        .from('certificate_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'PENDING');
      
      if (error) throw error;
      
      return { count: count || 0 };
    },
    enabled: !!profile && ['SA', 'AD'].includes(profile.role)
  });

  // Get certificate trends data
  const { data: trendData, isLoading: trendsLoading } = useQuery({
    queryKey: ['certificateTrends'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('certificate_analytics_monthly_trends');
      
      if (error) throw error;
      
      return data || [];
    },
    enabled: !!user
  });

  // Get status distribution data
  const { data: statusData, isLoading: statusLoading } = useQuery({
    queryKey: ['certificateStatusDistribution'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('certificate_analytics_status_counts');
      
      if (error) throw error;
      
      return data || [];
    },
    enabled: !!user
  });

  const { data: pendingRequest, isLoading: roleRequestLoading } = useQuery({
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
  const isAdmin = profile?.role && ['SA', 'AD'].includes(profile.role);
  const isLoading = systemSettingsLoading || profileLoading || statsLoading || 
                    requestsLoading || trendsLoading || statusLoading || roleRequestLoading;

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

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Breadcrumb navigation */}
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
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
            
            {/* Quick Actions */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <DashboardActionCard
                title="Create Certificate"
                description="Issue a new certificate for an individual"
                icon={<FileText className="h-5 w-5" />}
                to="/certifications"
                buttonText="Create New"
              />
              
              <DashboardActionCard
                title="Batch Upload"
                description="Process multiple certificates at once"
                icon={<Users className="h-5 w-5" />}
                to="/certifications?tab=batch"
                buttonText="Upload Batch"
              />
              
              <DashboardActionCard
                title="Pending Requests"
                description={`${pendingRequests?.count || 0} requests awaiting approval`}
                icon={<Clock className="h-5 w-5" />}
                to="/certifications?tab=requests"
                buttonText="View Requests"
                highlight={pendingRequests?.count > 0}
              />
            </div>

            {/* Charts Section */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Certificate Status Distribution */}
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle>Certificate Status Distribution</CardTitle>
                  <CardDescription>Current status of all certificates</CardDescription>
                </CardHeader>
                <CardContent>
                  <CertificateStatusChart data={statusData} />
                </CardContent>
              </Card>
              
              {/* Certificate Trends */}
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle>Certificate Issuance Trends</CardTitle>
                  <CardDescription>Monthly certificate issuance</CardDescription>
                </CardHeader>
                <CardContent>
                  <CertificateTrendsChart data={trendData} />
                </CardContent>
              </Card>
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
