
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { BarChart, ChevronRight, TrendingUp, Award, Clock, AlertCircle, Users, CheckCircle2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

export const CompanyWideMetrics: React.FC = () => {
  const navigate = useNavigate();

  const { data: certificateStats, isLoading } = useQuery({
    queryKey: ['companyWideCertificateStats'],
    queryFn: async () => {
      // Get overall certificate statistics
      const { data: statusCounts, error: statusError } = await supabase
        .rpc('get_certificate_status_counts');
      
      if (statusError) throw statusError;
      
      // Calculate totals from status counts
      let totalActive = 0;
      let totalExpired = 0;
      let totalRevoked = 0;
      let totalCertificates = 0;
      
      statusCounts.forEach((item: {status: string, count: number}) => {
        if (item.status === 'ACTIVE') totalActive = Number(item.count);
        if (item.status === 'EXPIRED') totalExpired = Number(item.count);
        if (item.status === 'REVOKED') totalRevoked = Number(item.count);
        totalCertificates += Number(item.count);
      });

      // Get user count with certificates
      const { count: userCount, error: userError } = await supabase
        .from('certificates')
        .select('user_id', { count: 'exact', head: true })
        .not('user_id', 'is', null);
      
      if (userError) throw userError;

      // Get locations with certificates
      const { count: locationCount, error: locationError } = await supabase
        .from('certificates')
        .select('location_id', { count: 'exact', head: true })
        .not('location_id', 'is', null);

      if (locationError) throw locationError;

      // Get verification count (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { count: verificationCount, error: verificationError } = await supabase
        .from('certificate_verification_logs')
        .select('*', { count: 'exact', head: true })
        .gte('verification_time', thirtyDaysAgo.toISOString());

      if (verificationError) throw verificationError;
      
      return {
        totalCertificates,
        totalActive,
        totalExpired,
        totalRevoked,
        userCount: userCount || 0,
        locationCount: locationCount || 0,
        verificationCount: verificationCount || 0
      };
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const metrics = [
    {
      title: 'Total Certificates',
      value: certificateStats?.totalCertificates || 0,
      icon: Award,
      description: 'Total certificates in the system',
      gradient: 'from-blue-50 to-white',
      iconColor: 'text-blue-600'
    },
    {
      title: 'Active Certificates',
      value: certificateStats?.totalActive || 0,
      icon: CheckCircle2,
      description: 'Currently valid certificates',
      gradient: 'from-green-50 to-white',
      iconColor: 'text-green-600',
      percentChange: +10
    },
    {
      title: 'Expired Certificates',
      value: certificateStats?.totalExpired || 0,
      icon: Clock,
      description: 'Certificates that need renewal',
      gradient: 'from-amber-50 to-white',
      iconColor: 'text-amber-600'
    },
    {
      title: 'Revoked Certificates',
      value: certificateStats?.totalRevoked || 0,
      icon: AlertCircle,
      description: 'Certificates that were revoked',
      gradient: 'from-red-50 to-white',
      iconColor: 'text-red-600'
    }
  ];

  const additionalMetrics = [
    {
      title: 'Certified Users',
      value: certificateStats?.userCount || 0,
      icon: Users,
      trend: 'up',
      trendValue: 12,
      description: 'Users with active certificates'
    },
    {
      title: 'Active Locations',
      value: certificateStats?.locationCount || 0,
      icon: Award,
      trend: 'up',
      trendValue: 5,
      description: 'Locations with certificates'
    },
    {
      title: 'Verifications (30d)',
      value: certificateStats?.verificationCount || 0,
      icon: TrendingUp,
      trend: 'up',
      trendValue: 23,
      description: 'Certificate verifications in last 30 days'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Company-Wide Certificate Metrics</h2>
          <p className="text-muted-foreground">Overview of all certificates across the organization</p>
        </div>
        <Button 
          className="mt-2 md:mt-0"
          onClick={() => navigate('/certificate-analytics')}
        >
          View Full Analytics
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {isLoading ? 
          Array(4).fill(0).map((_, i) => (
            <Card key={i} className="bg-gradient-to-br border-0 shadow-md">
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          ))
        :
          metrics.map((metric, index) => (
            <Card 
              key={index}
              className={`bg-gradient-to-br border-0 shadow-md hover:shadow-lg transition-shadow ${metric.gradient}`}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {metric.title}
                </CardTitle>
                <metric.icon className={`w-4 h-4 ${metric.iconColor}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {metric.value.toLocaleString()}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {metric.description}
                </p>
                {metric.percentChange && (
                  <Badge 
                    variant={metric.percentChange > 0 ? "default" : "destructive"}
                    className="mt-2"
                  >
                    {metric.percentChange > 0 ? '+' : ''}{metric.percentChange}% from last month
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))
        }
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {isLoading ? 
          Array(3).fill(0).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))
        :
          additionalMetrics.map((metric, index) => (
            <Card key={index}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-sm font-medium">
                    {metric.title}
                  </CardTitle>
                  <metric.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <CardDescription>
                  {metric.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="text-2xl font-bold">
                  {metric.value.toLocaleString()}
                </div>
              </CardContent>
              <CardFooter className="pt-0 pb-3">
                <p className={`text-xs flex items-center ${
                  metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  <TrendingUp className="h-3 w-3 mr-1" /> 
                  {metric.trend === 'up' ? '+' : '-'}{metric.trendValue}% from last month
                </p>
              </CardFooter>
            </Card>
          ))
        }
      </div>
    </div>
  );
};
