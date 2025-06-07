
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  FileText, 
  TrendingDown, 
  Users, 
  Award,
  BookOpen,
  Settings,
  Download
} from 'lucide-react';
import { InteractiveCharts } from './InteractiveCharts';
import { CustomReportBuilder } from './CustomReportBuilder';
import { ConversionFunnelAnalytics } from './ConversionFunnelAnalytics';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function AdvancedAnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState('charts');

  const { data: dashboardStats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [
        { data: users, count: usersCount },
        { data: certificates, count: certificatesCount },
        { data: courses, count: coursesCount },
        { data: activeUsers }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('certificates').select('*', { count: 'exact', head: true }),
        supabase.from('courses').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('id').gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      ]);

      return {
        totalUsers: usersCount || 0,
        totalCertificates: certificatesCount || 0,
        totalCourses: coursesCount || 0,
        activeUsers: activeUsers?.length || 0
      };
    }
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Advanced Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive analytics with interactive charts, custom reports, and conversion tracking
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Configure
          </Button>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Export Dashboard
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      {dashboardStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{dashboardStats.totalUsers.toLocaleString()}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Certificates</p>
                  <p className="text-2xl font-bold">{dashboardStats.totalCertificates.toLocaleString()}</p>
                </div>
                <Award className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Courses</p>
                  <p className="text-2xl font-bold">{dashboardStats.totalCourses.toLocaleString()}</p>
                </div>
                <BookOpen className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Users (30d)</p>
                  <p className="text-2xl font-bold">{dashboardStats.activeUsers.toLocaleString()}</p>
                </div>
                <TrendingDown className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="charts" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Interactive Charts
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Custom Reports
          </TabsTrigger>
          <TabsTrigger value="funnels" className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4" />
            Conversion Funnels
          </TabsTrigger>
        </TabsList>

        <TabsContent value="charts" className="space-y-6">
          <InteractiveCharts />
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <CustomReportBuilder />
        </TabsContent>

        <TabsContent value="funnels" className="space-y-6">
          <ConversionFunnelAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
}
